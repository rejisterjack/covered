"use client";

import { useEffect } from "react";

const DB_NAME = "covered-outbox";
const STORE = "mutations";

export type OutboxItem = {
  id: string;
  url: string;
  method: string;
  body?: string;
  createdAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueOutbox(
  item: Omit<OutboxItem, "id" | "createdAt">,
) {
  const db = await openDb();
  const record: OutboxItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");

    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return record;
}

export async function listOutbox() {
  const db = await openDb();

  return new Promise<OutboxItem[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();

    req.onsuccess = () => resolve(req.result as OutboxItem[]);
    req.onerror = () => reject(req.error);
  });
}

export async function removeOutbox(id: string) {
  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");

    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function flushOutbox() {
  if (!navigator.onLine) return { flushed: 0 };
  const items = await listOutbox();
  let flushed = 0;

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.body ? { "Content-Type": "application/json" } : undefined,
        body: item.body,
      });

      if (res.ok || res.status === 409) {
        await removeOutbox(item.id);
        flushed += 1;
      }
    } catch {
      // keep for next online event
    }
  }

  return { flushed };
}

export function useOutboxFlush() {
  useEffect(() => {
    const run = () => {
      void flushOutbox();
    };

    run();
    window.addEventListener("online", run);

    return () => window.removeEventListener("online", run);
  }, []);
}

export async function apiOrQueue(
  url: string,
  init: RequestInit & { queueWhenOffline?: boolean } = {},
) {
  const queueWhenOffline = init.queueWhenOffline ?? true;

  try {
    if (!navigator.onLine && queueWhenOffline) {
      await enqueueOutbox({
        url,
        method: init.method ?? "POST",
        body: typeof init.body === "string" ? init.body : undefined,
      });

      return { queued: true as const, response: null };
    }
    const response = await fetch(url, init);

    if (!response.ok && queueWhenOffline && !navigator.onLine) {
      await enqueueOutbox({
        url,
        method: init.method ?? "POST",
        body: typeof init.body === "string" ? init.body : undefined,
      });

      return { queued: true as const, response: null };
    }

    return { queued: false as const, response };
  } catch {
    if (queueWhenOffline) {
      await enqueueOutbox({
        url,
        method: init.method ?? "POST",
        body: typeof init.body === "string" ? init.body : undefined,
      });

      return { queued: true as const, response: null };
    }
    throw new Error("Network error");
  }
}
