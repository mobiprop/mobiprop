"use server";

import { passwordAuthError } from "./password-policy";
import { after } from "next/server";
import { sendVerifiedWelcome } from "@/lib/verified-welcome";
import type { ZodError } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { APP_URL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  loginWithPasswordSchema,
  magicLinkSchema,
  otpSchema,
  requestPasswordResetSchema,
  signUpSchema,
  updatePasswordSchema,
} from "./schemas";

export type AuthActionResult = { error?: string };

function firstIssueMessage(error: ZodError) {
  return error.issues[0]?.message ?? "Revisá los datos ingresados.";
}

async function upsertProfileForUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? (user.user_metadata.full_name as string)
      : null;
  const email = user.email ?? "";

  const upsert = () =>
    prisma.profile.upsert({
      where: { id: user.id },
      create: { id: user.id, email, fullName, country: "Argentina", timezone: "America/Argentina/Buenos_Aires" },
      update: { email, ...(fullName ? { fullName } : {}) },
    });

  try {
    await upsert();
  } catch (error) {
    const isUniqueConflict =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
    if (!isUniqueConflict) throw error;

    // Another profile row holds this email under a different id. Either its
    // auth user was deleted (orphan row from a re-registered email) or that
    // user's auth email has since changed and the profile copy is outdated.
    const conflicting = await prisma.profile.findUnique({ where: { email } });
    if (!conflicting || conflicting.id === user.id) throw error;

    const admin = createAdminClient();
    const { data, error: adminError } = await admin.auth.admin.getUserById(conflicting.id);

    if (data?.user) {
      // The other account still exists. If it genuinely owns this email,
      // retrying can never succeed — surface the conflict to the caller.
      if ((data.user.email ?? "") === email) throw error;
      // Otherwise its auth email changed and the profile copy is stale —
      // sync it to free the address.
      await prisma.profile.update({
        where: { id: conflicting.id },
        data: { email: data.user.email ?? `stale-${conflicting.id}@invalid.local` },
      });
    } else if (adminError && adminError.status !== 404) {
      // Couldn't confirm the other user is gone — don't touch their row.
      throw error;
    } else {
      // Orphaned profile of a deleted auth user: remove it, or tombstone the
      // email if related records block deletion.
      try {
        await prisma.profile.delete({ where: { id: conflicting.id } });
      } catch {
        await prisma.profile.update({
          where: { id: conflicting.id },
          data: { email: `deleted-${conflicting.id}@invalid.local` },
        });
      }
    }

    await upsert();
  }
}

export async function signUpWithPassword(input: unknown): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${APP_URL}/auth/callback` },
  });

  if (error) return { error: passwordAuthError(error) };
  if (!data.user) return { error: passwordAuthError({}) };

  // Supabase doesn't error when the email is already registered (to prevent
  // account enumeration) — it returns an obfuscated user with no identities.
  if (data.user.identities?.length === 0) {
    return { error: passwordAuthError({}) };
  }

  await upsertProfileForUser(data.user);

  return {};
}

export async function signInWithPassword(input: unknown): Promise<AuthActionResult> {
  const parsed = loginWithPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: error.code === "email_not_confirmed" ? "Verificá tu correo electrónico antes de iniciar sesión." : "El correo o la contraseña no son correctos." };
  if (!data.user?.email_confirmed_at) {
    await supabase.auth.signOut();
    return { error: "Verificá tu correo electrónico antes de iniciar sesión." };
  }

  // Staff accounts must use the dashboard login page, not the public portal.
  const profile = data.user
    ? await prisma.profile.findUnique({ where: { id: data.user.id }, select: { role: true, status: true } })
    : null;

  if (profile && profile.role !== "USER") {
    await supabase.auth.signOut();
    return {
      error: "Las cuentas del equipo deben ingresar desde el acceso al panel de gestión.",
    };
  }

  if (profile?.status !== "ACTIVE") {
    await supabase.auth.signOut();
    return { error: "Tu cuenta no está activa. Comunicate con nuestro equipo." };
  }
  after(() => sendVerifiedWelcome(data.user));
  return {};
}

export async function sendMagicLink(input: unknown): Promise<AuthActionResult> {
  const parsed = magicLinkSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: false,
      // /auth/callback exchanges the code, ensures a profile, and redirects by role.
      emailRedirectTo: `${APP_URL}/auth/callback`,
    },
  });

  if (error) return { error: passwordAuthError(error) };
  return {};
}

export async function verifyOtp(input: unknown): Promise<AuthActionResult> {
  const parsed = otpSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const { email, token, type } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type });

  if (error) return { error: "El código no es válido o venció. Solicitá uno nuevo y volvé a intentar." };
  if (data.user) {
    await upsertProfileForUser(data.user);
    const user = data.user;
    after(() => sendVerifiedWelcome(user));
  }

  return {};
}

export async function resendSignUpOtp(email: string): Promise<AuthActionResult> {
  const parsed = signUpSchema.shape.email.safeParse(email);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data, options: { emailRedirectTo: `${APP_URL}/auth/callback` } });

  if (error) return { error: passwordAuthError(error) };
  return {};
}

export async function requestPasswordReset(input: unknown): Promise<AuthActionResult> {
  const parsed = requestPasswordResetSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    // Route through the callback so the recovery session is established (code
    // exchange) before landing on the password form.
    redirectTo: `${APP_URL}/auth/callback?next=/new-password`,
  });

  if (error) return { error: passwordAuthError(error) };
  return {};
}

export async function updatePassword(input: unknown): Promise<AuthActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) return { error: passwordAuthError(error) };
  return {};
}

export async function getPostLoginRedirect(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "/login";

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (profile && profile.role !== "USER") return "/dashboard";

  return "/profile";
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
