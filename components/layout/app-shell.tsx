"use client";

import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SiteHeader } from "@/components/layout/site-header";

export function AppShell({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: { name?: string | null; email?: string | null } | null;
}) {
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
