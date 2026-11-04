import Link from "next/link";
import clsx from "clsx";

import { XLogo } from "@/components/brand/x-logo";

export function BrandLockup({
  href = "/",
  size = "md",
  className,
}: {
  href?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const text = size === "sm" ? "text-[14px] sm:text-[15px]" : "text-[17px]";
  const mark = size === "sm" ? 12 : 16;

  return (
    <Link
      className={clsx(
        "inline-flex max-w-full items-center gap-1 font-extrabold tracking-tight text-[#e7e9ea]",
        text,
        className,
      )}
      href={href}
    >
      <span className="truncate">Covered · from</span>
      <XLogo className="shrink-0" size={mark} />
    </Link>
  );
}
