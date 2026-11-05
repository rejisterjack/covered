import Link from "next/link";
import type { Metadata } from "next";

import { CoveredMark } from "@/components/brand/covered-mark";
import { InstallButton } from "@/components/pwa/install-button";

export const metadata: Metadata = {
  title: "Install",
  description: "Install Covered on your phone — open it like an app.",
};

export default function InstallPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-20">
      <CoveredMark
        className="mb-6 shadow-[0_0_0_1px_#2f3336]"
        size={80}
        title="Covered"
      />
      <h1 className="text-[32px] font-extrabold tracking-tight sm:text-[36px]">
        Install Covered
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-6 text-[#71767b] sm:text-[16px]">
        Add Covered to your home screen. It opens full-screen like a native app
        — feed, post a bill, cover someone, climb the leaderboard.
      </p>

      <div className="mt-8 w-full max-w-sm">
        <InstallButton />
      </div>

      <p className="mt-8 text-[13px] text-[#71767b]">
        Prefer the browser?{" "}
        <Link className="font-bold text-[#1d9bf0] hover:underline" href="/app">
          Open Covered in this tab
        </Link>
      </p>
    </div>
  );
}
