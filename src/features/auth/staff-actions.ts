"use server";

import type { ZodError } from "zod";

import { APP_URL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { sendAgentInvitationEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity-log";
import {
  notifyInvitationAccepted,
  notifyInvitationCreated,
  notifyInvitationRevoked,
} from "@/features/notifications/server/notify-events";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessDashboard, isAdmin } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";
import { generateInviteToken, hashInviteToken } from "@/lib/security/token";
import {
  promoteInvitationAvatar,
  uploadInvitationAvatar,
} from "@/lib/supabase/storage";
import { acceptInvitationApiSchema, createInvitationSchema } from "@/schemas/invitation.schema";
import type { InvitationStatus, UserRole } from "@/generated/prisma/enums";

import { acceptInvitationSchema, loginWithPasswordSchema } from "./schemas";

const INVITATION_TTL_DAYS = 7;

export type StaffAuthResult =
  | { ok: true }
  | { ok: false; error: string; reason?: "credentials" | "not_staff" | "inactive" };

function firstIssueMessage(error: ZodError) {
  return error.issues[0]?.message ?? "Invalid input";
}

/**
 * Staff/CRM login. Authenticates against Supabase, then confirms the user is an
 * active staff member (ADMIN/MANAGER/AGENT — never USER). On any failure the
 * session is signed back out so a USER can never hold a dashboard session.
 */
export async function signInStaff(input: unknown): Promise<StaffAuthResult> {
  const parsed = loginWithPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error), reason: "credentials" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return { ok: false, error: "Incorrect email or password", reason: "credentials" };
  }

  const profile = await prisma.profile.findUnique({ where: { id: data.user.id } });

  if (!profile || !canAccessDashboard(profile.role)) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "This account doesn't have access to the dashboard.",
      reason: "not_staff",
    };
  }

  if (profile.status !== "ACTIVE") {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "Your account is inactive. Please contact an administrator.",
      reason: "inactive",
    };
  }

  return { ok: true };
}

export type CreateInvitationResult =
  | { ok: true; invitationId: string; inviteUrl: string; emailSent: boolean }
  | { ok: false; error: string };

/**
 * Admin-only: create a staff invitation, persist a hashed token, and email the
 * one-time accept link. The raw token is returned (inside the invite URL) only
 * to the caller — never stored. Role is constrained to AGENT/MANAGER; a USER
 * (or another ADMIN) can never be invited this way.
 */
export async function createAgentInvitation(
  input: unknown,
): Promise<CreateInvitationResult> {
  const parsed = createInvitationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error) };
  }

  // Authz: only an ACTIVE user with the agents:invite permission (ADMIN) may invite.
  const authz = await requirePermission("agents:invite");
  if (!authz.ok) return { ok: false, error: authz.error };
  const inviter = authz.profile;

  const { email, role, firstName, lastName, phone, location, notes, teamLeaderId } = parsed.data;

  // Defense-in-depth for the optional future where MANAGER gets agents:invite:
  // a non-ADMIN inviter may only ever invite AGENTs, never MANAGERs (or above).
  if (!isAdmin(inviter.role) && role !== "AGENT") {
    return { ok: false, error: "You can only invite agents." };
  }

  if (teamLeaderId) {
    const leader = await prisma.profile.findUnique({
      where: { id: teamLeaderId },
      select: { role: true, status: true },
    });
    if (!leader || (leader.role !== "MANAGER" && leader.role !== "ADMIN") || leader.status !== "ACTIVE") {
      return { ok: false, error: "Team leader must be an active Manager or Admin." };
    }
  }

  // Reject if the email already belongs to an account.
  const existingProfile = await prisma.profile.findUnique({ where: { email } });
  if (existingProfile) {
    return { ok: false, error: "An account with this email already exists." };
  }

  // Supersede any earlier pending invite for this email so only one is live.
  await prisma.agentInvitation.updateMany({
    where: { email, status: "PENDING" },
    data: { status: "REVOKED" },
  });

  const rawToken = generateInviteToken();
  const expiresAt = new Date(
    Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  const invitation = await prisma.agentInvitation.create({
    data: {
      email,
      role: role as UserRole,
      tokenHash: hashInviteToken(rawToken),
      invitedById: inviter.id,
      expiresAt,
      status: "PENDING",
      firstName,
      lastName,
      phone,
      location,
      notes,
      teamLeaderId,
    },
  });

  await logActivity({
    actorId: inviter.id,
    action: "INVITATION_CREATED",
    entityType: "AGENT_INVITATION",
    entityId: invitation.id,
    newValues: { email, role, expiresAt: expiresAt.toISOString() },
  });
  await notifyInvitationCreated({
    invitationId: invitation.id,
    invitedEmail: email,
    role,
    actorId: inviter.id,
    actorName: inviter.fullName ?? inviter.email,
  });

  const inviteUrl = `${APP_URL}/invite/${rawToken}`;
  const emailResult = await sendAgentInvitationEmail({
    to: email,
    inviteUrl,
    role,
    expiresInDays: INVITATION_TTL_DAYS,
  });

  return { ok: true, invitationId: invitation.id, inviteUrl, emailSent: emailResult.sent };
}

const MAX_INVITATION_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB, matches the agent/self-service photo limit
const ALLOWED_INVITATION_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export type SetInvitationAvatarResult = { ok: true } | { ok: false; error: string };

/**
 * Admin-only: stage a photo for a not-yet-accepted invitation (no Profile id
 * exists yet to upload against). Promoted to the real Profile's avatar path
 * once the invite is accepted — see promoteInvitationAvatar.
 */
export async function setInvitationAvatar(
  invitationId: string,
  file: File,
): Promise<SetInvitationAvatarResult> {
  const authz = await requirePermission("agents:invite");
  if (!authz.ok) return { ok: false, error: authz.error };

  const invitation = await prisma.agentInvitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.status !== "PENDING") {
    return { ok: false, error: "Invitation not found." };
  }

  if (file.size > MAX_INVITATION_AVATAR_BYTES) {
    return { ok: false, error: "Image must be smaller than 5MB." };
  }
  if (!ALLOWED_INVITATION_AVATAR_TYPES.has(file.type)) {
    return { ok: false, error: "Image must be a PNG, JPEG, WEBP or GIF." };
  }

  try {
    const avatarPath = await uploadInvitationAvatar(invitationId, file);
    await prisma.agentInvitation.update({ where: { id: invitationId }, data: { avatarPath } });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to upload photo." };
  }
}

/**
 * Copies the invite's staged extras (city/notes/team leader/avatar) onto the
 * just-created Profile. Called after both accept flows' upsert. Best-effort:
 * an avatar-promotion failure never blocks account creation.
 */
async function applyInvitationExtras(
  invitation: { location: string | null; notes: string | null; teamLeaderId: string | null; avatarPath: string | null },
  profileId: string,
): Promise<void> {
  const avatarUrl = invitation.avatarPath
    ? await promoteInvitationAvatar(invitation.avatarPath, profileId)
    : null;

  if (invitation.location || invitation.notes || invitation.teamLeaderId || avatarUrl) {
    await prisma.profile.update({
      where: { id: profileId },
      data: {
        ...(invitation.location ? { city: invitation.location } : {}),
        ...(invitation.notes ? { notes: invitation.notes } : {}),
        ...(invitation.teamLeaderId ? { teamLeaderId: invitation.teamLeaderId } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
      },
    });
  }
}

export type InvitationInfo = {
  ok: true;
  email: string;
  role: string;
} | {
  ok: false;
  error: string;
};

export type InvitationValidation =
  | { valid: true; email: string; role: UserRole; expiresAt: string }
  | { valid: false; reason: "INVALID" | "EXPIRED" | "ACCEPTED" | "REVOKED" };

/**
 * Resolve + validate an invitation token (read-only). Used by the
 * /api/invitations/validate route and the /invite/[token] page. Flips a
 * timed-out PENDING invite to EXPIRED as a side effect, but never consumes it.
 */
export async function validateInvitationToken(token: string): Promise<InvitationValidation> {
  if (!token) return { valid: false, reason: "INVALID" };

  const invitation = await prisma.agentInvitation.findUnique({
    where: { tokenHash: hashInviteToken(token) },
  });

  if (!invitation) return { valid: false, reason: "INVALID" };
  if (invitation.status === "ACCEPTED") return { valid: false, reason: "ACCEPTED" };
  if (invitation.status === "REVOKED") return { valid: false, reason: "REVOKED" };

  if (invitation.status === "EXPIRED" || invitation.expiresAt.getTime() < Date.now()) {
    if (invitation.status === "PENDING") {
      await prisma.agentInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
    }
    return { valid: false, reason: "EXPIRED" };
  }

  return {
    valid: true,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt.toISOString(),
  };
}

/**
 * Resolve an invitation token (read-only) so the accept page can pre-fill the
 * email and show the assigned role. Does not consume the invitation.
 */
export async function getInvitationByToken(token: string): Promise<InvitationInfo> {
  if (!token) return { ok: false, error: "Missing invitation token." };

  const result = await validateInvitationToken(token);
  if (!result.valid) {
    const messages: Record<typeof result.reason, string> = {
      INVALID: "This invitation link is invalid.",
      EXPIRED: "This invitation link has expired.",
      ACCEPTED: "This invitation has already been used or cancelled.",
      REVOKED: "This invitation has already been used or cancelled.",
    };
    return { ok: false, error: messages[result.reason] };
  }

  return { ok: true, email: result.email, role: result.role };
}

/**
 * Complete invite-based staff registration. Creates the Supabase auth user
 * (email pre-confirmed since the invite proves email ownership), creates the
 * Profile with the role *fixed by the invitation*, and marks the invite accepted.
 */
export async function acceptAgentInvitation(input: unknown): Promise<StaffAuthResult> {
  const parsed = acceptInvitationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error) };
  }

  const { token, fullName, password } = parsed.data;

  const invitation = await prisma.agentInvitation.findUnique({
    where: { tokenHash: hashInviteToken(token) },
  });

  if (!invitation || invitation.status !== "PENDING") {
    return { ok: false, error: "This invitation is no longer valid." };
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    await prisma.agentInvitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return { ok: false, error: "This invitation link has expired." };
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created.user) {
    return {
      ok: false,
      error: createError?.message ?? "Could not create your account. Please try again.",
    };
  }

  // Role comes from the invitation only — never from user input.
  await prisma.profile.upsert({
    where: { id: created.user.id },
    create: {
      id: created.user.id,
      email: invitation.email,
      fullName,
      role: invitation.role,
      status: "ACTIVE",
    },
    update: { fullName, role: invitation.role, status: "ACTIVE" },
  });

  await applyInvitationExtras(invitation, created.user.id);

  await prisma.agentInvitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  await recordInvitationAccepted({
    invitationId: invitation.id,
    email: invitation.email,
    role: invitation.role,
    profileId: created.user.id,
    fullName,
  });

  // Sign the new user straight into a session.
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: invitation.email, password });

  return { ok: true };
}

/**
 * Shared audit/notify tail for both accept flows: records the invitation
 * acceptance + staff profile creation and tells the admins.
 */
async function recordInvitationAccepted(params: {
  invitationId: string;
  email: string;
  role: UserRole;
  profileId: string;
  fullName: string;
}): Promise<void> {
  const { invitationId, email, role, profileId, fullName } = params;
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  await logActivity({
    actorId: profileId,
    action: "INVITATION_ACCEPTED",
    entityType: "AGENT_INVITATION",
    entityId: invitationId,
    oldValues: { status: "PENDING" },
    newValues: { status: "ACCEPTED", email },
  });
  await logActivity({
    actorId: profileId,
    action: "PROFILE_CREATED",
    entityType: "PROFILE",
    entityId: profileId,
    newValues: { email, role, status: "ACTIVE" },
  });
  await notifyInvitationAccepted({
    invitationId,
    joinedName: fullName || email,
    roleLabel,
  });
}

export type AcceptInvitationApiResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Completes invite-based staff registration for the /invite/[token] flow.
 * Creates the Supabase auth user, upserts the Profile with the role *fixed by
 * the invitation* (never from user input), marks the invite ACCEPTED, and
 * signs the new user into a session.
 */
export async function acceptInvitationApi(input: unknown): Promise<AcceptInvitationApiResult> {
  const parsed = acceptInvitationApiSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssueMessage(parsed.error) };
  }

  const { token, firstName, lastName, phone, password } = parsed.data;

  const invitation = await prisma.agentInvitation.findUnique({
    where: { tokenHash: hashInviteToken(token) },
  });

  if (!invitation || invitation.status !== "PENDING") {
    return { ok: false, error: "This invitation is no longer valid." };
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    await prisma.agentInvitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return { ok: false, error: "This invitation link has expired." };
  }

  const fullName = `${firstName} ${lastName}`.trim();

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created.user) {
    return {
      ok: false,
      error: createError?.message ?? "Could not create your account. Please try again.",
    };
  }

  // Role comes from the invitation only — never from user input.
  await prisma.profile.upsert({
    where: { id: created.user.id },
    create: {
      id: created.user.id,
      email: invitation.email,
      fullName,
      phone,
      role: invitation.role,
      status: "ACTIVE",
    },
    update: { fullName, phone, role: invitation.role, status: "ACTIVE" },
  });

  await applyInvitationExtras(invitation, created.user.id);

  await prisma.agentInvitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  await recordInvitationAccepted({
    invitationId: invitation.id,
    email: invitation.email,
    role: invitation.role,
    profileId: created.user.id,
    fullName,
  });

  // Sign the new user straight into a session.
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: invitation.email, password });

  return { ok: true };
}

// ── Invitation management (ADMIN-only in phase 1) ─────────────────────────────

export type InvitationListItem = {
  id: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  location: string | null;
  invitedBy: { name: string | null; email: string } | null;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
};

export type ListInvitationsResult =
  | { ok: true; invitations: InvitationListItem[] }
  | { ok: false; error: string };

/**
 * All invitations, newest first, for the dashboard list. Safe DTO only —
 * tokenHash and internal notes never leave the server. Timed-out PENDING rows
 * are flipped to EXPIRED first so the list always shows the effective status.
 */
export async function listInvitations(): Promise<ListInvitationsResult> {
  const authz = await requirePermission("invitations:view");
  if (!authz.ok) return { ok: false, error: authz.error };

  await prisma.agentInvitation.updateMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });

  const invitations = await prisma.agentInvitation.findMany({
    orderBy: { createdAt: "desc" },
  });

  const inviterIds = [
    ...new Set(invitations.map((i) => i.invitedById).filter((id): id is string => !!id)),
  ];
  const inviters = await prisma.profile.findMany({
    where: { id: { in: inviterIds } },
    select: { id: true, fullName: true, email: true },
  });
  const inviterById = new Map(inviters.map((p) => [p.id, p]));

  return {
    ok: true,
    invitations: invitations.map((inv) => {
      const inviter = inv.invitedById ? inviterById.get(inv.invitedById) : undefined;
      return {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        firstName: inv.firstName,
        lastName: inv.lastName,
        phone: inv.phone,
        location: inv.location,
        invitedBy: inviter ? { name: inviter.fullName, email: inviter.email } : null,
        createdAt: inv.createdAt.toISOString(),
        expiresAt: inv.expiresAt.toISOString(),
        acceptedAt: inv.acceptedAt?.toISOString() ?? null,
      };
    }),
  };
}

export type ResendInvitationResult =
  | { ok: true; inviteUrl: string; emailSent: boolean }
  | { ok: false; error: string };

/**
 * Re-issue a PENDING or EXPIRED invitation: rotates the token (the old link
 * stops working), resets the 7-day expiry, and re-sends the email. The new
 * invite URL is returned to the caller for copying — never stored.
 */
export async function resendInvitation(invitationId: string): Promise<ResendInvitationResult> {
  if (!invitationId || typeof invitationId !== "string") {
    return { ok: false, error: "Invalid invitation." };
  }

  const authz = await requirePermission("invitations:resend");
  if (!authz.ok) return { ok: false, error: authz.error };

  const invitation = await prisma.agentInvitation.findUnique({ where: { id: invitationId } });
  if (!invitation) return { ok: false, error: "Invitation not found." };
  if (invitation.status !== "PENDING" && invitation.status !== "EXPIRED") {
    return { ok: false, error: "Only pending or expired invitations can be resent." };
  }

  // The email may have signed up through another path since the invite was sent.
  const existingProfile = await prisma.profile.findUnique({
    where: { email: invitation.email },
  });
  if (existingProfile) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const rawToken = generateInviteToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.agentInvitation.update({
    where: { id: invitation.id },
    data: { tokenHash: hashInviteToken(rawToken), expiresAt, status: "PENDING" },
  });

  await logActivity({
    actorId: authz.profile.id,
    action: "INVITATION_RESENT",
    entityType: "AGENT_INVITATION",
    entityId: invitation.id,
    oldValues: { status: invitation.status, expiresAt: invitation.expiresAt.toISOString() },
    newValues: { status: "PENDING", expiresAt: expiresAt.toISOString() },
  });

  const inviteUrl = `${APP_URL}/invite/${rawToken}`;
  const emailResult = await sendAgentInvitationEmail({
    to: invitation.email,
    inviteUrl,
    role: invitation.role,
    expiresInDays: INVITATION_TTL_DAYS,
  });

  return { ok: true, inviteUrl, emailSent: emailResult.sent };
}

export type RevokeInvitationResult = { ok: true } | { ok: false; error: string };

/**
 * Revoke a PENDING invitation so its link can never be used. Terminal: a
 * revoked invitation stays revoked (create a fresh invite instead).
 */
export async function revokeInvitation(invitationId: string): Promise<RevokeInvitationResult> {
  if (!invitationId || typeof invitationId !== "string") {
    return { ok: false, error: "Invalid invitation." };
  }

  const authz = await requirePermission("invitations:revoke");
  if (!authz.ok) return { ok: false, error: authz.error };

  const invitation = await prisma.agentInvitation.findUnique({ where: { id: invitationId } });
  if (!invitation) return { ok: false, error: "Invitation not found." };
  if (invitation.status !== "PENDING") {
    return { ok: false, error: "Only pending invitations can be revoked." };
  }

  await prisma.agentInvitation.update({
    where: { id: invitation.id },
    data: { status: "REVOKED" },
  });

  await logActivity({
    actorId: authz.profile.id,
    action: "INVITATION_REVOKED",
    entityType: "AGENT_INVITATION",
    entityId: invitation.id,
    oldValues: { status: "PENDING" },
    newValues: { status: "REVOKED" },
  });
  await notifyInvitationRevoked({
    invitationId: invitation.id,
    invitedEmail: invitation.email,
    actorId: authz.profile.id,
    actorName: authz.profile.fullName ?? authz.profile.email,
  });

  return { ok: true };
}
