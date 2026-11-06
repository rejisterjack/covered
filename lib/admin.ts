import { Prisma, UserRole } from "@prisma/client";

import { isAdminEmail, promoteAdminIfAllowlisted } from "@/lib/admin-allowlist";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest, getSession } from "@/lib/session";

export {
  getAdminEmails,
  isAdminEmail,
  isAdminUser,
  promoteAdminIfAllowlisted,
} from "@/lib/admin-allowlist";

export async function ensureAdminFromSession() {
  const session = await getSession();

  if (!session?.user?.id || !session.user.email) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) return null;

  if (user.role !== UserRole.admin && isAdminEmail(user.email)) {
    return promoteAdminIfAllowlisted(user.id, user.email);
  }

  return user;
}

export async function requireAdminSession() {
  const session = await getSession();

  if (!session?.user) return null;

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) return null;

  if (user.role !== UserRole.admin && isAdminEmail(user.email)) {
    user = await promoteAdminIfAllowlisted(user.id, user.email);
  }

  if (!user || user.role !== UserRole.admin) return null;

  return { session, user };
}

export async function requireAdmin(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session?.user) return null;

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) return null;

  if (user.role !== UserRole.admin && isAdminEmail(user.email)) {
    user = await promoteAdminIfAllowlisted(user.id, user.email);
  }

  if (!user || user.role !== UserRole.admin) return null;

  return { session, user };
}

export async function writeAudit(input: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Record<string, unknown>;
}) {
  return prisma.adminAuditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      meta: (input.meta as Prisma.InputJsonValue | undefined) ?? undefined,
    },
  });
}

export async function getPlatformSettings() {
  return prisma.platformSettings.upsert({
    where: { id: "default" },
    create: { id: "default", pausePosting: false, softLaunchInvites: false },
    update: {},
  });
}

export async function isPostingPaused() {
  const settings = await getPlatformSettings();

  return settings.pausePosting;
}
