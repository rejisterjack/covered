import { BillStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  isAdminEmail,
  isAdminUser,
  getAdminEmails,
} from "../lib/admin-allowlist";
import {
  publicBillVisibilityWhere,
  shouldRejectPostingWhenPaused,
} from "../lib/admin-ops";

describe("admin allowlist", () => {
  it("parses ADMIN_EMAILS", () => {
    const prev = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = " Ops@Example.com , you@test.com ";
    expect(getAdminEmails()).toEqual(["ops@example.com", "you@test.com"]);
    expect(isAdminEmail("OPS@example.com")).toBe(true);
    expect(isAdminEmail("other@test.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    process.env.ADMIN_EMAILS = prev;
  });

  it("treats role=admin or allowlisted email as admin", () => {
    expect(isAdminUser({ role: "admin", email: "x@y.com" })).toBe(true);
    expect(isAdminUser({ role: "user", email: "nope@x.com" })).toBe(false);
  });
});

describe("admin feed / pause gates", () => {
  it("excludes soft-deleted and flagged from public visibility filter", () => {
    expect(publicBillVisibilityWhere()).toEqual({
      deletedAt: null,
      status: { not: BillStatus.flagged },
    });
  });

  it("rejects posting when pause is on", () => {
    expect(shouldRejectPostingWhenPaused(true)).toBe(true);
    expect(shouldRejectPostingWhenPaused(false)).toBe(false);
  });
});
