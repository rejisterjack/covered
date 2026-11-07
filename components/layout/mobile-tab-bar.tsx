"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { PRIMARY_NAV } from "@/components/layout/nav-config";
import {
  ChartIcon,
  ComposeIcon,
  HomeFilledIcon,
  HomeOutlineIcon,
  ProfileFilledIcon,
  ProfileOutlineIcon,
} from "@/components/layout/nav-icons";

function iconFor(href: string, active: boolean) {
  switch (href) {
    case "/app":
      return active ? (
        <HomeFilledIcon size={24} />
      ) : (
        <HomeOutlineIcon size={24} />
      );
    case "/leaderboard":
      return <ChartIcon size={24} />;
    case "/bills/new":
      return <ComposeIcon size={24} />;
    case "/profile":
      return active ? (
        <ProfileFilledIcon size={24} />
      ) : (
        <ProfileOutlineIcon size={24} />
      );
    default:
      return null;
  }
}

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2f3336] bg-black/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md md:hidden">
      <ul className="mx-auto grid h-14 max-w-[880px] grid-cols-4">
        {PRIMARY_NAV.map((tab) => {
          const active = tab.match(pathname);

          return (
            <li key={tab.href} className="min-w-0">
              <Link
                className={clsx(
                  "flex h-full min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
                  active ? "text-[#e7e9ea]" : "text-[#71767b]",
                )}
                href={tab.href}
              >
                {iconFor(tab.href, active)}
                <span className="truncate">{tab.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
