"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import type { AgentDto } from "@/features/agents/agent-actions";
import { SearchableSelect } from "./SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type EditAgentModalProps = {
  agent: AgentDto;
  onClose: () => void;
  onSaved: (agent: AgentDto) => void;
};

// Displayed labels are translated via ROLE_I18N_KEY below; these values stay
// in stable English because they're compared against directly and sent to
// the server as `role.toUpperCase()`.
const EDITABLE_ROLES = ["Agent", "Manager"] as const;
const ROLE_I18N_KEY: Record<string, string> = {
  Agent: "role.agent",
  Manager: "role.manager",
  Administrator: "role.administrator",
};

type TeamLeaderOption = { id: string; name: string };

// updateAgent()/validateTeamLeader() (src/features/agents/agent-actions.ts)
// return a handful of specific, known English validation strings the admin
// genuinely needs to see (not just "update failed") — map each to its
// translation; anything unrecognized still falls back to the generic toast.
const KNOWN_UPDATE_ERROR_I18N_KEY: Record<string, string> = {
  "Agent not found.": "editModal.toasts.errors.agentNotFound",
  "Role must be AGENT or MANAGER.": "editModal.toasts.errors.invalidRole",
  "An Admin's role can't be changed here.": "editModal.toasts.errors.adminRoleLocked",
  "An agent can't be their own team leader.": "editModal.toasts.errors.selfTeamLeader",
  "Team leader must be an active Manager or Admin.": "editModal.toasts.errors.invalidTeamLeader",
};

function roleToLabel(role: AgentDto["role"]): string {
  if (role === "MANAGER") return "Manager";
  if (role === "ADMIN") return "Administrator";
  return "Agent";
}

export function EditAgentModal({ agent, onClose, onSaved }: EditAgentModalProps) {
  const { t } = useTranslation("agents");
  const [fullName, setFullName] = useState(agent.name);
  const [phone, setPhone] = useState(agent.phone ?? "");
  const [city, setCity] = useState(agent.city ?? "");
  const [notes, setNotes] = useState(agent.notes ?? "");
  const [role, setRole] = useState<string>(agent.role === "ADMIN" ? "Administrator" : roleToLabel(agent.role));
  const [teamLeaderId, setTeamLeaderId] = useState(agent.teamLeaderId ?? "");
  const [teamLeaders, setTeamLeaders] = useState<TeamLeaderOption[]>([]);
  const [teamLeadersLoading, setTeamLeadersLoading] = useState(agent.role !== "ADMIN");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(agent.avatarUrl);
  const [removePhoto, setRemovePhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agent.role === "ADMIN") return;
    fetch("/api/dashboard/agents")
      .then((res) => res.json())
      .then((json) => {
        const agents: AgentDto[] = json.agents ?? [];
        setTeamLeaders(
          agents
            .filter(
              (a) =>
                a.id !== agent.id &&
                a.status === "ACTIVE" &&
                (a.role === "MANAGER" || a.role === "ADMIN"),
            )
            .map((a) => ({ id: a.id, name: a.name })),
        );
      })
      .catch(() => undefined)
      .finally(() => setTeamLeadersLoading(false));
  }, [agent.id, agent.role]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setRemovePhoto(false);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleRemovePhoto() {
    setAvatarFile(null);
    setRemovePhoto(true);
    setAvatarPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.set("avatar", avatarFile);
        const res = await fetch(`/api/dashboard/agents/${agent.id}/avatar`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          setError(t("editModal.toasts.uploadPhotoFailed"));
          return;
        }
      } else if (removePhoto && agent.avatarUrl) {
        const res = await fetch(`/api/dashboard/agents/${agent.id}/avatar`, { method: "DELETE" });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          setError(t("editModal.toasts.removePhotoFailed"));
          return;
        }
      }

      const body: Record<string, unknown> = {
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        notes: notes.trim() || null,
      };
      // Admin's role is never editable through this UI — omit it entirely.
      if (agent.role !== "ADMIN") {
        body.role = role.toUpperCase();
        if (role === "Agent") body.teamLeaderId = teamLeaderId || null;
      }

      const res = await fetch(`/api/dashboard/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const knownKey = data?.error ? KNOWN_UPDATE_ERROR_I18N_KEY[data.error] : undefined;
        setError(knownKey ? t(knownKey) : t("editModal.toasts.updateFailed"));
        return;
      }
      toast.success(t("editModal.toasts.updated"));
      onSaved(data.agent);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative flex max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-[16px] bg-white shadow-xl sm:max-h-[90vh] sm:max-w-[520px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6 sm:pb-[18px] sm:pt-[18px]">
          <div className="min-w-0 pr-3">
            <p className="text-[15px] font-semibold text-[#1f2937] sm:text-[16px]" style={mont}>
              {t("editModal.title")}
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-[#6a7282] sm:text-[12px]" style={mont}>
              {t("editModal.subtitle", { name: agent.name })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("editModal.closeAria")}
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
            <p className="mb-3 text-[13px] font-medium text-[#1f2937] sm:text-[14px]" style={mont}>
              {t("editModal.profilePhoto")}
            </p>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex size-[68px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f3f4f6] sm:size-[80px]">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={t("editModal.uploadPhoto")} className="size-full object-cover" />
                ) : (
                  <Upload size={20} className="text-[#6a7282] sm:size-[22px]" />
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
                {avatarPreview ? t("editModal.changePhoto") : t("editModal.uploadPhoto")}
              </button>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="h-[38px] rounded-[10px] px-3 text-[11px] font-medium text-[#dc2626] transition-colors hover:bg-[#fef2f2] sm:px-4 sm:text-[12px]"
                  style={mont}
                >
                  {t("editModal.remove")}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>
              {t("editModal.fullName")}
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("editModal.fullNamePlaceholder")}
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[38px]"
              style={mont}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>
              {t("editModal.email")}
            </label>
            <input
              disabled
              value={agent.email}
              className="h-10 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[12px] text-[#6a7282] outline-none sm:h-[38px]"
              style={mont}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>
                {t("editModal.phone")}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("editModal.phonePlaceholder")}
                className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[38px]"
                style={mont}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>
                {t("editModal.location")}
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t("editModal.locationPlaceholder")}
                className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[38px]"
                style={mont}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>
              {t("editModal.role")}
            </label>

            {agent.role === "ADMIN" ? (
              <input
                disabled
                value={t("role.administrator")}
                title={t("editModal.adminRoleTooltip")}
                className="h-10 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[12px] text-[#6a7282] outline-none sm:h-[38px]"
                style={mont}
              />
            ) : (
              <SearchableSelect
                value={role}
                onChange={setRole}
                options={EDITABLE_ROLES.map((r) => ({ value: r, label: t(ROLE_I18N_KEY[r]) }))}
                placeholder={t("editModal.rolePlaceholder")}
                searchable={false}
                size="sm"
              />
            )}
          </div>

          {agent.role !== "ADMIN" && role === "Agent" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>
                {t("editModal.teamLeader")}
              </label>

              <SearchableSelect
                value={teamLeaderId}
                onChange={setTeamLeaderId}
                options={[
                  // Explicit empty option so an assigned leader can be cleared.
                  ...(teamLeaderId ? [{ value: "", label: t("editModal.noTeamLeaderOption") }] : []),
                  ...teamLeaders.map((leader) => ({ value: leader.id, label: leader.name })),
                ]}
                placeholder={t("editModal.teamLeaderPlaceholder")}
                searchPlaceholder={t("editModal.searchTeamLeadersPlaceholder")}
                emptyLabel={t("editModal.noTeamLeadersFound")}
                loading={teamLeadersLoading}
                size="sm"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>
              {t("editModal.notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("editModal.notesPlaceholder")}
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

          <div className="relative bottom-0 z-10 -mx-4 -mb-4 grid grid-cols-2 gap-2 border-t border-[#e5e7eb] bg-white px-4 py-3 sm:static sm:mx-0 sm:mb-0 sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-10 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] text-[11px] font-medium text-[#6b7280] transition-colors hover:bg-[#f3f4f6] disabled:opacity-60 sm:text-[12px]"
              style={mont}
            >
              {t("editModal.cancel")}
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-[10px] bg-[#1e4f86] text-[11px] font-medium text-white transition-colors hover:bg-[#1b487a] disabled:opacity-60 sm:text-[12px]"
              style={mont}
            >
              {submitting ? t("editModal.saving") : t("editModal.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
