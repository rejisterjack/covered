"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RedeemInviteForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/invites/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Could not redeem",
        );
        setLoading(false);

        return;
      }

      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <form className="mx-auto max-w-md space-y-4 px-4 py-10" onSubmit={onSubmit}>
      <h1 className="text-[24px] font-extrabold tracking-tight">
        Soft launch invite
      </h1>
      <p className="text-[15px] leading-6 text-[#71767b]">
        Posting is invite-only right now. Redeem a code from the Covered team to
        post a bill.
      </p>
      <label className="block space-y-2 text-[13px] text-[#71767b]">
        <span>Invite code</span>
        <input
          className="x-input uppercase tracking-widest"
          placeholder="ABCD1234"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </label>
      {error ? <p className="text-[14px] text-[#f4212e]">{error}</p> : null}
      <button
        className="x-btn x-btn-primary w-full"
        disabled={loading || !code.trim()}
        type="submit"
      >
        {loading ? "Redeeming…" : "Redeem invite"}
      </button>
    </form>
  );
}
