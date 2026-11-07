import { describe, expect, it } from "vitest";

import { isOpenBillPastDue } from "@/lib/bill-state";

describe("open bill expiry", () => {
  it("marks a bill past dueDate as overdue", () => {
    const now = new Date("2026-11-06T12:00:00.000Z");

    expect(isOpenBillPastDue(new Date("2026-11-05T12:00:00.000Z"), now)).toBe(
      true,
    );
    expect(isOpenBillPastDue(new Date("2026-11-06T11:59:59.000Z"), now)).toBe(
      true,
    );
  });

  it("keeps a bill on or after dueDate open", () => {
    const now = new Date("2026-11-06T12:00:00.000Z");

    expect(isOpenBillPastDue(new Date("2026-11-06T12:00:00.000Z"), now)).toBe(
      false,
    );
    expect(isOpenBillPastDue(new Date("2026-11-07T00:00:00.000Z"), now)).toBe(
      false,
    );
  });
});
