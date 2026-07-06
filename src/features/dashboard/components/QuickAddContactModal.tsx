"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { ContactType } from "@/generated/prisma/enums";
import type { ContactDto } from "@/features/crm/types/crm-dto";
import { useCreateContactMutation } from "@/hooks/mutations/useCrmMutations";
import { SearchableSelect } from "./SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type QuickAddContactModalProps = {
  onClose: () => void;
  /** Fires with the real, persisted Contact once it's created server-side. */
  onCreate?: (contact: ContactDto) => void;
};

const inputClass =
  "h-10 px-3.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] font-medium text-[#1f2937]";

export function QuickAddContactModal({ onClose, onCreate }: QuickAddContactModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<ContactType>(ContactType.BUYER);

  const createMutation = useCreateContactMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { contact } = await createMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        type,
      });
      toast.success("Contact created");
      onCreate?.(contact);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create contact");
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[16px] w-full max-w-[536px] max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e7eb]">
          <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>Add New Contact</p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
          {/* First / Last */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>First Name *</label>
              <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className={inputClass} style={mont} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Last Name *</label>
              <input required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className={inputClass} style={mont} />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.doe@example.com" className={inputClass} style={mont} />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" className={inputClass} style={mont} />
          </div>
          {!email.trim() && !phone.trim() && (
            <p className="-mt-3 text-[12px] text-[#b45309]" style={mont}>Provide at least an email or a phone number.</p>
          )}

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>Type</label>
            <SearchableSelect
              size="sm"
              searchable={false}
              value={type}
              onChange={(next) => setType(next as ContactType)}
              options={[
                { value: ContactType.BUYER, label: "Buyer" },
                { value: ContactType.SELLER, label: "Seller" },
                { value: ContactType.BOTH, label: "Both" },
              ]}
              placeholder="Select type"
              ariaLabel="Contact type"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-[41.5px] border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] bg-white hover:bg-[#f3f4f6] transition-colors" style={mont}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || (!email.trim() && !phone.trim())}
              className="flex-1 h-[41.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={mont}
            >
              {createMutation.isPending ? "Saving…" : "Add Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
