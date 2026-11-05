"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";

import { PageHeader } from "@/components/layout/page-header";
import { CATEGORIES, PAYMENT_TYPES } from "@/lib/constants";
import { apiOrQueue, enqueueMutation, saveLocalFile } from "@/lib/offline/outbox";
import { uploadFile } from "@/lib/upload-client";

type Step = "photo" | "details" | "payment";

const STEPS: { id: Step; label: string }[] = [
  { id: "photo", label: "Photo" },
  { id: "details", label: "Details" },
  { id: "payment", label: "Payee" },
];

export function PostBillForm({
  defaultCity,
}: {
  defaultCity?: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("photo");
  const [imageUrl, setImageUrl] = useState("");
  const [billerName, setBillerName] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("utilities");
  const [story, setStory] = useState("");
  const [paymentType, setPaymentType] = useState("upi");
  const [paymentHandle, setPaymentHandle] = useState("");
  const [paymentQrUrl, setPaymentQrUrl] = useState<string | undefined>();
  const [locationCity, setLocationCity] = useState(defaultCity ?? "");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onPhoto(file: File | null) {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      if (!navigator.onLine) throw new Error("offline");
      const url = await uploadFile(file, "bill");

      setImageUrl(url);
      setStep("details");
    } catch {
      try {
        const id = await saveLocalFile(file, "bill");

        setImageUrl(`local:${id}`);
        setStep("details");
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function onQr(file: File | null) {
    if (!file) return;
    setLoading(true);
    try {
      if (!navigator.onLine) throw new Error("offline");
      const url = await uploadFile(file, "qr");

      setPaymentQrUrl(url);
    } catch {
      try {
        const id = await saveLocalFile(file, "qr");

        setPaymentQrUrl(`local:${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "QR upload failed");
      }
    } finally {
      setLoading(false);
    }
  }

  function goPayment() {
    setError(null);
    if (!billerName.trim() || !referenceNo.trim() || !amount || !dueDate) {
      setError("Fill biller, reference, amount, and due date");

      return;
    }
    setStep("payment");
  }

  async function submit() {
    setLoading(true);
    setError(null);
    const payload = {
      amount: Number(amount),
      category,
      billerName: billerName.trim(),
      referenceNo: referenceNo.trim(),
      dueDate,
      story: story.trim() || null,
      imageUrl,
      paymentHandle: paymentHandle.trim(),
      paymentType,
      paymentQrUrl: paymentQrUrl?.startsWith("local:") ? undefined : paymentQrUrl,
      locationCity: locationCity || null,
      latitude,
      longitude,
    };
    const files = [
      imageUrl.startsWith("local:")
        ? {
            field: "imageUrl",
            fileId: imageUrl.slice("local:".length),
            purpose: "bill" as const,
          }
        : null,
      paymentQrUrl?.startsWith("local:")
        ? {
            field: "paymentQrUrl",
            fileId: paymentQrUrl.slice("local:".length),
            purpose: "qr" as const,
          }
        : null,
    ].filter((file) => file !== null);

    if (!navigator.onLine || files.length > 0) {
      await enqueueMutation({
        url: "/api/bills",
        json: {
          ...payload,
          imageUrl: imageUrl.startsWith("local:") ? "https://pending.local/bill" : imageUrl,
        },
        files,
      });
      router.push("/app?queued=1");

      return;
    }

    const result = await apiOrQueue("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (result.queued) {
      setError(null);
      router.push("/app?queued=1");

      return;
    }

    const data = await result.response!.json();

    if (!result.response!.ok) {
      setError(data.error ?? "Could not post bill");
      setLoading(false);

      return;
    }

    router.push(`/bills/${data.bill.id}`);
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div>
      <PageHeader
        title="Post a bill"
        subtitle="A real bill owed to a named payee — not a free-form ask."
      />

      <div className="flex border-b border-[#2f3336]">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={clsx(
              "relative flex min-h-11 flex-1 items-center justify-center px-2 text-[13px] sm:text-[14px]",
              i <= stepIndex
                ? "font-bold text-[#e7e9ea]"
                : "font-medium text-[#71767b]",
            )}
          >
            <span className="truncate">
              {i + 1}. {s.label}
            </span>
            {step === s.id ? (
              <span className="absolute bottom-0 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-[#1d9bf0] sm:w-12" />
            ) : null}
          </div>
        ))}
      </div>

      <div className="space-y-5 px-4 py-5">
        {step === "photo" ? (
          <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#2f3336] px-5 py-12 text-center transition-colors hover:bg-[#080808] sm:min-h-[260px] sm:px-6 sm:py-16">
            <span className="text-[17px] font-bold">
              {loading ? "Uploading…" : "Upload bill photo"}
            </span>
            <span className="mt-2 max-w-xs text-[13px] leading-5 text-[#71767b]">
              Photo of the invoice or statement · JPG/PNG/WebP · max 8MB
            </span>
            <input
              accept="image/*"
              className="hidden"
              disabled={loading}
              type="file"
              onChange={(e) => void onPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
        ) : null}

        {step === "details" ? (
          <div className="space-y-4">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Bill"
                className="h-36 w-full rounded-2xl object-cover sm:h-44"
                src={imageUrl}
              />
            ) : null}
            <label className="block space-y-2 text-[13px] text-[#71767b]">
              <span>Biller name (who is owed)</span>
              <input
                required
                className="x-input"
                placeholder="MSEB / landlord / hospital"
                value={billerName}
                onChange={(e) => setBillerName(e.target.value)}
              />
            </label>
            <label className="block space-y-2 text-[13px] text-[#71767b]">
              <span>Reference / account / invoice no.</span>
              <input
                required
                className="x-input"
                placeholder="Consumer or invoice number"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-[13px] text-[#71767b]">
                <span>Amount (₹)</span>
                <input
                  required
                  className="x-input"
                  max={200000}
                  min={1}
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <label className="block space-y-2 text-[13px] text-[#71767b]">
                <span>Due date</span>
                <input
                  required
                  className="x-input"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-[13px] text-[#71767b]">
                <span>Category</span>
                <select
                  className="x-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2 text-[13px] text-[#71767b]">
                <span>City</span>
                <input
                  className="x-input"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                />
                <button
                  className="text-[13px] font-bold text-[#1d9bf0]"
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      setError("This browser has no location");

                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setLatitude(pos.coords.latitude);
                        setLongitude(pos.coords.longitude);
                        setError(null);
                      },
                      () => setError("Location permission was denied"),
                    );
                  }}
                >
                  {latitude != null ? "Location attached" : "Attach location for nearby search"}
                </button>
              </label>
            </div>
            <label className="block space-y-2 text-[13px] text-[#71767b]">
              <span>Optional note</span>
              <textarea
                className="x-input"
                maxLength={280}
                placeholder="One line of context (optional)"
                rows={2}
                value={story}
                onChange={(e) => setStory(e.target.value)}
              />
            </label>
            <button
              className="x-btn x-btn-primary w-full"
              type="button"
              onClick={goPayment}
            >
              Next — payee
            </button>
          </div>
        ) : null}

        {step === "payment" ? (
          <div className="space-y-4">
            <p className="text-[14px] leading-5 text-[#71767b]">
              Payee handle is who the donor pays for{" "}
              <span className="font-bold text-[#e7e9ea]">
                {billerName || "this bill"}
              </span>
              . Use the biller&apos;s UPI / QR when you have it.
            </p>
            <label className="block space-y-2 text-[13px] text-[#71767b]">
              <span>Payment type</span>
              <select
                className="x-input"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
              >
                {PAYMENT_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 text-[13px] text-[#71767b]">
              <span>
                {paymentType === "upi"
                  ? "Payee UPI (name@bank)"
                  : "Payee handle"}
              </span>
              <input
                required
                className="x-input"
                placeholder={
                  paymentType === "upi" ? "biller@oksbi" : "payee handle"
                }
                value={paymentHandle}
                onChange={(e) => setPaymentHandle(e.target.value)}
              />
            </label>
            <label className="block space-y-2 text-[13px] text-[#71767b]">
              <span>Optional payee QR</span>
              <input
                accept="image/*"
                className="x-file"
                type="file"
                onChange={(e) => void onQr(e.target.files?.[0] ?? null)}
              />
              {paymentQrUrl ? (
                <span className="block text-[#1d9bf0]">QR uploaded</span>
              ) : null}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="x-btn x-btn-outline w-full sm:w-auto"
                type="button"
                onClick={() => setStep("details")}
              >
                Back
              </button>
              <button
                className="x-btn x-btn-primary w-full flex-1"
                disabled={loading}
                type="button"
                onClick={() => void submit()}
              >
                {loading ? "Posting…" : "Post bill"}
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-[14px] text-[#f4212e]">{error}</p> : null}
      </div>
    </div>
  );
}
