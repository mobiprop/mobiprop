"use client";

import { useEffect, useState, useRef } from "react";
import { X, Upload, Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";

import { createAgentInvitation } from "@/features/auth/staff-actions";
import type { AgentDto } from "@/features/agents/agent-actions";
import type { Role } from "@/lib/permissions";
import { SearchableSelect } from "./SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type AddAgentModalProps = {
  viewerRole: Role;
  onClose: () => void;
};

// Displayed labels are translated via ROLE_I18N_KEY below; these values stay
// in stable English because they're compared against directly and sent to
// the server as `role.toUpperCase()`.
const ROLES = ["Agent", "Manager"] as const;
const ADMIN_ROLE_LABEL = "Administrator";
const ROLE_I18N_KEY: Record<string, string> = {
  Agent: "role.agent",
  Manager: "role.manager",
  Administrator: "role.administrator",
};

type InviteSuccess = { inviteUrl: string; emailSent: boolean; email: string };
type TeamLeaderOption = { id: string; name: string };

export function AddAgentModal({ viewerRole, onClose }: AddAgentModalProps) {
  const { t } = useTranslation("agents");
  const canInviteAdmin = viewerRole === "ADMIN";
  const roleOptions = canInviteAdmin ? [...ROLES, ADMIN_ROLE_LABEL] : ROLES;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("Agent");
  const [location, setLocation] = useState("");
  const [teamLeader, setTeamLeader] = useState("");
  const [teamLeaders, setTeamLeaders] = useState<TeamLeaderOption[]>([]);
  const [teamLeadersLoading, setTeamLeadersLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [adminConfirmed, setAdminConfirmed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<InviteSuccess | null>(null);
  const [copied, setCopied] = useState(false);

  const isAdminRole = role === ADMIN_ROLE_LABEL;

  function handleRoleChange(next: string) {
    setRole(next);
    if (next !== ADMIN_ROLE_LABEL) setAdminConfirmed(false);
  }

  useEffect(() => {
    fetch("/api/dashboard/agents")
      .then((res) => res.json())
      .then((json) => {
        const agents: AgentDto[] = json.agents ?? [];
        setTeamLeaders(
          agents
            .filter((a) => a.status === "ACTIVE" && (a.role === "MANAGER" || a.role === "ADMIN"))
            .map((a) => ({ id: a.id, name: a.name })),
        );
      })
      .catch(() => undefined)
      .finally(() => setTeamLeadersLoading(false));
  }, []);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (isAdminRole && !adminConfirmed) {
      setError(t("addModal.adminConfirmRequired"));
      return;
    }
    setError(null);
    setSubmitting(true);

    const result = await createAgentInvitation({
      email: email.trim(),
      role: isAdminRole ? "ADMIN" : role.toUpperCase(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      teamLeaderId: role === "Agent" ? teamLeader || undefined : undefined,
    });

    if (!result.ok) {
      setSubmitting(false);
      setError(result.error);
      return;
    }

    // Best-effort: a photo-upload failure never blocks the invitation itself.
    if (photoFile) {
      const formData = new FormData();
      formData.set("avatar", photoFile);
      await fetch(`/api/invitations/${result.invitationId}/avatar`, {
        method: "POST",
        body: formData,
      }).catch(() => undefined);
    }

    setSubmitting(false);
    setSuccess({ inviteUrl: result.inviteUrl, emailSent: result.emailSent, email: email.trim() });
  }

  async function handleCopy() {
    if (!success) return;
    try {
      await navigator.clipboard.writeText(success.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — user can select the text manually.
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/40" />
        <div
          className="relative bg-white rounded-[16px] w-full max-w-[480px] shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-6 flex flex-col items-center text-center gap-3">
            <div className="size-[56px] rounded-full bg-[#dcfce7] flex items-center justify-center">
              <Check size={28} className="text-[#16a34a]" />
            </div>
            <p className="text-[16px] font-semibold text-[#1f2937]" style={mont}>{t("addModal.success.title")}</p>
            <p className="text-[13px] text-[#6a7282]" style={mont}>
              {success.emailSent
                ? t("addModal.success.emailSent", { email: success.email })
                : t("addModal.success.emailNotSent", { email: success.email })}
            </p>

            <div className="w-full mt-2 flex items-stretch gap-2">
              <input
                readOnly
                value={success.inviteUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 h-[38px] px-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] bg-[#f9fafb] outline-none"
                style={mont}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="h-[38px] px-3 border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#1e4f86] hover:bg-[#f3f4f6] transition-colors flex items-center gap-1.5"
                style={mont}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? t("addModal.success.copied") : t("addModal.success.copy")}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full h-[40px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
              style={mont}
            >
              {t("addModal.success.done")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div
    className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4"
    onClick={onClose}
  >
    <div className="absolute inset-0 bg-black/40" />

    <div
      className="relative flex max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-[16px] bg-white shadow-xl sm:max-h-[90vh] sm:max-w-[600px]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6 sm:pb-[18px] sm:pt-[18px]">
        <div className="min-w-0 pr-3">
          <p
            className="text-[15px] font-semibold text-[#1f2937] sm:text-[16px]"
            style={mont}
          >
            {t("addModal.title")}
          </p>

          <p
            className="mt-0.5 text-[11px] leading-4 text-[#6a7282] sm:text-[12px]"
            style={mont}
          >
            {t("addModal.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={t("addModal.closeAria")}
          className="flex size-9 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
        >
          <X size={18} />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:gap-5 sm:px-6 sm:py-5"
      >
        {/* Profile Photo */}
        <div>
          <p
            className="mb-3 text-[13px] font-medium text-[#1f2937] sm:text-[14px]"
            style={mont}
          >
            {t("addModal.profilePhoto")}
          </p>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex size-[68px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f3f4f6] sm:size-[80px]">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={t("addModal.uploadPhoto")}
                  className="size-full object-cover"
                />
              ) : (
                <Upload
                  size={20}
                  className="text-[#6a7282] sm:size-[22px]"
                />
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-[38px] rounded-[10px] border border-[#e5e7eb] px-3 text-[11px] font-medium text-[#6a7282] transition-colors hover:bg-[#f9fafb] sm:px-4 sm:text-[12px]"
              style={mont}
            >
              {t("addModal.uploadPhoto")}
            </button>
          </div>
        </div>

        {/* Name row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              {t("addModal.firstName")}
            </label>

            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t("addModal.firstNamePlaceholder")}
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[38px]"
              style={mont}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              {t("addModal.lastName")}
            </label>

            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t("addModal.lastNamePlaceholder")}
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[38px]"
              style={mont}
            />
          </div>
        </div>

        {/* Email + Phone */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              {t("addModal.email")}
            </label>

            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@ulrich.com"
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[38px]"
              style={mont}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              {t("addModal.phone")}
            </label>

            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 11 1234-5678"
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[38px]"
              style={mont}
            />
          </div>
        </div>

        {/* Role + Location */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              {t("addModal.role")}
            </label>

            <SearchableSelect
              value={role}
              onChange={handleRoleChange}
              options={roleOptions.map((r) => ({ value: r, label: t(ROLE_I18N_KEY[r]) }))}
              placeholder={t("addModal.rolePlaceholder")}
              searchable={false}
              size="sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              {t("addModal.location")}
            </label>

            <input
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("addModal.locationPlaceholder")}
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[38px]"
              style={mont}
            />
          </div>
        </div>

        {/* Team Leader */}
        {role === "Agent" && (
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              {t("addModal.teamLeader")}
            </label>

            <SearchableSelect
              value={teamLeader}
              onChange={setTeamLeader}
              options={[
                // Explicit empty option so a picked leader can be cleared.
                ...(teamLeader ? [{ value: "", label: t("addModal.noTeamLeaderOption") }] : []),
                ...teamLeaders.map((leader) => ({ value: leader.id, label: leader.name })),
              ]}
              placeholder={t("addModal.teamLeaderPlaceholder")}
              searchPlaceholder={t("addModal.searchTeamLeadersPlaceholder")}
              emptyLabel={t("addModal.noTeamLeadersFound")}
              loading={teamLeadersLoading}
              size="sm"
            />
          </div>
        )}

        {/* Admin step-up confirmation */}
        {isAdminRole && (
          <div className="rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-3 py-3">
            <p className="text-[12px] font-medium text-[#92400e]" style={mont}>
              {t("addModal.adminWarningTitle")}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[#92400e]" style={mont}>
              {t("addModal.adminWarningBody")}
            </p>
            <label className="mt-2 flex items-start gap-2 text-[11px] text-[#92400e]" style={mont}>
              <input
                type="checkbox"
                checked={adminConfirmed}
                onChange={(e) => setAdminConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              {t("addModal.adminConfirmLabel")}
            </label>
          </div>
        )}

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
            style={mont}
          >
            {t("addModal.notes")}
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("addModal.notesPlaceholder")}
            rows={4}
            className="min-h-[96px] resize-none rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86]"
            style={mont}
          />
        </div>

        {error && (
          <p
            className="rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[11px] leading-5 text-[#dc2626] sm:text-[12px]"
            style={mont}
          >
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="relative bottom-0 z-10 -mx-4 -mb-4 grid grid-cols-2 gap-2 border-t border-[#e5e7eb] bg-white px-4 py-3 sm:static sm:mx-0 sm:mb-0 sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] text-[11px] font-medium text-[#6b7280] transition-colors hover:bg-[#f3f4f6] disabled:opacity-60 sm:text-[12px]"
            style={mont}
          >
            {t("addModal.cancel")}
          </button>

          <button
            type="submit"
            disabled={submitting || (isAdminRole && !adminConfirmed)}
            className="h-10 rounded-[10px] bg-[#1e4f86] text-[11px] font-medium text-white transition-colors hover:bg-[#1b487a] disabled:opacity-60 sm:text-[12px]"
            style={mont}
          >
            {submitting ? t("addModal.sendingInvite") : t("addModal.sendInvite")}
          </button>
        </div>
      </form>
    </div>
  </div>
);
}
