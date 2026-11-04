"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { BrandLockup } from "@/components/layout/brand-lockup";
import { PRIMARY_NAV } from "@/components/layout/nav-config";
import { authClient } from "@/lib/auth-client";

type HeaderUser = { name?: string | null; email?: string | null };

export function SiteHeader({
  initialUser = null,
}: {
  initialUser?: HeaderUser | null;
}) {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const user = session?.user ?? initialUser;

  return (
    <header className="sticky top-0 z-30 border-b border-[#2f3336] bg-black/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[880px] items-center gap-2 px-4 sm:gap-3">
        <BrandLockup className="min-w-0 shrink" size="sm" />

        <nav className="ml-1 hidden items-center gap-0.5 md:flex">
          {PRIMARY_NAV.filter((item) => item.href !== "/bills/new").map(
            (item) => {
              const active = item.match(pathname);

              return (
                <Link
                  key={item.href}
                  className={clsx(
                    "rounded-full px-3 py-1.5 text-[14px] transition-colors hover:bg-[#e7e9ea]/10",
                    active
                      ? "font-bold text-[#e7e9ea]"
                      : "font-medium text-[#71767b]",
                  )}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            },
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            className="hidden h-9 items-center rounded-full bg-[#1d9bf0] px-4 text-[14px] font-bold text-white hover:bg-[#1a8cd8] md:inline-flex"
            href="/bills/new"
          >
            Post
          </Link>
          {user ? (
            <Link
              className="inline-flex h-9 max-w-[128px] items-center truncate rounded-full border border-[#536471] px-3.5 text-[13px] font-bold hover:bg-[#e7e9ea]/10"
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
