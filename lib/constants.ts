import type { BillCategory } from "@prisma/client";

export const CATEGORIES: {
  value: BillCategory;
  label: string;
}[] = [
  { value: "medical", label: "Medical" },
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities" },
  { value: "education", label: "Education" },
  { value: "food", label: "Food" },
  { value: "other", label: "Other" },
];

export const PAYMENT_TYPES = [
  { value: "upi", label: "UPI" },
  { value: "venmo", label: "Venmo" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
] as const;

export const FLAG_REASONS = [
  { value: "fake_bill", label: "Fake or misleading bill" },
  { value: "suspicious_payment", label: "Suspicious payment details" },
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "other", label: "Other" },
] as const;

export function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
