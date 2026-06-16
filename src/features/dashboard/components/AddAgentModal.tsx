"use client";

import { useState, useRef } from "react";
import { X, Upload, ChevronDown, Check, Copy } from "lucide-react";

import { createAgentInvitation } from "@/features/auth/staff-actions";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type AddAgentModalProps = {
  onClose: () => void;
};

const ROLES = ["Agent", "Manager"] as const;

type InviteSuccess = { inviteUrl: string; emailSent: boolean; email: string };

export function AddAgentModal({ onClose }: AddAgentModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("Agent");
  const [location, setLocation] = useState("");
  const [teamLeader, setTeamLeader] = useState("");
  const [notes, setNotes] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<InviteSuccess | null>(null);
  const [copied, setCopied] = useState(false);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    const result = await createAgentInvitation({
      email: email.trim(),
      role: role.toUpperCase(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
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
            <p className="text-[16px] font-semibold text-[#1f2937]" style={mont}>Invitation created</p>
            <p className="text-[13px] text-[#6a7282]" style={mont}>
              {success.emailSent
                ? `An invitation email was sent to ${success.email}.`
                : `Email delivery is not configured — share the link below with ${success.email} manually.`}
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
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full h-[40px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
              style={mont}
            >
              Done
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
            Add New Agent
          </p>

          <p
            className="mt-0.5 text-[11px] leading-4 text-[#6a7282] sm:text-[12px]"
            style={mont}
          >
            Fill in the details to add a new team member
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
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
            Profile Photo
          </p>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex size-[68px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f3f4f6] sm:size-[80px]">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
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
              Upload Photo
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
              First Name *
            </label>

            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[38px]"
              style={mont}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              Last Name *
            </label>

            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
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
              Email Address *
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
              Phone Number *
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
              Role *
            </label>

            <div className="relative">
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-10 w-full cursor-pointer appearance-none rounded-[10px] border border-[#e5e7eb] bg-white pl-3 pr-8 text-[12px] text-[#0d2138] outline-none transition-colors focus:border-[#1e4f86] sm:h-[38px]"
                style={mont}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6a7282]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              Location *
            </label>

            <input
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Buenos Aires, Argentina"
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
              Team Leader *
            </label>

            <div className="relative">
              <select
                value={teamLeader}
                onChange={(e) => setTeamLeader(e.target.value)}
                className="h-10 w-full cursor-pointer appearance-none rounded-[10px] border border-[#e5e7eb] bg-white pl-3 pr-8 text-[12px] text-[#0d2138] outline-none transition-colors focus:border-[#1e4f86] sm:h-[38px]"
                style={mont}
              >
                <option value="">Select Team Leader</option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6a7282]"
              />
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
            style={mont}
          >
            Notes
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes about this contact..."
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
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="h-10 rounded-[10px] bg-[#1e4f86] text-[11px] font-medium text-white transition-colors hover:bg-[#1b487a] disabled:opacity-60 sm:text-[12px]"
            style={mont}
          >
            {submitting ? "Sending invite…" : "Send Invite"}
          </button>
        </div>
      </form>
    </div>
  </div>
);
}
