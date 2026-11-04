import { BillStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  canConfirm,
  canMarkPaid,
  confirmationDeadline,
  isConfirmationExpired,
  nextStatusAfterConfirm,
  nextStatusAfterPaid,
  shouldAutoFlag,
  shouldLockPosting,
} from "../lib/bill-state";

describe("bill trust transitions", () => {
  it("allows mark paid only for open non-poster", () => {
    expect(canMarkPaid(BillStatus.open, false)).toBe(true);
    expect(canMarkPaid(BillStatus.open, true)).toBe(false);
    expect(canMarkPaid(BillStatus.pending_confirmation, false)).toBe(false);
  });

  it("allows confirm only for pending poster", () => {
    expect(canConfirm(BillStatus.pending_confirmation, true)).toBe(true);
    expect(canConfirm(BillStatus.pending_confirmation, false)).toBe(false);
    expect(canConfirm(BillStatus.open, true)).toBe(false);
  });

  it("maps status transitions", () => {
    expect(nextStatusAfterPaid(BillStatus.open)).toBe(
      BillStatus.pending_confirmation,
    );
    expect(nextStatusAfterPaid(BillStatus.covered)).toBeNull();
    expect(nextStatusAfterConfirm(BillStatus.pending_confirmation)).toBe(
      BillStatus.covered,
    );
  });

  it("flags and locks by thresholds", () => {
    expect(shouldAutoFlag(3, 3)).toBe(true);
    expect(shouldAutoFlag(2, 3)).toBe(false);
    expect(shouldLockPosting(3, 3)).toBe(true);
  });

  it("computes 24h confirmation expiry", () => {
    const marked = new Date("2026-03-26T10:00:00.000Z");
    const deadline = confirmationDeadline(marked, 24);
    expect(deadline.toISOString()).toBe("2026-03-27T10:00:00.000Z");
    expect(
      isConfirmationExpired(marked, new Date("2026-03-27T10:00:00.000Z"), 24),
    ).toBe(true);
    expect(
      isConfirmationExpired(marked, new Date("2026-03-27T09:59:59.000Z"), 24),
    ).toBe(false);
  });
});
