"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";

import { BillCard, type BillCardData } from "@/components/bills/bill-card";
import { CategoryFilter } from "@/components/feed/category-filter";
import { FeedTabs, type FeedTabId } from "@/components/feed/feed-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { OutboxBanner } from "@/components/offline/outbox-banner";
import { useOutboxFlush } from "@/lib/offline/outbox";

export function FeedClient({
  initialBills = [],
}: {
  initialBills?: BillCardData[];
}) {
  const [tab, setTab] = useState<FeedTabId>("new");
  const [category, setCategory] = useState<string>();
  const [near, setNear] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [bills, setBills] = useState<BillCardData[]>(initialBills);
  const snapshotRef = useRef(initialBills);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [pending, startTransition] = useTransition();

  const outbox = useOutboxFlush();

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);

    setOffline(!navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const cacheKey = `covered:feed:${tab}:${category ?? "all"}:${near ? `${near.lat.toFixed(2)}:${radiusKm}` : "anywhere"}`;

    const defaultSnapshot =
      tab === "new" && !category && !near ? snapshotRef.current : [];

    try {
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        setBills(JSON.parse(cached));
      } else if (defaultSnapshot.length > 0) {
        setBills(defaultSnapshot);
        localStorage.setItem(cacheKey, JSON.stringify(defaultSnapshot));
      } else {
        setBills([]);
      }
    } catch {
      setBills(defaultSnapshot);
    }

    startTransition(async () => {
      setError(null);
      const params = new URLSearchParams({ tab });

      if (category) params.set("category", category);
      if (near) {
        params.set("lat", String(near.lat));
        params.set("lng", String(near.lng));
        params.set("radiusKm", String(radiusKm));
      }
      try {
        const res = await fetch(`/api/bills?${params.toString()}`);

        if (!res.ok) throw new Error("Could not load feed");
        const data = await res.json();

        setBills(data.bills ?? []);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data.bills ?? []));
        } catch {
          // ignore
        }
      } catch {
        setOffline(true);
        try {
          const cached = localStorage.getItem(cacheKey);

          if (cached) {
            setBills(JSON.parse(cached));
            setError(null);

            return;
          }
        } catch {
          // ignore
        }
        if (defaultSnapshot.length > 0) {
          setBills(defaultSnapshot);
        }
        setError(null);
      }
    });
  }, [tab, category, near, radiusKm]);

  return (
    <div>
      <PageHeader
        title="Bills"
        subtitle="Open bills people need covered"
      />
      <FeedTabs value={tab} onChange={setTab} />
      <CategoryFilter value={category} onChange={setCategory} />
      <div className="flex items-center gap-3 border-b border-[#2f3336] px-4 py-2.5">
        <button
          className="text-[13px] font-bold text-[#1d9bf0]"
          type="button"
          onClick={() => {
            if (near) {
              setNear(null);

              return;
            }
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition((pos) => {
              setNear({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
            });
          }}
        >
          {near ? "Anywhere" : "Near me"}
        </button>
        {near ? (
          <select
            className="bg-transparent text-[13px] text-[#e7e9ea]"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((km) => (
              <option key={km} value={km}>
                {km} km
              </option>
            ))}
          </select>
        ) : null}
      </div>
      {offline ? (
        <p className="border-b border-[#2f3336] px-4 py-2.5 text-[13px] text-[#1d9bf0]">
          Offline — showing cached feed when available.
        </p>
      ) : null}
      <OutboxBanner outbox={outbox} />
      {pending && bills.length === 0 ? (
        <p className="px-4 py-10 text-center text-[15px] text-[#71767b]">
          Loading…
        </p>
      ) : null}
      {error ? (
        <p className="px-4 py-10 text-center text-[15px] text-[#71767b]">
          {error}
        </p>
      ) : null}
      {!pending && !error && bills.length === 0 ? (
        <div className="space-y-6 px-4 py-10 sm:px-8">
          <div className="mx-auto max-w-md text-center">
            <p className="text-[24px] font-extrabold tracking-tight sm:text-[28px]">
              Cover a bill
            </p>
            <p className="mt-2 text-[15px] leading-6 text-[#71767b]">
              Peer-to-peer bill covering. Covered never touches the money — you
              pay the poster directly.
            </p>
          </div>

          <ol className="mx-auto max-w-md space-y-3 text-[15px]">
            {[
              "Someone posts a bill with their UPI / payment handle",
              "You tap Cover and pay them directly",
              "They confirm receipt — you climb the leaderboard",
            ].map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="w-5 shrink-0 font-bold text-[#1d9bf0]">
                  {i + 1}
                </span>
                <span className="text-[#e7e9ea]">{step}</span>
              </li>
            ))}
          </ol>

          <div className="text-center">
            <Link className="x-btn x-btn-primary inline-flex" href="/bills/new">
              Post a bill
            </Link>
          </div>
        </div>
      ) : null}
      <div>
        {bills.map((bill) => (
          <BillCard key={bill.id} bill={bill} />
        ))}
      </div>
    </div>
  );
}
