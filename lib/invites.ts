import { UserRole } from "@prisma/client";
import { randomBytes } from "crypto";

import { getPlatformSettings, isAdminUser, writeAudit } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function envSoftLaunchEnabled() {
  const raw = process.env.SOFT_LAUNCH_INVITES?.trim().toLowerCase();

  return raw === "1" || raw === "true" || raw === "yes";
}

/** Soft-launch gate is off unless env or PlatformSettings turns it on. */
export async function softLaunchInvitesEnabled() {
  if (envSoftLaunchEnabled()) return true;

  const settings = await getPlatformSettings();

  return settings.softLaunchInvites;
}

export function generateInviteCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function mintInviteCode(input: {
  actorId: string;
  expiresAt?: Date | null;
  count?: number;
}) {
  const count = Math.min(Math.max(input.count ?? 1, 1), 50);
  const codes: string[] = [];

  for (let i = 0; i < count; i += 1) {
    let code = generateInviteCode();
    let attempts = 0;

    while (attempts < 5) {
      try {
        const row = await prisma.inviteCode.create({
          data: {
            code,
            createdById: input.actorId,
            expiresAt: input.expiresAt ?? null,
          },
        });

        codes.push(row.code);
        break;
      } catch {
        code = generateInviteCode();
        attempts += 1;
      }
    }

    if (attempts >= 5) {
      throw new Error("Could not mint unique invite code");
    }
  }

  await writeAudit({
    actorId: input.actorId,
    action: "invite.mint",
    targetType: "invite",
    targetId: codes[0] ?? "batch",
    meta: { count: codes.length, codes },
  });

  return codes;
}

export async function listInviteCodes(take = 50) {
  return prisma.inviteCode.findMany({
    include: {
      createdBy: { select: { id: true, email: true, name: true } },
      redeemedBy: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function userHasRedeemedInvite(userId: string) {
  const redeemed = await prisma.inviteCode.findUnique({
    where: { redeemedById: userId },
    select: { id: true },
  });

  return Boolean(redeemed);
}

export async function canPostUnderSoftLaunch(userId: string) {
  if (!(await softLaunchInvitesEnabled())) {
    return { allowed: true as const, reason: "disabled" as const };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true },
  });

  if (!user) {
    return { allowed: false as const, reason: "missing_user" as const };
  }

  if (isAdminUser(user) || user.role === UserRole.admin) {
    return { allowed: true as const, reason: "admin" as const };
  }

  if (await userHasRedeemedInvite(userId)) {
    return { allowed: true as const, reason: "redeemed" as const };
  }

  return { allowed: false as const, reason: "invite_required" as const };
}

export async function assertCanPostUnderSoftLaunch(userId: string) {
  const gate = await canPostUnderSoftLaunch(userId);

  if (!gate.allowed) {
    throw new Error(
      "Invite required during soft launch. Redeem a code before posting.",
    );
  }
}

export async function redeemInviteCode(userId: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase();

  if (!code || code.length < 4) {
    throw new Error("Invite code is required");
  }

  if (await userHasRedeemedInvite(userId)) {
    throw new Error("You already redeemed an invite");
  }

  const invite = await prisma.inviteCode.findUnique({ where: { code } });

  if (!invite) {
    throw new Error("Invalid invite code");
  }
  if (invite.redeemedById) {
    throw new Error("Invite code already used");
  }
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    throw new Error("Invite code expired");
  }

  const updated = await prisma.inviteCode.updateMany({
    where: { id: invite.id, redeemedById: null },
    data: {
      redeemedById: userId,
      redeemedAt: new Date(),
    },
  });

  if (updated.count !== 1) {
    throw new Error("Invite code already used");
  }

  return prisma.inviteCode.findUniqueOrThrow({ where: { id: invite.id } });
}

export async function updateSoftLaunchInvites(
  softLaunchInvites: boolean,
  actorId: string,
) {
  const settings = await prisma.platformSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      pausePosting: false,
      softLaunchInvites,
      updatedById: actorId,
    },
    update: {
      softLaunchInvites,
      updatedById: actorId,
    },
  });

  await writeAudit({
    actorId,
    action: "settings.soft_launch_invites",
    targetType: "platform",
    targetId: "default",
    meta: { softLaunchInvites },
  });

  return settings;
}
