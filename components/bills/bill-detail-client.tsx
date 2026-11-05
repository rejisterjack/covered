"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { FLAG_REASONS, formatInr } from "@/lib/constants";
import { apiOrQueue, enqueueMutation, saveLocalFile } from "@/lib/offline/outbox";
import { uploadFile } from "@/lib/upload-client";

type BillDetail = {
  id: string;
  amount: number;
  category: string;
  billerName: string;
  referenceNo: string;
  dueDate: string;
  story: string;
  imageUrl: string;
  status: string;
  locationCity?: string | null;
  isPoster?: boolean;
  payment: null | {
    paymentHandle: string;
    paymentType: string;
    paymentQrUrl?: string | null;
  };
  poster: { id: string; firstName: string; city?: string | null };
};

function formatDue(iso: string) {
  try {
    // Fixed locale avoids SSR/client hydration mismatch
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function BillDetailClient({
  initialBill,
  initialPaymentMeta,
  signedIn,
}: {
  initialBill: BillDetail;
  initialPaymentMeta: {
    donorMarkedAt?: string;
    posterConfirmedAt?: string | null;
  } | null;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [bill, setBill] = useState(initialBill);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [showFlag, setShowFlag] = useState(false);
  const [loading, setLoading] = useState(false);

  async function coverIntent() {
    if (!signedIn) {
      router.push("/login");

      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/bills/${bill.id}/intent`, { method: "POST" });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not reveal payment details");

      return;
    }
    setBill(data.bill);
    setMessage(
      "Pay the payee outside the app, then upload a payment screenshot and tap I paid this.",
    );
  }

  async function onScreenshot(file: File | null) {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      if (!navigator.onLine) throw new Error("offline");
      const url = await uploadFile(file, "screenshot");

      setScreenshotUrl(url);
    } catch {
      try {
        const id = await saveLocalFile(file, "screenshot");

        setScreenshotUrl(`local:${id}`);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Screenshot upload failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function markPaid() {
    if (!screenshotUrl) {
      setError("Upload a payment screenshot before marking paid");

      return;
    }
    setLoading(true);
    setError(null);
    if (screenshotUrl.startsWith("local:") || !navigator.onLine) {
      await enqueueMutation({
        url: `/api/bills/${bill.id}/paid`,
        json: {
          isAnonymous: anonymous,
          screenshotUrl: screenshotUrl.startsWith("local:")
            ? "https://pending.local/screenshot"
            : screenshotUrl,
        },
        files: screenshotUrl.startsWith("local:")
          ? [
              {
                field: "screenshotUrl",
                fileId: screenshotUrl.slice("local:".length),
                purpose: "screenshot",
              },
            ]
          : [],
      });
      setMessage("Saved offline — we’ll sync when you’re back.");
      setLoading(false);

      return;
    }

    const result = await apiOrQueue(`/api/bills/${bill.id}/paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isAnonymous: anonymous,
        screenshotUrl,
      }),
    });

    if (result.queued) {
      setMessage("Saved offline — we’ll sync when you’re back.");
      setLoading(false);

      return;
    }
    const data = await result.response!.json();

    setLoading(false);
    if (!result.response!.ok) {
      setError(data.error ?? "Could not mark paid");

      return;
    }
    setBill({ ...bill, status: "pending_confirmation" });
    setMessage("Marked paid. Waiting for poster confirmation (24h).");
  }

  async function confirm() {
    setLoading(true);
    const res = await fetch(`/api/bills/${bill.id}/confirm`, {
      method: "POST",
    });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not confirm");

      return;
    }
    setBill({ ...bill, status: "covered" });
    setMessage("Covered — donor is on the leaderboard.");
  }

  async function flag(reason: string) {
    setLoading(true);
    const res = await fetch(`/api/bills/${bill.id}/flags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();

    setLoading(false);
    setShowFlag(false);
    if (!res.ok) {
      setError(data.error ?? "Could not flag");

      return;
    }
    setMessage(
      data.flagged
        ? "Bill auto-flagged after enough reports."
        : "Thanks — flag recorded.",
    );
  }

  return (
    <div>
      <PageHeader
        title={bill.billerName}
        subtitle={`Ref ${bill.referenceNo} · Due ${formatDue(bill.dueDate)}`}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="Bill"
        className="aspect-[4/3] w-full border-b border-[#2f3336] object-cover sm:aspect-[16/9]"
        src={bill.imageUrl}
      />

      <div className="space-y-5 px-4 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16181c] text-[15px] font-bold">
            {(bill.poster.firstName[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0">
            <Link
              className="font-bold hover:underline"
              href={`/u/${bill.poster.id}`}
            >
              {bill.poster.firstName}
            </Link>
            <p className="text-[13px] text-[#71767b]">
              {`${bill.locationCity ?? bill.poster.city ?? "Somewhere"} · #${bill.category}`}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[28px] font-extrabold tracking-tight sm:text-[32px]">
            {formatInr(bill.amount)}
          </p>
          {bill.status !== "covered" ? (
            <p className="mt-1 text-[13px] capitalize text-[#71767b]">
              {bill.status.replaceAll("_", " ")}
            </p>
          ) : null}
        </div>

        {bill.story ? (
          <p className="text-[15px] leading-6 text-[#e7e9ea]">{bill.story}</p>
        ) : null}

        {bill.payment ? (
          <div className="rounded-2xl border border-[#2f3336] bg-[#080808] p-4">
            <p className="text-[13px] font-bold text-[#1d9bf0]">
              Pay this bill&apos;s payee
            </p>
            <p className="mt-2 break-all text-[16px] font-bold leading-6 sm:text-[17px]">
              {bill.payment.paymentType.toUpperCase()}:{" "}
              {bill.payment.paymentHandle}
            </p>
            {bill.payment.paymentQrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Payment QR"
                className="mt-3 h-36 w-36 rounded-xl bg-white object-contain p-2 sm:h-40 sm:w-40"
                src={bill.payment.paymentQrUrl}
              />
            ) : null}
            <p className="mt-3 text-[12px] leading-4 text-[#71767b]">
              Covered never touches money. Pay in GPay, PhonePe, Paytm, Venmo,
              or cash — then upload proof.
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          {bill.status === "open" && !bill.payment ? (
            signedIn ? (
              <button
                className="x-btn x-btn-primary w-full"
                disabled={loading}
                type="button"
                onClick={() => void coverIntent()}
              >
                Cover
              </button>
            ) : (
              <Link className="x-btn x-btn-primary w-full" href="/login">
                Sign in to cover
              </Link>
            )
          ) : null}

          {bill.status === "open" && bill.payment && !bill.isPoster ? (
            <>
              <label className="block space-y-2 text-[13px] text-[#71767b]">
                <span>Payment screenshot (required)</span>
                <input
                  accept="image/*"
                  className="x-file"
                  type="file"
                  onChange={(e) =>
                    void onScreenshot(e.target.files?.[0] ?? null)
                  }
                />
                {screenshotUrl ? (
                  <span className="block text-[#1d9bf0]">Screenshot ready</span>
                ) : null}
              </label>
              <label className="flex items-start gap-2.5 text-[14px] leading-5 text-[#71767b]">
                <input
                  checked={anonymous}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#1d9bf0]"
                  type="checkbox"
                  onChange={(e) => setAnonymous(e.target.checked)}
                />
                Appear as Anonymous on leaderboard
              </label>
              <button
                className="x-btn x-btn-primary w-full"
                disabled={loading || !screenshotUrl}
                type="button"
                onClick={() => void markPaid()}
              >
                I paid this
              </button>
            </>
          ) : null}

          {bill.status === "pending_confirmation" && bill.isPoster ? (
            <button
              className="x-btn x-btn-primary w-full"
              disabled={loading}
              type="button"
              onClick={() => void confirm()}
            >
              Confirm receipt
            </button>
          ) : null}

          {bill.status === "pending_confirmation" && !bill.isPoster ? (
            <p className="rounded-2xl border border-[#2f3336] px-4 py-3 text-[14px] leading-5 text-[#71767b]">
              Waiting for poster confirmation
              {initialPaymentMeta?.donorMarkedAt
                ? ` · marked ${new Date(initialPaymentMeta.donorMarkedAt).toLocaleString()}`
                : ""}
            </p>
          ) : null}

          {bill.status === "covered" ? (
            <p className="rounded-2xl border border-[#1d9bf0]/40 bg-[#1d9bf0]/10 px-4 py-3 text-[14px] text-[#1d9bf0]">
              Covered
            </p>
          ) : null}

          <button
            className="x-btn x-btn-outline w-full"
            type="button"
            onClick={() => setShowFlag((v) => !v)}
          >
            Flag
          </button>
        </div>

        {showFlag ? (
          <div className="overflow-hidden rounded-2xl border border-[#2f3336]">
            {FLAG_REASONS.map((reason) => (
              <button
                key={reason.value}
                className="block w-full border-b border-[#2f3336] px-4 py-3.5 text-left text-[15px] last:border-b-0 hover:bg-[#080808]"
                disabled={loading}
                type="button"
                onClick={() => void flag(reason.value)}
              >
                {reason.label}
              </button>
            ))}
          </div>
        ) : null}

        {message ? (
          <p className="text-[14px] text-[#1d9bf0]">{message}</p>
        ) : null}
        {error ? <p className="text-[14px] text-[#f4212e]">{error}</p> : null}
      </div>
    </div>
  );
}
