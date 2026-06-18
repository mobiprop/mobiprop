"use client";

import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";

import {
  changePassword,
  updateSecurityPreferences,
} from "@/features/profile/actions";
import { resolvePreferences } from "@/features/profile/preferences";
import type { Profile } from "@/generated/prisma/client";
import { Toggle } from "./Toggle";

const mont = {
  fontFamily: "'Montserrat', sans-serif",
};

const inputClass =
  "h-11 w-full min-w-0 rounded-[10px] border border-[#d1d5dc] bg-white px-3.5 text-[14px] text-[#0d2138] outline-none transition-all placeholder:text-[#99a1af] focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#6a7282]";

const labelClass = "text-[14px] font-medium leading-5 text-[#4b5563]";

type SecurityTabProps = {
  profile: Profile;
};

export function SecurityTab({ profile }: SecurityTabProps) {
  const securityPreferences = resolvePreferences(profile).security;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    securityPreferences.twoFactorEnabled,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating2fa, setIsUpdating2fa] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  async function handleToggle2fa(enabled: boolean) {
    if (isUpdating2fa) return;

    const previousValue = twoFactorEnabled;

    setTwoFactorEnabled(enabled);
    setIsUpdating2fa(true);
    setTwoFactorError(null);

    try {
      await updateSecurityPreferences({
        ...securityPreferences,
        twoFactorEnabled: enabled,
      });
    } catch {
      setTwoFactorEnabled(previousValue);
      setTwoFactorError("Two-factor authentication could not be updated.");
    } finally {
      setIsUpdating2fa(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccess(false);

    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      setError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsSaving(true);

    const formData = new FormData();

    formData.set("currentPassword", currentPassword);
    formData.set("newPassword", newPassword);
    formData.set("confirmPassword", confirmPassword);

    try {
      const result = await changePassword(formData);

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong while updating your password.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col">
      {/* Security heading */}
      <div>
        <h2
          className="text-[14px] font-semibold leading-7 text-[#0d2138] sm:text-[16px]"
          style={mont}
        >
          Security Settings
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex min-w-0 flex-col gap-6"
      >
        {/* Change password section */}
        <section className="flex min-w-0 flex-col">
          <h3
            className="text-[16px] font-medium leading-6 text-[#0d2138]"
            style={mont}
          >
            Change Password
          </h3>

          <div className="mt-4 grid min-w-0 grid-cols-1 gap-5">
            {/* Current password */}
            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="current-password"
                className={labelClass}
                style={mont}
              >
                Current Password
              </label>

              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
                disabled={isSaving}
                className={inputClass}
                style={mont}
              />
            </div>

            {/* New password */}
            <div className="flex min-w-0 flex-col gap-2">
              <label htmlFor="new-password" className={labelClass} style={mont}>
                New Password
              </label>

              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={isSaving}
                className={inputClass}
                style={mont}
              />

              <p className="text-[14px] leading-5 text-[#99a1af]" style={mont}>
                Password must contain at least 8 characters.
              </p>
            </div>

            {/* Confirm password */}
            <div className="flex min-w-0 flex-col gap-2">
              <label
                htmlFor="confirm-password"
                className={labelClass}
                style={mont}
              >
                Confirm New Password
              </label>

              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={isSaving}
                className={inputClass}
                style={mont}
              />
            </div>
          </div>
        </section>

        {/* Password error */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[14px] leading-5 text-[#dc2626]"
            style={mont}
          >
            {error}
          </div>
        )}

        {/* Password success */}
        {success && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[14px] leading-5 text-[#008236]"
            style={mont}
          >
            Password updated successfully.
          </div>
        )}

        {/* Two-factor section */}
        <section className="border-t border-[#e5e7eb] pt-6">
          <h3
            className="text-[16px] font-medium leading-6 text-[#6a7282]"
            style={mont}
          >
            Two-Factor Authentication
          </h3>

          <div className="mt-4 flex min-h-[88px] items-center justify-between gap-4 rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] p-4 sm:min-h-[92px] sm:px-5">
            <div className="min-w-0 flex-1">
              <p
                className="text-[16px] font-semibold leading-6 text-[#0d2138]"
                style={mont}
              >
                Enable 2FA
              </p>

              <p
                className="mt-1 text-[14px] leading-5 text-[#6a7282]"
                style={mont}
              >
                Add extra security to your account.
              </p>
            </div>

            <div
              className={`shrink-0 ${
                isUpdating2fa ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <Toggle checked={twoFactorEnabled} onChange={handleToggle2fa} />
            </div>
          </div>

          {isUpdating2fa && (
            <p
              className="mt-2 text-[14px] leading-5 text-[#6a7282]"
              style={mont}
            >
              Updating two-factor authentication...
            </p>
          )}

          {twoFactorError && (
            <p
              role="alert"
              className="mt-2 text-[14px] leading-5 text-[#dc2626]"
              style={mont}
            >
              {twoFactorError}
            </p>
          )}
        </section>

        {/* Submit button */}
        <div className="flex border-t border-[#e5e7eb] pt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1b487a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            style={mont}
          >
            <ShieldCheck size={17} className="shrink-0" />

            {isSaving ? "Updating..." : "Update Security"}
          </button>
        </div>
      </form>
    </div>
  );
}
