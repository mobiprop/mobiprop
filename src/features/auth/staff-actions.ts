"use server";

import { createHash } from "node:crypto";

import type { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAccessDashboard } from "@/lib/permissions";

import { acceptInvitationSchema, loginWithPasswordSchema } from "./schemas";

export type StaffAuthResult =
  | { ok: true }
  | { ok: false; error: string; reason?: "credentials" | "not_staff" | "inactive" };

function firstIssueMessage(error: ZodError) {
  return error.issues[0]?.message ?? "Invalid input";
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Staff/CRM login. Authenticates against Supabase, then confirms the user is an
 * active staff member (ADMIN/MANAGER/AGENT — never CLIENT). On any failure the
 * session is signed back out so a CLIENT can never hold a dashboard session.
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

export type InvitationInfo = {
  ok: true;
  email: string;
  role: string;
} | {
  ok: false;
  error: string;
};

/**
 * Resolve an invitation token (read-only) so the accept page can pre-fill the
 * email and show the assigned role. Does not consume the invitation.
 */
export async function getInvitationByToken(token: string): Promise<InvitationInfo> {
  if (!token) return { ok: false, error: "Missing invitation token." };

  const invitation = await prisma.agentInvitation.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!invitation) return { ok: false, error: "This invitation link is invalid." };
  if (invitation.status !== "PENDING") {
    return { ok: false, error: "This invitation has already been used or cancelled." };
  }
  if (invitation.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This invitation link has expired." };
  }

  return { ok: true, email: invitation.email, role: invitation.role };
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
    where: { tokenHash: hashToken(token) },
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
