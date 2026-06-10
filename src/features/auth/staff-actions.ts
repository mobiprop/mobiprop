"use server";

import type { ZodError } from "zod";

import { APP_URL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { sendAgentInvitationEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessDashboard } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";
import { generateInviteToken, hashInviteToken } from "@/lib/security/token";
import { acceptInvitationApiSchema, createInvitationSchema } from "@/schemas/invitation.schema";
import type { UserRole } from "@/generated/prisma/enums";

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
  | { ok: true; inviteUrl: string; emailSent: boolean }
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

  const { email, role, firstName, lastName, phone, location, notes } = parsed.data;

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

  await prisma.agentInvitation.create({
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
    },
  });

  const inviteUrl = `${APP_URL}/invite/${rawToken}`;
  const emailResult = await sendAgentInvitationEmail({
    to: email,
    inviteUrl,
    role,
    expiresInDays: INVITATION_TTL_DAYS,
  });

  return { ok: true, inviteUrl, emailSent: emailResult.sent };
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

  await prisma.agentInvitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  // Sign the new user straight into a session.
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: invitation.email, password });

  return { ok: true };
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

  await prisma.agentInvitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  // Sign the new user straight into a session.
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: invitation.email, password });

  return { ok: true };
}
