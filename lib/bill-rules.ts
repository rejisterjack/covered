import { BillStatus } from "@prisma/client";
import { addDays, startOfDay, subDays } from "date-fns";

/** Active = live on the product path (not soft-deleted). */
export const ACTIVE_BILL_STATUSES: BillStatus[] = [
  BillStatus.open,
  BillStatus.pending_confirmation,
];

export function normalizeBillerName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeReferenceNo(ref: string) {
  return ref.trim().replace(/\s+/g, "").toUpperCase();
}

/** UPI VPA: local@handle (letters, digits, ., _, -). */
const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

export function isValidUpiHandle(handle: string) {
  return UPI_RE.test(handle.trim());
}

export function isValidPayeeHandle(
  handle: string,
  paymentType: "upi" | "venmo" | "paypal" | "other" | string,
) {
  const trimmed = handle.trim();

  if (trimmed.length < 3 || trimmed.length > 120) return false;
  if (paymentType === "upi") return isValidUpiHandle(trimmed);

  return true;
}

export function dueDateBounds(now = new Date()) {
  const today = startOfDay(now);

  return {
    earliest: subDays(today, 180),
    latest: addDays(today, 180),
  };
}

export function isDueDateInWindow(dueDate: Date, now = new Date()) {
  const { earliest, latest } = dueDateBounds(now);
  const d = startOfDay(dueDate);

  return d >= earliest && d <= latest;
}

export function maxBillAmountInr() {
  return 200_000;
}

export function isAmountAllowed(amount: number) {
  return Number.isFinite(amount) && amount > 0 && amount <= maxBillAmountInr();
}

export function assertCanPostBillFacts(input: {
  amount: number;
  billerName: string;
  referenceNo: string;
  dueDate: Date;
  paymentHandle: string;
  paymentType: string;
}) {
  if (!isAmountAllowed(input.amount)) {
    throw new Error(`Amount must be between ₹1 and ₹${maxBillAmountInr()}`);
  }
  if (normalizeBillerName(input.billerName).length < 2) {
    throw new Error("Biller name is required");
  }
  if (normalizeReferenceNo(input.referenceNo).length < 2) {
    throw new Error("Bill / account reference is required");
  }
  if (!isDueDateInWindow(input.dueDate)) {
    throw new Error("Due date must be within 180 days past or ahead");
  }
  if (!isValidPayeeHandle(input.paymentHandle, input.paymentType)) {
    throw new Error(
      input.paymentType === "upi"
        ? "Payee UPI must look like name@bank"
        : "Payee handle is invalid",
    );
  }
}
