"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";

import { formatInr } from "@/lib/constants";

type Section =
  "overview" | "flagged" | "pending" | "users" | "bills" | "platform" | "audit";

type Metrics = {
  openBills: number;
  pendingConfirmation: number;
  flagged: number;
  lockedUsers: number;
  coversLast24h: number;
  pausePosting: boolean;
};

const SECTIONS: { id: Section; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "flagged", label: "Flagged" },
  { id: "pending", label: "Pending" },
  { id: "users", label: "Users" },
  { id: "bills", label: "Bills" },
  { id: "platform", label: "Platform" },
  { id: "audit", label: "Audit" },
];

async function adminFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed",
    );
  }

  return data;
}

export function AdminConsole() {
  const [section, setSection] = useState<Section>("overview");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [flagged, setFlagged] = useState<
    Array<{
      id: string;
      amount: number;
      category: string;
      story: string;
      poster: { name: string; email: string };
      flags: Array<{ reason: string }>;
    }>
  >([]);
  const [pendingBills, setPendingBills] = useState<
    Array<{
      id: string;
      amount: number;
      category: string;
      story: string;
      updatedAt: string;
      poster: { name: string; email: string };
      payment: { donor: { name: string; email: string } } | null;
    }>
  >([]);
  const [userQuery, setUserQuery] = useState("");
  const [users, setUsers] = useState<
    Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      postingLocked: boolean;
      isVerifiedPublic: boolean;
      allowlisted: boolean;
    }>
  >([]);
  const [billQuery, setBillQuery] = useState("");
  const [bills, setBills] = useState<
    Array<{
      id: string;
      amount: number;
      category: string;
      story: string;
      status: string;
      deletedAt: string | null;
      poster: { name: string; email: string };
    }>
  >([]);
  const [pausePosting, setPausePosting] = useState(false);
  const [audit, setAudit] = useState<
    Array<{
      id: string;
      action: string;
      targetType: string;
      targetId: string;
      createdAt: string;
      actor: { name: string; email: string };
    }>
  >([]);

  const flash = (msg: string) => {
    setMessage(msg);
    setError(null);
  };

  const loadSection = useCallback((target: Section) => {
    startTransition(async () => {
      setError(null);
      try {
        if (target === "overview") {
          const data = await adminFetch("/api/admin/metrics");

          setMetrics(data.metrics);
          setPausePosting(data.metrics.pausePosting);
        } else if (target === "flagged") {
          const data = await adminFetch("/api/admin/flags");

          setFlagged(data.bills);
        } else if (target === "pending") {
          const data = await adminFetch("/api/admin/pending");

          setPendingBills(data.bills);
        } else if (target === "platform") {
          const data = await adminFetch("/api/admin/settings");

          setPausePosting(data.settings.pausePosting);
        } else if (target === "audit") {
          const data = await adminFetch("/api/admin/audit");

          setAudit(data.logs);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    });
  }, []);

  useEffect(() => {
    loadSection(section);
  }, [section, loadSection]);

  async function runAction(path: string, success: string) {
    setError(null);
    try {
      await adminFetch(path, { method: "POST" });
      flash(success);
      loadSection(section);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  }

  async function searchUsers() {
    setError(null);
    try {
      const data = await adminFetch(
        `/api/admin/users?q=${encodeURIComponent(userQuery)}`,
      );

      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  }

  async function searchBills() {
    setError(null);
    try {
      const data = await adminFetch(
        `/api/admin/bills?q=${encodeURIComponent(billQuery)}`,
      );

      setBills(data.bills);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  }

  async function togglePause() {
    setError(null);
    try {
      const data = await adminFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ pausePosting: !pausePosting }),
      });

      setPausePosting(data.settings.pausePosting);
      flash(data.settings.pausePosting ? "Posting paused" : "Posting resumed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-0 md:flex-row md:gap-6 md:px-4 md:py-4">
      <nav className="hidden w-44 shrink-0 flex-col gap-1 md:flex">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-[#71767b]">
          Admin
        </p>
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            className={`rounded-full px-3 py-2 text-left text-[15px] ${
              section === item.id
                ? "bg-[#e7e9ea]/10 font-bold text-[#e7e9ea]"
                : "text-[#71767b] hover:bg-[#e7e9ea]/05 hover:text-[#e7e9ea]"
            }`}
            type="button"
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1 space-y-4">
        <div className="x-scroll-x border-b border-[#2f3336] md:hidden">
          <div className="flex w-max min-w-full gap-2 px-4 py-2.5">
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
                  section === item.id
                    ? "bg-[#e7e9ea] text-black"
                    : "bg-transparent text-[#71767b]"
                }`}
                type="button"
                onClick={() => setSection(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-[#2f3336] px-4 py-3 md:border-0 md:px-0 md:py-0">
          <h1 className="text-[20px] font-bold text-[#e7e9ea] md:text-2xl">
            {SECTIONS.find((s) => s.id === section)?.label}
          </h1>
        </div>

        <div className="space-y-4 px-4 pb-6 md:px-0">

        {pending ? <p className="text-sm text-[#71767b]">Loading…</p> : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-[#1d9bf0]">{message}</p> : null}

        {section === "overview" && metrics ? (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(
              [
                ["Open bills", metrics.openBills],
                ["Pending confirm", metrics.pendingConfirmation],
                ["Flagged", metrics.flagged],
                ["Locked users", metrics.lockedUsers],
                ["Covers (24h)", metrics.coversLast24h],
                ["Pause posting", metrics.pausePosting ? "ON" : "off"],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-[#2f3336] px-4 py-3"
              >
                <dt className="text-xs text-[#71767b]">{label}</dt>
                <dd className="mt-1 text-xl font-bold text-[#e7e9ea]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {section === "flagged" ? (
          <ul className="divide-y divide-[#2f3336]">
            {flagged.length === 0 ? (
              <li className="py-4 text-sm text-[#71767b]">No flagged bills.</li>
            ) : null}
            {flagged.map((bill) => (
              <li key={bill.id} className="space-y-2 py-4">
                <p className="font-medium text-[#e7e9ea]">
                  {formatInr(bill.amount)} · {bill.category} ·{" "}
                  {bill.flags.length} flags
                </p>
                <p className="text-sm text-[#71767b]">
                  {bill.poster.name} · {bill.poster.email}
                </p>
                <p className="text-sm text-[#e7e9ea]">{bill.story}</p>
                <p className="text-xs text-[#71767b]">
                  Reasons: {bill.flags.map((f) => f.reason).join(", ")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className="text-sm text-[#1d9bf0] hover:underline"
                    href={`/bills/${bill.id}`}
                  >
                    Open
                  </Link>
                  <ActionButton
                    label="Dismiss flags → reopen"
                    onClick={() =>
                      void runAction(
                        `/api/admin/bills/${bill.id}/reopen`,
                        "Bill reopened",
                      )
                    }
                  />
                  <ActionButton
                    danger
                    label="Confirm flag → delete"
                    onClick={() =>
                      void runAction(
                        `/api/admin/bills/${bill.id}/soft-delete`,
                        "Bill soft-deleted",
                      )
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {section === "pending" ? (
          <ul className="divide-y divide-[#2f3336]">
            {pendingBills.length === 0 ? (
              <li className="py-4 text-sm text-[#71767b]">
                No pending confirmations.
              </li>
            ) : null}
            {pendingBills.map((bill) => (
              <li key={bill.id} className="space-y-2 py-4">
                <p className="font-medium text-[#e7e9ea]">
                  {formatInr(bill.amount)} · {bill.category}
                </p>
                <p className="text-sm text-[#71767b]">
                  Poster: {bill.poster.email}
                  {bill.payment ? ` · Donor: ${bill.payment.donor.email}` : ""}
                </p>
                <p className="text-xs text-[#71767b]">
                  Updated {new Date(bill.updatedAt).toLocaleString()}
                </p>
                <ActionButton
                  label="Force reopen"
                  onClick={() =>
                    void runAction(
                      `/api/admin/bills/${bill.id}/force-reopen`,
                      "Bill force-reopened",
                    )
                  }
                />
              </li>
            ))}
          </ul>
        ) : null}

        {section === "users" ? (
          <div className="space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void searchUsers();
              }}
            >
              <input
                className="flex-1 rounded-full border border-[#536471] bg-transparent px-4 py-2 text-sm text-[#e7e9ea] outline-none focus:border-[#1d9bf0]"
                placeholder="Search email or name"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
              />
              <button
                className="rounded-full bg-[#1d9bf0] px-4 py-2 text-sm font-bold text-white"
                type="submit"
              >
                Search
              </button>
            </form>
            <ul className="divide-y divide-[#2f3336]">
              {users.map((user) => (
                <li key={user.id} className="space-y-2 py-4">
                  <p className="font-medium text-[#e7e9ea]">
                    {user.name} · {user.email}
                  </p>
                  <p className="text-xs text-[#71767b]">
                    role={user.role}
                    {user.allowlisted ? " · allowlisted" : ""}
                    {user.postingLocked ? " · locked" : ""}
                    {user.isVerifiedPublic ? " · verified" : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.postingLocked ? (
                      <ActionButton
                        label="Unlock posting"
                        onClick={() =>
                          void runAction(
                            `/api/admin/users/${user.id}/unlock`,
                            "User unlocked",
                          ).then(() => void searchUsers())
                        }
                      />
                    ) : (
                      <ActionButton
                        danger
                        label="Lock posting"
                        onClick={() =>
                          void runAction(
                            `/api/admin/users/${user.id}/lock`,
                            "User locked",
                          ).then(() => void searchUsers())
                        }
                      />
                    )}
                    <ActionButton
                      label={
                        user.isVerifiedPublic
                          ? "Remove verified"
                          : "Mark verified"
                      }
                      onClick={() =>
                        void runAction(
                          `/api/admin/users/${user.id}/verify`,
                          "Verification toggled",
                        ).then(() => void searchUsers())
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {section === "bills" ? (
          <div className="space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void searchBills();
              }}
            >
              <input
                className="flex-1 rounded-full border border-[#536471] bg-transparent px-4 py-2 text-sm text-[#e7e9ea] outline-none focus:border-[#1d9bf0]"
                placeholder="Search by id or story"
                value={billQuery}
                onChange={(e) => setBillQuery(e.target.value)}
              />
              <button
                className="rounded-full bg-[#1d9bf0] px-4 py-2 text-sm font-bold text-white"
                type="submit"
              >
                Search
              </button>
            </form>
            <ul className="divide-y divide-[#2f3336]">
              {bills.map((bill) => (
                <li key={bill.id} className="space-y-2 py-4">
                  <p className="font-medium text-[#e7e9ea]">
                    {formatInr(bill.amount)} · {bill.status}
                    {bill.deletedAt ? " · deleted" : ""}
                  </p>
                  <p className="text-sm text-[#71767b]">
                    {bill.poster.email} · {bill.id}
                  </p>
                  <p className="text-sm text-[#e7e9ea]">{bill.story}</p>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className="text-sm text-[#1d9bf0] hover:underline"
                      href={`/bills/${bill.id}`}
                    >
                      Open
                    </Link>
                    {bill.deletedAt ? (
                      <ActionButton
                        label="Restore"
                        onClick={() =>
                          void runAction(
                            `/api/admin/bills/${bill.id}/restore`,
                            "Bill restored",
                          ).then(() => void searchBills())
                        }
                      />
                    ) : (
                      <ActionButton
                        danger
                        label="Soft-delete"
                        onClick={() =>
                          void runAction(
                            `/api/admin/bills/${bill.id}/soft-delete`,
                            "Bill soft-deleted",
                          ).then(() => void searchBills())
                        }
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {section === "platform" ? (
          <div className="space-y-4 rounded-2xl border border-[#2f3336] p-4">
            <p className="text-sm text-[#e7e9ea]">
              Pause posting is currently{" "}
              <span className="font-bold">{pausePosting ? "ON" : "off"}</span>.
              When on, <code className="text-[#1d9bf0]">POST /api/bills</code>{" "}
              returns 403.
            </p>
            <ActionButton
              danger={!pausePosting}
              label={pausePosting ? "Resume posting" : "Pause posting"}
              onClick={() => void togglePause()}
            />
          </div>
        ) : null}

        {section === "audit" ? (
          <ul className="divide-y divide-[#2f3336]">
            {audit.length === 0 ? (
              <li className="py-4 text-sm text-[#71767b]">No audit entries.</li>
            ) : null}
            {audit.map((log) => (
              <li key={log.id} className="py-3 text-sm">
                <p className="text-[#e7e9ea]">
                  <span className="font-medium">{log.action}</span> ·{" "}
                  {log.targetType}/{log.targetId}
                </p>
                <p className="text-xs text-[#71767b]">
                  {log.actor.email} · {new Date(log.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      className={`rounded-full border px-3 py-1 text-sm ${
        danger
          ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
          : "border-[#536471] text-[#e7e9ea] hover:bg-[#e7e9ea]/10"
      }`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
