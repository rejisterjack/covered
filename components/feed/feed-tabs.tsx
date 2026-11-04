"use client";

import clsx from "clsx";

const tabs = [
  { id: "new", label: "New" },
  { id: "hot", label: "Hot" },
  { id: "covered", label: "Just Covered" },
] as const;

export type FeedTabId = (typeof tabs)[number]["id"];

export function FeedTabs({
  value,
  onChange,
}: {
  value: FeedTabId;
  onChange: (tab: FeedTabId) => void;
}) {
  return (
    <div className="sticky top-14 z-20 flex border-b border-[#2f3336] bg-black/85 backdrop-blur-md">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={clsx(
            "relative flex min-h-12 flex-1 items-center justify-center px-2 py-3 text-[14px] sm:text-[15px] transition-colors hover:bg-[#e7e9ea]/03",
            value === tab.id
              ? "font-bold text-[#e7e9ea]"
              : "font-medium text-[#71767b]",
          )}
          type="button"
          onClick={() => onChange(tab.id)}
        >
          <span className="truncate">{tab.label}</span>
          {value === tab.id ? (
            <span className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-[#1d9bf0] sm:w-14" />
          ) : null}
        </button>
      ))}
    </div>
  );
}
