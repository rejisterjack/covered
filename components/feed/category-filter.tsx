"use client";

import clsx from "clsx";

import { CATEGORIES } from "@/lib/constants";

export function CategoryFilter({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value?: string) => void;
}) {
  return (
    <div className="x-scroll-x border-b border-[#2f3336]">
      <div className="flex w-max min-w-full gap-2 px-4 py-2.5">
        <button
          className={clsx(
            "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold",
            !value
              ? "bg-[#e7e9ea] text-black"
              : "bg-transparent text-[#71767b] hover:bg-[#e7e9ea]/1",
          )}
          type="button"
          onClick={() => onChange(undefined)}
        >
          All
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category.value}
            className={clsx(
              "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold capitalize",
              value === category.value
                ? "bg-[#e7e9ea] text-black"
                : "bg-transparent text-[#71767b] hover:bg-[#e7e9ea]/1",
            )}
            type="button"
            onClick={() => onChange(category.value)}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
}
