"use client";

import { usePathname } from "next/navigation";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { isMarketingPath } from "@/components/layout/nav-config";
import { SiteHeader } from "@/components/layout/site-header";

export function AppShell({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: { name?: string | null; email?: string | null } | null;
}) {
  const pathname = usePathname();
  const marketing = isMarketingPath(pathname);

  if (marketing) {
    return (
      <div className="min-h-dvh bg-black text-[#e7e9ea]">
        <MarketingHeader initialUser={initialUser} />
        <main className="min-h-[calc(100dvh-3.5rem)]">{children}</main>
        <MarketingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black text-[#e7e9ea]">
      <SiteHeader initialUser={initialUser} />

      <div className="mx-auto w-full max-w-[880px]">
        <main className="min-h-[calc(100dvh-3.5rem)] pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          {children}
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}
