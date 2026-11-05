import Link from "next/link";

import { BrandLockup } from "@/components/layout/brand-lockup";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#2f3336]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <BrandLockup className="text-[#71767b]" href="/" size="sm" />
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#71767b]">
          <Link className="hover:text-[#e7e9ea]" href="/install">
            Install
          </Link>
          <Link className="hover:text-[#e7e9ea]" href="/app">
            Open app
          </Link>
          <Link className="hover:text-[#e7e9ea]" href="/terms">
            Terms
          </Link>
          <Link className="hover:text-[#e7e9ea]" href="/privacy">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
