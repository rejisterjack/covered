import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  return getAdminEmails().includes(email.trim().toLowerCase());
}

export function isAdminUser(user: {
  role?: string | null;
  email?: string | null;
}): boolean {
  return user.role === UserRole.admin || isAdminEmail(user.email);
}

/** Promote allowlisted emails to admin role (idempotent). */
export async function promoteAdminIfAllowlisted(userId: string, email: string) {
  if (!isAdminEmail(email)) return null;

  return prisma.user.update({
    where: { id: userId },
    data: { role: UserRole.admin },
  });
}
