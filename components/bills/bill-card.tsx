import Link from "next/link";

import { formatInr } from "@/lib/constants";

export type BillCardData = {
  id: string;
  amount: number;
  category: string;
  billerName: string;
  referenceNo: string;
  dueDate: string;
  story: string;
  locationCity?: string | null;
  createdAt: string;
  status: string;
  poster: {
    firstName: string;
    city?: string | null;
  };
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 60) return `${Math.max(mins, 1)}m`;
  const hours = Math.floor(mins / 60);

  if (hours < 24) return `${hours}h`;

  return `${Math.floor(hours / 24)}d`;
}

function formatDue(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function avatarLetter(name: string) {
  return (name.trim()[0] ?? "?").toUpperCase();
}

export function BillCard({ bill }: { bill: BillCardData }) {
  const city = bill.locationCity ?? bill.poster.city ?? "Somewhere";

  return (
    <Link
      className="block border-b border-[#2f3336] px-4 py-3.5 transition-colors hover:bg-[#080808] active:bg-[#0a0a0a]"
      href={`/bills/${bill.id}`}
    >
      <div className="flex gap-3">
        <div
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16181c] text-[15px] font-bold text-[#e7e9ea]"
        >
          {avatarLetter(bill.poster.firstName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-x-1 text-[15px] leading-5">
            <span className="truncate font-bold text-[#e7e9ea]">
              {bill.poster.firstName}
            </span>
            <span className="shrink-0 text-[#71767b]">
              · {city} · {timeAgo(bill.createdAt)}
            </span>
          </div>
          <p className="mt-1 truncate text-[15px] font-semibold leading-5 text-[#e7e9ea]">
            {bill.billerName}
          </p>
          <p className="mt-0.5 truncate text-[13px] leading-4 text-[#71767b]">
            Ref {bill.referenceNo} · Due {formatDue(bill.dueDate)}
          </p>
          {bill.story ? (
            <p className="mt-1 line-clamp-2 text-[14px] leading-5 text-[#71767b]">
              {bill.story}
            </p>
          ) : null}
          <div className="mt-2.5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[20px] font-extrabold tracking-tight text-[#e7e9ea]">
                {formatInr(bill.amount)}
              </p>
              <span className="mt-1 block text-[13px] capitalize text-[#1d9bf0]">
                #{bill.category}
                {bill.status === "covered" ? " · Covered" : ""}
              </span>
            </div>
            <span className="mb-0.5 shrink-0 rounded-full border border-[#536471] px-4 py-1.5 text-[13px] font-bold text-[#1d9bf0]">
              {bill.status === "covered" ? "View" : "Cover"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
