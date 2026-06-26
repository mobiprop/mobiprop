"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import type { AgentDto } from "@/features/agents/agent-actions";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type EditAgentModalProps = {
  agent: AgentDto;
  onClose: () => void;
  onSaved: (agent: AgentDto) => void;
};

const EDITABLE_ROLES = ["Agent", "Manager"] as const;

function roleToLabel(role: AgentDto["role"]): string {
  if (role === "MANAGER") return "Manager";
  if (role === "ADMIN") return "Administrator";
  return "Agent";
}

export function EditAgentModal({ agent, onClose, onSaved }: EditAgentModalProps) {
  const [fullName, setFullName] = useState(agent.name);
  const [phone, setPhone] = useState(agent.phone ?? "");
  const [city, setCity] = useState(agent.city ?? "");
  const [role, setRole] = useState<string>(agent.role === "ADMIN" ? "Administrator" : roleToLabel(agent.role));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    const body: Record<string, unknown> = {
      fullName: fullName.trim(),
      phone: phone.trim() || null,
      city: city.trim() || null,
    };
    // Admin's role is never editable through this UI — omit it entirely.
    if (agent.role !== "ADMIN") body.role = role.toUpperCase();

    try {
      const res = await fetch(`/api/dashboard/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error ?? "Failed to update agent.");
        return;
      }
      toast.success("Agent updated.");
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
              Edit Agent
            </p>
            <p className="mt-0.5 text-[11px] leading-4 text-[#6a7282] sm:text-[12px]" style={mont}>
              Update {agent.name}&rsquo;s details
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
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>
              Full Name *
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[38px]"
              style={mont}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>
              Email Address
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
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
                className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[38px]"
                style={mont}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>
                Location
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Buenos Aires, Argentina"
                className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[38px]"
                style={mont}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>
              Role *
            </label>

            {agent.role === "ADMIN" ? (
              <input
                disabled
                value="Administrator"
                title="An Admin's role can't be changed from this screen."
                className="h-10 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-3 text-[12px] text-[#6a7282] outline-none sm:h-[38px]"
                style={mont}
              />
            ) : (
              <div className="relative">
                <select
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-10 w-full cursor-pointer appearance-none rounded-[10px] border border-[#e5e7eb] bg-white pl-3 pr-8 text-[12px] text-[#0d2138] outline-none transition-colors focus:border-[#1e4f86] sm:h-[38px]"
                  style={mont}
                >
                  {EDITABLE_ROLES.map((r) => (
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
            )}
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
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-[10px] bg-[#1e4f86] text-[11px] font-medium text-white transition-colors hover:bg-[#1b487a] disabled:opacity-60 sm:text-[12px]"
              style={mont}
            >
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
