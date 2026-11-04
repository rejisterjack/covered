"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { formatInr } from "@/lib/constants";
import { authClient } from "@/lib/auth-client";

type Profile = {
  id: string;
  name: string;
  email?: string | null;
  city?: string | null;
  upiId?: string | null;
  isAnonymousDefault: boolean;
  postingLocked: boolean;
  totalGiven: number;
  billsCovered: number;
  billsPosted: number;
};

export function ProfileForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [city, setCity] = useState(initial.city ?? "");
  const [upiId, setUpiId] = useState(initial.upiId ?? "");
  const [isAnonymousDefault, setIsAnonymousDefault] = useState(
    initial.isAnonymousDefault,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        city: city || null,
        upiId: upiId || null,
        isAnonymousDefault,
      }),
    });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save");

      return;
    }
    setMessage("Saved");
    router.refresh();
  }

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle={`${initial.email ?? "Signed in"} · ${initial.billsPosted} posted · ${initial.billsCovered} covered`}
      />

      <div className="border-b border-[#2f3336] px-4 py-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[18px] font-extrabold tabular-nums sm:text-[20px]">
              {formatInr(initial.totalGiven)}
            </p>
            <p className="mt-0.5 text-[12px] text-[#71767b]">Given</p>
          </div>
          <div>
            <p className="text-[18px] font-extrabold tabular-nums sm:text-[20px]">
              {initial.billsCovered}
            </p>
            <p className="mt-0.5 text-[12px] text-[#71767b]">Covered</p>
          </div>
          <div>
            <p className="text-[18px] font-extrabold tabular-nums sm:text-[20px]">
              {initial.billsPosted}
            </p>
            <p className="mt-0.5 text-[12px] text-[#71767b]">Posted</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5">
        {initial.postingLocked ? (
          <p className="mb-4 rounded-2xl border border-[#f4212e]/40 bg-[#f4212e]/10 px-4 py-3 text-[14px] leading-5 text-[#f4212e]">
            Posting locked pending review.
          </p>
        ) : null}

        <form className="space-y-4" onSubmit={save}>
          <label className="block space-y-2 text-[13px] text-[#71767b]">
            <span>Display name</span>
            <input
              required
              className="x-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block space-y-2 text-[13px] text-[#71767b]">
            <span>City</span>
            <input
              className="x-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <label className="block space-y-2 text-[13px] text-[#71767b]">
            <span>Default UPI (prefill only)</span>
            <input
              className="x-input"
              placeholder="name@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
            />
          </label>
          <label className="flex items-start gap-2.5 text-[14px] leading-5 text-[#e7e9ea]">
            <input
              checked={isAnonymousDefault}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#1d9bf0]"
              type="checkbox"
              onChange={(e) => setIsAnonymousDefault(e.target.checked)}
            />
            Prefer anonymous on leaderboard
          </label>
          <button
            className="x-btn x-btn-primary w-full"
            disabled={loading}
            type="submit"
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </form>

        <button
          className="x-btn x-btn-outline mt-3 w-full"
          type="button"
          onClick={() => void signOut()}
        >
          Sign out
        </button>

        {message ? (
          <p className="mt-3 text-[14px] text-[#1d9bf0]">{message}</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-[14px] text-[#f4212e]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
