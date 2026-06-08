"use server";

import type { ZodError } from "zod";

import { APP_URL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
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
  return error.issues[0]?.message ?? "Invalid input";
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

  await prisma.profile.upsert({
    where: { id: user.id },
    create: { id: user.id, email: user.email ?? "", fullName },
    update: { email: user.email ?? "", ...(fullName ? { fullName } : {}) },
  });
}

export async function signUpWithPassword(input: unknown): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Could not create your account. Please try again." };

  await upsertProfileForUser(data.user);

  return {};
}

export async function signInWithPassword(input: unknown): Promise<AuthActionResult> {
  const parsed = loginWithPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: "Incorrect email or password" };
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
      emailRedirectTo: `${APP_URL}/`,
    },
  });

  if (error) return { error: error.message };
  return {};
}

export async function verifyOtp(input: unknown): Promise<AuthActionResult> {
  const parsed = otpSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const { email, token, type } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type });

  if (error) return { error: "Invalid or expired code. Please try again." };
  if (data.user) await upsertProfileForUser(data.user);

  return {};
}

export async function resendSignUpOtp(email: string): Promise<AuthActionResult> {
  const parsed = signUpSchema.shape.email.safeParse(email);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: parsed.data });

  if (error) return { error: error.message };
  return {};
}

export async function requestPasswordReset(input: unknown): Promise<AuthActionResult> {
  const parsed = requestPasswordResetSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${APP_URL}/new-password`,
  });

  if (error) return { error: error.message };
  return {};
}

export async function updatePassword(input: unknown): Promise<AuthActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) return { error: error.message };
  return {};
}

export async function getPostLoginRedirect(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "/login";

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (profile && profile.role !== "CLIENT") return "/dashboard";

  return "/profile";
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
