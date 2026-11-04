import { describe, expect, it } from "vitest";

import {
  assertCanPostBillFacts,
  isAmountAllowed,
  isDueDateInWindow,
  isValidPayeeHandle,
  isValidUpiHandle,
  normalizeBillerName,
  normalizeReferenceNo,
} from "../lib/bill-rules";

describe("bill posting rules", () => {
  it("validates UPI shape", () => {
    expect(isValidUpiHandle("name@oksbi")).toBe(true);
    expect(isValidUpiHandle("a.b_1-2@paytm")).toBe(true);
    expect(isValidUpiHandle("not-an-upi")).toBe(false);
    expect(isValidUpiHandle("@bank")).toBe(false);
    expect(isValidPayeeHandle("name@oksbi", "upi")).toBe(true);
    expect(isValidPayeeHandle("venmo-user", "venmo")).toBe(true);
  });

  it("keeps due dates inside ±180 days", () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    expect(isDueDateInWindow(new Date("2026-06-15"), now)).toBe(true);
    expect(isDueDateInWindow(new Date("2026-01-01"), now)).toBe(true);
    expect(isDueDateInWindow(new Date("2025-01-01"), now)).toBe(false);
    expect(isDueDateInWindow(new Date("2027-06-01"), now)).toBe(false);
  });

  it("caps amount at 2 lakh", () => {
    expect(isAmountAllowed(1)).toBe(true);
    expect(isAmountAllowed(200_000)).toBe(true);
    expect(isAmountAllowed(200_001)).toBe(false);
    expect(isAmountAllowed(0)).toBe(false);
  });

  it("normalizes biller and reference for duplicate keys", () => {
    expect(normalizeBillerName("  MSEB  Power  ")).toBe("mseb power");
    expect(normalizeReferenceNo(" ab 12-3 ")).toBe("AB12-3");
  });

  it("assertCanPostBillFacts rejects bad UPI", () => {
    expect(() =>
      assertCanPostBillFacts({
        amount: 1000,
        billerName: "MSEB",
        referenceNo: "123",
        dueDate: new Date(),
        paymentHandle: "bad",
        paymentType: "upi",
      }),
    ).toThrow(/UPI/);
  });
});
