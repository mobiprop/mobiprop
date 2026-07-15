import type { Profile } from "@/generated/prisma/client";

/**
 * Shape of the `preferences` JSON column on Profile. Edited from the
 * Edit Profile modal (Notifications / Security / Language & Region tabs).
 */
export type NotificationPreferences = {
  emailNewListings: boolean;
  emailPriceChanges: boolean;
  emailMessages: boolean;
  emailNewsletter: boolean;
  pushNewListings: boolean;
  pushMessages: boolean;
  pushPriceAlerts: boolean;
};

/** Staff-facing toggles edited from /dashboard/settings → Notifications. */
export type DashboardNotificationPreferences = {
  emailEnabled: boolean;
  /** Master switch for browser push (per-category toggles below still apply). */
  pushEnabled: boolean;
  newMessages: boolean;
  newLeads: boolean;
  leadAssignments: boolean;
  tourUpdates: boolean;
  listingUpdates: boolean;
  opportunityUpdates: boolean;
  /** DocuSign envelope status updates (sent/completed/declined/voided/expiring). */
  signatureUpdates: boolean;
  weeklyReports: boolean;
  marketingUpdates: boolean;
};

export type SecurityPreferences = {
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
};

export type LocalePreferences = {
  language: string;
  timezone: string;
  autoDetectTimezone: boolean;
  dateFormat: string;
  timeFormat: string;
};

export type ProfilePreferences = {
  notifications: NotificationPreferences;
  dashboardNotifications: DashboardNotificationPreferences;
  security: SecurityPreferences;
  locale: LocalePreferences;
};

export const DEFAULT_PREFERENCES: ProfilePreferences = {
  notifications: {
    emailNewListings: true,
    emailPriceChanges: true,
    emailMessages: false,
    emailNewsletter: true,
    pushNewListings: false,
    pushMessages: true,
    pushPriceAlerts: true,
  },
  dashboardNotifications: {
    emailEnabled: true,
    pushEnabled: false,
    newMessages: true,
    newLeads: true,
    leadAssignments: true,
    tourUpdates: true,
    listingUpdates: true,
    opportunityUpdates: true,
    signatureUpdates: true,
    weeklyReports: false,
    marketingUpdates: false,
  },
  security: {
    twoFactorEnabled: false,
    loginAlerts: true,
  },
  locale: {
    language: "en",
    timezone: "America/Los_Angeles",
    autoDetectTimezone: true,
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  },
};

/** Collapses legacy/regional codes ("en-US", "es-AR", "pt-BR", ...) down to the
 * two languages the site actually supports, so profiles saved before the
 * dropdown was simplified still resolve to a valid option. */
function normalizeLanguage(language: string): "en" | "es" {
  return language.split("-")[0] === "es" ? "es" : "en";
}

/** Merge the stored JSON (possibly null / partial / from older versions) over the defaults. */
export function resolvePreferences(profile: Pick<Profile, "preferences">): ProfilePreferences {
  const stored = (profile.preferences ?? {}) as Partial<{
    notifications: Partial<NotificationPreferences>;
    dashboardNotifications: Partial<DashboardNotificationPreferences>;
    security: Partial<SecurityPreferences>;
    locale: Partial<LocalePreferences>;
  }>;

  return {
    notifications: { ...DEFAULT_PREFERENCES.notifications, ...stored.notifications },
    dashboardNotifications: {
      ...DEFAULT_PREFERENCES.dashboardNotifications,
      ...stored.dashboardNotifications,
    },
    security: { ...DEFAULT_PREFERENCES.security, ...stored.security },
    locale: {
      ...DEFAULT_PREFERENCES.locale,
      ...stored.locale,
      language: normalizeLanguage(stored.locale?.language ?? DEFAULT_PREFERENCES.locale.language),
    },
  };
}
