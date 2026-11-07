"use client";

import { useEffect, useState } from "react";

import type { useOutboxFlush } from "@/lib/offline/outbox";

type OutboxState = ReturnType<typeof useOutboxFlush>;

export function OutboxBanner({
  outbox,
  className = "border-b border-[#2f3336] px-4 py-2.5",
}: {
  outbox: OutboxState;
  className?: string;
}) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);

    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (outbox.status === "idle") return null;

  const message =
    outbox.status === "error"
      ? outbox.lastFlushError ??
        `${outbox.errorCount} offline action${outbox.errorCount === 1 ? "" : "s"} failed to sync`
      : `${outbox.pendingCount} offline action${outbox.pendingCount === 1 ? "" : "s"} waiting to sync`;

  return (
    <div
      className={`${className} flex items-center justify-between gap-3 text-[13px] ${
        outbox.status === "error" ? "text-[#f4212e]" : "text-[#1d9bf0]"
      }`}
    >
      <p className="min-w-0 flex-1">{message}</p>
      <button
        className="shrink-0 font-bold text-[#1d9bf0] disabled:opacity-50"
        disabled={outbox.flushing || !online}
        type="button"
        onClick={() => void outbox.retry()}
      >
        {outbox.flushing ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}
