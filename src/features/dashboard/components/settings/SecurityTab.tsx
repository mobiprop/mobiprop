"use client";

import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";

import { changePassword, updateSecurityPreferences } from "@/features/profile/actions";
import { resolvePreferences } from "@/features/profile/preferences";
import type { Profile } from "@/generated/prisma/client";
import { Toggle } from "./Toggle";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const inputClass =
  "h-9 px-3.5 bg-white border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0a0a0a] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] font-medium text-[#1f2937]";

type SecurityTabProps = {
  profile: Profile;
};

export function SecurityTab({ profile }: SecurityTabProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(resolvePreferences(profile).security.twoFactorEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleToggle2fa(enabled: boolean) {
    setTwoFactorEnabled(enabled);
    const current = resolvePreferences(profile).security;
    await updateSecurityPreferences({ ...current, twoFactorEnabled: enabled });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

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
    <div className="flex flex-col gap-6">
      <p className="text-[16px] font-medium text-[#0d2138]" style={mont}>Security Settings</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-[14px] font-medium text-[#1f2937]" style={mont}>Change Password</p>
        <div className="flex flex-col gap-2">
          <label className={labelClass} style={mont}>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
            style={mont}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass} style={mont}>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            style={mont}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass} style={mont}>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            style={mont}
          />
        </div>

        {error && <p className="text-[12px] text-[#dc2626]" style={mont}>{error}</p>}
        {success && <p className="text-[12px] text-[#10b981]" style={mont}>Security settings updated.</p>}

        <div className="border-t border-[#e5e7eb] pt-5 flex flex-col gap-3">
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>Two-Factor Authentication</p>
          <div className="bg-[#f8fafc] border border-[#e5e5e5] rounded-[12px] h-[71px] flex items-center justify-between px-4">
            <div className="flex flex-col">
              <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Enable 2FA</p>
              <p className="text-[12px] text-[#6a7282]" style={mont}>Add extra security to your account</p>
            </div>
            <Toggle checked={twoFactorEnabled} onChange={handleToggle2fa} />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSaving}
            className="h-9 px-4 inline-flex items-center gap-2 bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60"
            style={mont}
          >
            <ShieldCheck size={14} />
            {isSaving ? "Updating..." : "Update Security"}
          </button>
        </div>
      </form>
    </div>
  );
}
