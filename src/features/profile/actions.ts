"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/auth";
import { logActivity, type ActivityAction } from "@/lib/activity-log";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { createClient } from "@/lib/supabase/server";
import { removeAvatar, uploadAvatar } from "@/lib/supabase/storage";
import type { Profile } from "@/generated/prisma/client";
import {
  resolvePreferences,
  type DashboardNotificationPreferences,
  type LocalePreferences,
  type NotificationPreferences,
  type SecurityPreferences,
} from "./preferences";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_DESCRIPTION_LENGTH = 250;

export type UpdateProfileResult = { error: string } | { profile: Profile };
export type ActionResult = { error: string } | { success: true };

function trimmed(formData: FormData, key: string) {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "You must be signed in." };

  const firstName = trimmed(formData, "firstName");
  const lastName = trimmed(formData, "lastName");
  const phone = trimmed(formData, "phone");
  const country = trimmed(formData, "country");
  const city = trimmed(formData, "city");
  const timezone = trimmed(formData, "timezone");
  const address = trimmed(formData, "address");
  const description = trimmed(formData, "description");
  const removePhoto = formData.get("removeAvatar") === "true";
  const avatarFile = formData.get("avatar");

  if (!firstName) return { error: "First name is required." };
  if (!lastName) return { error: "Last name is required." };
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.` };
  }

  let avatarUrl = profile.avatarUrl;

  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (avatarFile.size > MAX_AVATAR_SIZE) {
      return { error: "Image must be smaller than 5MB." };
    }
    if (!ALLOWED_AVATAR_TYPES.has(avatarFile.type)) {
      return { error: "Image must be a PNG, JPEG, WEBP or GIF." };
    }

    try {
      avatarUrl = await uploadAvatar(profile.id, avatarFile);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to upload photo." };
    }
  } else if (removePhoto && profile.avatarUrl) {
    await removeAvatar(profile.id);
    avatarUrl = null;
  }

  try {
    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        fullName: [firstName, lastName].filter(Boolean).join(" ") || null,
        phone: phone || null,
        country: country || null,
        city: city || null,
        timezone: timezone || null,
        address: address || null,
        description: description || null,
        avatarUrl,
      },
    });

    await logActivity({
      actorId: profile.id,
      action: "PROFILE_SETTINGS_UPDATED",
      entityType: "PROFILE_SETTINGS",
      entityId: profile.id,
      oldValues: {
        fullName: profile.fullName,
        phone: profile.phone,
        country: profile.country,
        city: profile.city,
        timezone: profile.timezone,
        address: profile.address,
        description: profile.description,
        avatarUrl: profile.avatarUrl,
      },
      newValues: {
        fullName: updated.fullName,
        phone: updated.phone,
        country: updated.country,
        city: updated.city,
        timezone: updated.timezone,
        address: updated.address,
        description: updated.description,
        avatarUrl: updated.avatarUrl,
      },
    });

    revalidatePath("/", "layout");

    return { profile: updated };
  } catch (err) {
    console.error("updateProfile failed", err);
    return { error: "Failed to save your profile. Please try again." };
  }
}

type PreferencesSection = "notifications" | "dashboardNotifications" | "security" | "locale";

const SECTION_ACTIVITY_ACTION: Record<PreferencesSection, ActivityAction> = {
  notifications: "NOTIFICATION_PREFERENCES_UPDATED",
  dashboardNotifications: "NOTIFICATION_PREFERENCES_UPDATED",
  security: "SECURITY_SETTINGS_UPDATED",
  locale: "GENERAL_PREFERENCES_UPDATED",
};

/** Merge one section of the preferences JSON and persist it. */
async function updatePreferencesSection(
  section: PreferencesSection,
  value:
    | NotificationPreferences
    | DashboardNotificationPreferences
    | SecurityPreferences
    | LocalePreferences,
): Promise<UpdateProfileResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "You must be signed in." };

  try {
    const current = resolvePreferences(profile);
    const preferences = { ...current, [section]: value };
    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: { preferences },
    });

    await logActivity({
      actorId: profile.id,
      action: SECTION_ACTIVITY_ACTION[section],
      entityType: "PROFILE_SETTINGS",
      entityId: profile.id,
      oldValues: { [section]: current[section] },
      newValues: { [section]: value },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard/settings");

    return { profile: updated };
  } catch (err) {
    console.error(`updatePreferencesSection(${section}) failed`, err);
    return { error: "Failed to save your preferences. Please try again." };
  }
}

export async function updateNotificationPreferences(
  prefs: NotificationPreferences,
): Promise<UpdateProfileResult> {
  return updatePreferencesSection("notifications", prefs);
}

/**
 * Dashboard-only notification toggles (/dashboard/settings → Notifications).
 * Staff roles only — `settings:view` is not granted to USER.
 */
export async function updateDashboardNotificationPreferences(
  prefs: DashboardNotificationPreferences,
): Promise<UpdateProfileResult> {
  const guard = await requirePermission("settings:view");
  if (!guard.ok) return { error: guard.error };

  return updatePreferencesSection("dashboardNotifications", prefs);
}

export async function updateSecurityPreferences(
  prefs: SecurityPreferences,
): Promise<UpdateProfileResult> {
  return updatePreferencesSection("security", prefs);
}

export async function updateLocalePreferences(
  prefs: LocalePreferences,
): Promise<UpdateProfileResult> {
  return updatePreferencesSection("locale", prefs);
}

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[a-z]/, "Password must contain a lowercase letter.")
  .regex(/[A-Z]/, "Password must contain an uppercase letter.")
  .regex(/\d/, "Password must include at least one number.")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character.");

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "You must be signed in." };

  const currentPassword = (formData.get("currentPassword") as string | null) ?? "";
  const newPassword = (formData.get("newPassword") as string | null) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string | null) ?? "";

  if (!currentPassword) return { error: "Enter your current password." };

  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Password does not meet the requirements." };
  }
  if (newPassword !== confirmPassword) return { error: "New passwords do not match." };
  if (newPassword === currentPassword) {
    return { error: "New password must be different from your current password." };
  }

  try {
    const supabase = await createClient();

    // Re-authenticate before changing the password.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    });
    if (signInError) return { error: "Current password is incorrect." };

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };

    // Audit trail only — never log password values.
    await logActivity({
      actorId: profile.id,
      action: "PASSWORD_CHANGED",
      entityType: "PROFILE_SETTINGS",
      entityId: profile.id,
    });

    return { success: true };
  } catch {
    return { error: "Failed to update your password. Please try again." };
  }
}

export async function logoutOtherSessions(): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "You must be signed in." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (error) return { error: error.message };

    return { success: true };
  } catch {
    return { error: "Failed to log out other sessions. Please try again." };
  }
}
