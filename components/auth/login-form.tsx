"use client";

import { useState } from "react";

import { BrandLockup } from "@/components/layout/brand-lockup";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.signIn.magicLink({
        email: email.trim().toLowerCase(),
        name: name.trim() || undefined,
        callbackURL: "/profile",
        newUserCallbackURL: "/profile",
        errorCallbackURL: "/login?error=magic_link",
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Failed to send sign-in link");
      }
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send sign-in link",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-14">
      <div className="mb-8 flex flex-col items-center text-center">
        <BrandLockup size="md" />
        <h1 className="mt-6 text-[26px] font-extrabold tracking-tight sm:text-[28px]">
          Sign in
        </h1>
        <p className="mt-2 max-w-sm text-[15px] leading-5 text-[#71767b]">
          We&apos;ll email you a magic link. No password.
        </p>
      </div>

      {sent ? (
        <div className="rounded-2xl border border-[#2f3336] bg-[#080808] px-4 py-4 text-[15px] leading-6 text-[#e7e9ea]">
          Check <strong className="break-all">{email}</strong> for your sign-in
          link.
        </div>
      ) : (
        <form className="space-y-4" onSubmit={sendMagicLink}>
          <label className="block space-y-2 text-[13px] text-[#71767b]">
            <span>Email</span>
            <input
              required
              autoComplete="email"
              className="x-input"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block space-y-2 text-[13px] text-[#71767b]">
            <span>Display name (new accounts)</span>
            <input
              autoComplete="name"
              className="x-input"
              placeholder="Asha"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button
            className="x-btn x-btn-primary w-full"
            disabled={loading}
            type="submit"
          >
            {loading ? "Sending…" : "Next"}
          </button>
        </form>
      )}

      {error ? (
        <p className="mt-4 text-[14px] text-[#f4212e]">{error}</p>
      ) : null}
      <p className="mt-8 text-center text-[12px] leading-4 text-[#71767b]">
        Dev mode logs the magic link to the server console when Resend is not
        configured.
      </p>
    </div>
  );
}
