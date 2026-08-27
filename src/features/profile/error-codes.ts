// Stable error codes returned by src/features/profile/actions.ts's server
// actions. Server actions have no i18n context (this codebase's established
// pattern: server returns English/codes, client translates) — using codes
// instead of hardcoded English sentences lets every caller translate them
// via the shared `profileErrors.<code>` key, present in both the
// `accountSettings` and `dashboardSettings` locale namespaces.
export const PROFILE_ERROR_CODES = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  FIRST_NAME_REQUIRED: "FIRST_NAME_REQUIRED",
  LAST_NAME_REQUIRED: "LAST_NAME_REQUIRED",
  DESCRIPTION_TOO_LONG: "DESCRIPTION_TOO_LONG",
  AVATAR_TOO_LARGE: "AVATAR_TOO_LARGE",
  AVATAR_INVALID_TYPE: "AVATAR_INVALID_TYPE",
  AVATAR_UPLOAD_FAILED: "AVATAR_UPLOAD_FAILED",
  PROFILE_SAVE_FAILED: "PROFILE_SAVE_FAILED",
  PREFERENCES_SAVE_FAILED: "PREFERENCES_SAVE_FAILED",
  CURRENT_PASSWORD_REQUIRED: "CURRENT_PASSWORD_REQUIRED",
  PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
  PASSWORD_MISSING_LOWERCASE: "PASSWORD_MISSING_LOWERCASE",
  PASSWORD_MISSING_UPPERCASE: "PASSWORD_MISSING_UPPERCASE",
  PASSWORD_MISSING_NUMBER: "PASSWORD_MISSING_NUMBER",
  PASSWORD_MISSING_SPECIAL: "PASSWORD_MISSING_SPECIAL",
  PASSWORDS_DONT_MATCH: "PASSWORDS_DONT_MATCH",
  PASSWORD_SAME_AS_CURRENT: "PASSWORD_SAME_AS_CURRENT",
  CURRENT_PASSWORD_INCORRECT: "CURRENT_PASSWORD_INCORRECT",
  PASSWORD_UPDATE_REJECTED: "PASSWORD_UPDATE_REJECTED",
  PASSWORD_UPDATE_FAILED: "PASSWORD_UPDATE_FAILED",
  LOGOUT_OTHER_SESSIONS_FAILED: "LOGOUT_OTHER_SESSIONS_FAILED",
} as const;

export type ProfileErrorCode = (typeof PROFILE_ERROR_CODES)[keyof typeof PROFILE_ERROR_CODES];

/** Translates a profile/settings server-action error code, falling back to a
 * generic message for anything unrecognized (defensive — every code above
 * has a translation, but this guards against drift). */
export function translateProfileError(
  code: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  return t(`profileErrors.${code}`, { defaultValue: t("profileErrors.GENERIC") });
}
