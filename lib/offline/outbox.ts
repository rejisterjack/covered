"use client";

import { useEffect } from "react";

import { uploadFile } from "@/lib/upload-client";

const DB_NAME = "covered-outbox";
const STORE = "mutations";
const FILES = "files";

export type OutboxFileRef = {
  field: string;
  fileId: string;
  purpose: "bill" | "qr" | "screenshot" | "avatar";
};

export type OutboxItem = {
  id: string;
  url: string;
  method: string;
  body?: string;
  files?: OutboxFileRef[];
  createdAt: number;
};

type StoredFile = {
  id: string;
  purpose: OutboxFileRef["purpose"];
  type: string;
  name: string;
  buffer: ArrayBuffer;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(FILES)) {
        db.createObjectStore(FILES, { keyPath: "id" });
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

export async function saveLocalFile(
  file: File,
  purpose: OutboxFileRef["purpose"],
) {
  const db = await openDb();
  const record: StoredFile = {
    id: crypto.randomUUID(),
    purpose,
    type: file.type || "image/jpeg",
    name: file.name || "upload.jpg",
    buffer: await file.arrayBuffer(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(FILES, "readwrite");

    tx.objectStore(FILES).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return record.id;
}

async function readLocalFile(id: string) {
  const db = await openDb();

  return new Promise<StoredFile | undefined>((resolve, reject) => {
    const tx = db.transaction(FILES, "readonly");
    const req = tx.objectStore(FILES).get(id);

    req.onsuccess = () => resolve(req.result as StoredFile | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function deleteLocalFile(id: string) {
  const db = await openDb();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(FILES, "readwrite");

    tx.objectStore(FILES).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function enqueueMutation(input: {
  url: string;
  method?: string;
  json: Record<string, unknown>;
  files?: OutboxFileRef[];
}) {
  return enqueueOutbox({
    url: input.url,
    method: input.method ?? "POST",
    body: JSON.stringify(input.json),
    files: input.files,
  });
}

export async function flushOutbox() {
  if (!navigator.onLine) return { flushed: 0 };
  const items = await listOutbox();
  let flushed = 0;

  for (const item of items) {
    try {
      let body = item.body;

      if (item.files?.length) {
        const json = body ? (JSON.parse(body) as Record<string, unknown>) : {};

        for (const ref of item.files) {
          const stored = await readLocalFile(ref.fileId);

          if (!stored) throw new Error("Missing queued file");
          const file = new File([stored.buffer], stored.name, {
            type: stored.type,
          });

          json[ref.field] = await uploadFile(file, ref.purpose);
        }
        body = JSON.stringify(json);
      }

      const res = await fetch(item.url, {
        method: item.method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body,
      });

      if (res.ok || res.status === 409) {
        await Promise.all((item.files ?? []).map((ref) => deleteLocalFile(ref.fileId)));
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
