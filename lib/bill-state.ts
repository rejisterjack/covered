import { BillStatus } from "@prisma/client";

/** Pure helpers for trust-flow transitions (unit-tested). */

export function canMarkPaid(status: BillStatus, isPoster: boolean) {
  return status === BillStatus.open && !isPoster;
}

export function canConfirm(status: BillStatus, isPoster: boolean) {
  return status === BillStatus.pending_confirmation && isPoster;
}

export function shouldAutoFlag(flagCount: number, threshold: number) {
  return flagCount >= threshold;
}

export function shouldLockPosting(unconfirmedCount: number, threshold: number) {
  return unconfirmedCount >= threshold;
}

export function nextStatusAfterPaid(current: BillStatus): BillStatus | null {
  if (current !== BillStatus.open) return null;

  return BillStatus.pending_confirmation;
}

export function nextStatusAfterConfirm(current: BillStatus): BillStatus | null {
  if (current !== BillStatus.pending_confirmation) return null;

  return BillStatus.covered;
}

export function confirmationDeadline(
  donorMarkedAt: Date,
  windowHours: number,
): Date {
  return new Date(donorMarkedAt.getTime() + windowHours * 60 * 60 * 1000);
}

export function isConfirmationExpired(
  donorMarkedAt: Date,
  now: Date,
  windowHours: number,
) {
  return (
    now.getTime() >= confirmationDeadline(donorMarkedAt, windowHours).getTime()
  );
}
