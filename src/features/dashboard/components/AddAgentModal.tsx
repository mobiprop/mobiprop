"use client";

import { useState, useRef } from "react";
import { X, Upload, ChevronDown, Check, Copy } from "lucide-react";

import { createAgentInvitation } from "@/features/auth/staff-actions";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type AddAgentModalProps = {
  onClose: () => void;
};

const ROLES = ["Agent", "Manager", "Admin"] as const;

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

    // Only email + role are persisted on the invitation; the invitee provides
    // their name/password when accepting. Other fields are not stored yet.
    const result = await createAgentInvitation({
      email: email.trim(),
      role: role.toUpperCase(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[16px] w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-[18px] pb-[18px] border-b border-[#e5e7eb]">
          <div>
            <p className="text-[16px] font-semibold text-[#1f2937]" style={mont}>Add New Agent</p>
            <p className="text-[12px] text-[#6a7282] mt-0.5" style={mont}>Fill in the details to add a new team member</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          {/* Profile Photo */}
          <div>
            <p className="text-[14px] font-medium text-[#1f2937] mb-3" style={mont}>Profile Photo</p>
            <div className="flex items-center gap-4">
              <div className="size-[80px] rounded-full bg-[#f3f4f6] flex items-center justify-center shrink-0 overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="size-full object-cover" />
                ) : (
                  <Upload size={22} className="text-[#6a7282]" />
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-[38px] px-4 border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6a7282] hover:bg-[#f9fafb] transition-colors"
                style={mont}
              >
                Upload Photo
              </button>
            </div>
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>First Name *</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className="h-[38px] px-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
                style={mont}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Last Name *</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className="h-[38px] px-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
                style={mont}
              />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Email Address *</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@ulrich.com"
                className="h-[38px] px-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
                style={mont}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Phone Number *</label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
                className="h-[38px] px-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
                style={mont}
              />
            </div>
          </div>

          {/* Role + Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Role *</label>
              <div className="relative">
                <select
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-[38px] pl-3 pr-8 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] bg-white appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer"
                  style={mont}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Location *</label>
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Buenos Aires, Argentina"
                className="h-[38px] px-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
                style={mont}
              />
            </div>
          </div>

          {/* Team Leader (shown when role is Agent) */}
          {role === "Agent" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Team Leader *</label>
              <div className="relative">
                <select
                  value={teamLeader}
                  onChange={(e) => setTeamLeader(e.target.value)}
                  className="w-full h-[38px] pl-3 pr-8 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] bg-white appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer"
                  style={mont}
                >
                  <option value="">Select Team Leader</option>
                </select>
                <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this contact..."
              rows={4}
              className="px-3 py-2 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors resize-none"
              style={mont}
            />
          </div>

          {error && (
            <p
              className="text-[12px] text-[#dc2626] bg-[#fef2f2] border border-[#fecaca] rounded-[10px] px-3 py-2"
              style={mont}
            >
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-[40px] border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] bg-[#f8fafc] hover:bg-[#f3f4f6] transition-colors disabled:opacity-60"
              style={mont}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-[40px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60"
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
