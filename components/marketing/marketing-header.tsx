"use client";

import Link from "next/link";

import { BrandLockup } from "@/components/layout/brand-lockup";
import { authClient } from "@/lib/auth-client";

type HeaderUser = { name?: string | null; email?: string | null };

export function MarketingHeader({
  initialUser = null,
}: {
  initialUser?: HeaderUser | null;
}) {
  const { data: session } = authClient.useSession();
  const user = session?.user ?? initialUser;

  return (
    <header className="sticky top-0 z-30 border-b border-[#2f3336] bg-black/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4 sm:px-6">
        <BrandLockup className="min-w-0 shrink" href="/" size="sm" />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            className="hidden h-9 items-center rounded-full border border-[#536471] px-3.5 text-[13px] font-bold hover:bg-[#e7e9ea]/10 sm:inline-flex"
            href="/app"
          >
            Open app
          </Link>
          <Link
            className="inline-flex h-9 items-center rounded-full bg-[#1d9bf0] px-3.5 text-[13px] font-bold text-white hover:bg-[#1a8cd8]"
            href="/install"
          >
            Install
          </Link>
          {user ? (
            <Link
              className="inline-flex h-9 max-w-[112px] items-center truncate rounded-full border border-[#536471] px-3.5 text-[13px] font-bold hover:bg-[#e7e9ea]/10"
              href="/profile"
              title={user.email ?? user.name ?? "Profile"}
            >
              {user.name?.split(" ")[0] ?? "You"}
            </Link>
          ) : (
            <Link
              className="inline-flex h-9 items-center rounded-full border border-[#536471] px-3.5 text-[13px] font-bold hover:bg-[#e7e9ea]/10"
              href="/login"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
