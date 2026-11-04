"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";

import { PageHeader } from "@/components/layout/page-header";
import { formatInr } from "@/lib/constants";

type Entry = {
  rank: number;
  id: string;
  name: string;
  city?: string | null;
  isVerifiedPublic: boolean;
  totalGiven: number;
  billsCovered: number;
};

export function LeaderboardClient() {
  const [period, setPeriod] = useState<"all" | "month">("all");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/leaderboard?period=${period}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error ?? "Failed");
        setEntries(data.entries ?? []);
        localStorage.setItem(
          `covered:leaderboard:${period}`,
          JSON.stringify(data.entries ?? []),
        );
        setError(null);
      } catch {
        const cached = localStorage.getItem(`covered:leaderboard:${period}`);

        if (cached) {
          setEntries(JSON.parse(cached));
          setError("Offline — showing cached leaderboard.");
        } else {
          setError("We’ll sync when you’re back.");
        }
      }
    })();
  }, [period]);

  return (
    <div>
      <PageHeader
        title="Leaderboard"
        subtitle="People who covered bills — ranked by giving"
      />

      <div className="sticky top-14 z-20 flex border-b border-[#2f3336] bg-black/85 backdrop-blur-md">
        {(
          [
            ["all", "All-time"],
            ["month", "This month"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={clsx(
              "relative flex min-h-12 flex-1 items-center justify-center px-2 py-3 text-[14px] sm:text-[15px] hover:bg-[#e7e9ea]/03",
              period === id
                ? "font-bold text-[#e7e9ea]"
                : "font-medium text-[#71767b]",
            )}
            type="button"
            onClick={() => setPeriod(id)}
          >
            {label}
            {period === id ? (
              <span className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-[#1d9bf0] sm:w-14" />
            ) : null}
          </button>
        ))}
      </div>

      {error ? (
        <p className="border-b border-[#2f3336] px-4 py-2.5 text-[13px] text-[#1d9bf0]">
          {error}
        </p>
      ) : null}

      <ol>
        {entries.map((entry) => (
          <li
            key={`${entry.id}-${entry.rank}`}
            className="flex items-center gap-3 border-b border-[#2f3336] px-4 py-3.5 hover:bg-[#080808]"
          >
            <span className="w-7 shrink-0 text-[14px] tabular-nums text-[#71767b] sm:w-8 sm:text-[15px]">
              #{entry.rank}
            </span>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16181c] text-[15px] font-bold">
              {(entry.name[0] ?? "?").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                className="block truncate font-bold hover:underline"
                href={`/u/${entry.id}`}
              >
                {entry.name}
                {entry.isVerifiedPublic ? " ✓" : ""}
              </Link>
              <p className="truncate text-[13px] text-[#71767b]">
                {entry.billsCovered}{" "}
                {entry.billsCovered === 1 ? "bill" : "bills"}
                {entry.city ? ` · ${entry.city}` : ""}
              </p>
            </div>
            <span className="shrink-0 text-[14px] font-bold tabular-nums text-[#e7e9ea] sm:text-[15px]">
              {formatInr(entry.totalGiven)}
            </span>
          </li>
        ))}
      </ol>

      {entries.length === 0 && !error ? (
        <p className="px-4 py-16 text-center text-[15px] text-[#71767b]">
          No covers yet. Be first.
        </p>
      ) : null}
    </div>
  );
}
