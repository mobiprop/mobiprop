"use client";

import { useState } from "react";
import { X, ChevronDown, Home, ExternalLink, Plus, UserPlus, Upload, Trash2 } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type ContractType = "Sale" | "Rent" | "Sale & Rent";
export type ContractStatus = "Active" | "Pending" | "Completed";

export type NewContract = {
  title: string;
  type: ContractType;
  status: ContractStatus;
  listing: string;
  participants: Participant[];
  properties: string[];
  terms: string;
};

type Participant = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type ParticipantMode = "none" | "existing" | "new";

type AddContractModalProps = {
  onClose: () => void;
  onCreate?: (contract: NewContract) => void;
  isSaving?: boolean;
};

const inputClass =
  "h-10 px-3.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] text-[#1f2937]";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[#1e4f86]" : "bg-[#d1d5db]"}`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}

export function AddContractModal({ onClose, onCreate, isSaving }: AddContractModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ContractType>("Sale");
  const [status, setStatus] = useState<ContractStatus>("Active");
  const [listing, setListing] = useState("");
  const [terms, setTerms] = useState("");
  const [properties, setProperties] = useState<string[]>([""]);

  const [participants, setParticipants] = useState<Participant[]>([
    { id: 1, name: "John Doe", email: "john@example.com", role: "Buyer" },
  ]);
  const [participantMode, setParticipantMode] = useState<ParticipantMode>("none");

  // "Add existing contact" sub-form
  const [existingSearch, setExistingSearch] = useState("");
  const [existingRole, setExistingRole] = useState("");

  // "New contact" sub-form
  const [ncFirst, setNcFirst] = useState("");
  const [ncLast, setNcLast] = useState("");
  const [ncEmail, setNcEmail] = useState("");
  const [ncPhone, setNcPhone] = useState("");
  const [ncType, setNcType] = useState("");
  const [ncLinkAsParticipant, setNcLinkAsParticipant] = useState(true);
  const [ncRole, setNcRole] = useState("");

  function addExistingParticipant() {
    if (!existingSearch.trim()) return;
    setParticipants((prev) => [
      ...prev,
      { id: Math.max(0, ...prev.map((p) => p.id)) + 1, name: existingSearch.trim(), email: "", role: existingRole || "Participant" },
    ]);
    setExistingSearch("");
    setExistingRole("");
    setParticipantMode("none");
  }

  function createNewParticipant() {
    const name = `${ncFirst} ${ncLast}`.trim();
    if (!name) return;
    if (ncLinkAsParticipant) {
      setParticipants((prev) => [
        ...prev,
        { id: Math.max(0, ...prev.map((p) => p.id)) + 1, name, email: ncEmail.trim(), role: ncRole || ncType || "Participant" },
      ]);
    }
    setNcFirst(""); setNcLast(""); setNcEmail(""); setNcPhone(""); setNcType(""); setNcRole("");
    setParticipantMode("none");
  }

  function removeParticipant(id: number) {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }

  function updateProperty(index: number, value: string) {
    setProperties((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate?.({
      title: title.trim(),
      type,
      status,
      listing,
      participants,
      properties: properties.map((p) => p.trim()).filter(Boolean),
      terms: terms.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-[16px] bg-white shadow-xl sm:max-h-[92vh] sm:max-w-[850px] sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-5 sm:pb-[21px] sm:pt-5">
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-[15px] font-semibold leading-6 text-[#0d2138] sm:text-[16px]" style={mont}>New Contract</p>
            <p className="mt-0.5 truncate text-[11px] text-[#6a7282] sm:text-[12px]" style={mont}>Create a new property contract</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 sm:gap-6 sm:px-6 sm:py-6">
          {/* Basic Information */}
          <div className="flex flex-col gap-4">
            <p className="text-[14px] font-medium text-[#1f2937]" style={mont}>Basic Information</p>
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className={labelClass} style={mont}>Contract Title *</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Sale Agreement - Sierra Lakeview Estate"
                  className={inputClass}
                  style={mont}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass} style={mont}>Contract Type *</label>
                <div className="relative">
                  <select
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value as ContractType)}
                    className="w-full h-10 pl-3 pr-9 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#232323] appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer"
                    style={mont}
                  >
                    <option value="Sale">Sale</option>
                    <option value="Rent">Rent</option>
                    <option value="Sale & Rent">Sale &amp; Rent</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-[12px] p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Home size={15} className="text-[#1e4f86]" />
              <p className="text-[14px] font-medium text-[#1e4f86]" style={mont}>Participants</p>
            </div>
            <p className="text-[12px] text-[#6a7282]" style={mont}>Assign people associated with this contract.</p>

            {/* Participant list */}
            <div className="flex flex-col gap-2">
              {participants.map((p) => (
                <div key={p.id} className="bg-white border border-[#e5e7eb] rounded-[10px] p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-[43px] shrink-0 rounded-full bg-[#1e4f86] text-white flex items-center justify-center text-[14px] font-medium" style={mont}>
                      {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-[14px] font-medium text-[#111827] truncate" style={mont}>{p.name}</p>
                      <p className="text-[14px] text-[#6b7280] truncate" style={mont}>
                        {[p.email, p.role].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setParticipantMode(participantMode === "new" ? "none" : "new")}
                      className={`h-9 px-3 rounded-[8px] flex items-center gap-2 text-[12px] font-medium border transition-colors ${
                        participantMode === "new"
                          ? "bg-[#1e4f86] border-[#1e4f86] text-white"
                          : "bg-white border-[#1e4f86] text-[#1e4f86] hover:bg-[#eff6ff]"
                      }`}
                      style={mont}
                    >
                      <UserPlus size={16} />
                      Add Contact
                    </button>
                    <button
                      type="button"
                      onClick={() => setParticipantMode(participantMode === "existing" ? "none" : "existing")}
                      className={`h-9 px-3 rounded-[8px] flex items-center gap-2 text-[12px] font-medium border transition-colors ${
                        participantMode === "existing"
                          ? "bg-[#1e4f86] border-[#1e4f86] text-white"
                          : "bg-white border-[#1e4f86] text-[#1e4f86] hover:bg-[#eff6ff]"
                      }`}
                      style={mont}
                    >
                      <Plus size={16} />
                      Add Participant
                    </button>
                    {participants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeParticipant(p.id)}
                        title="Remove participant"
                        className="size-9 flex items-center justify-center text-[#6a7282] hover:text-[#fb2c36] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add existing contact as participant */}
            {participantMode === "existing" && (
              <div className="flex flex-col gap-3 pt-1">
                <p className="text-[12px] font-semibold text-[#1f2937]" style={mont}>Add Existing Contact as Participant</p>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Select Contact *</label>
                  <input
                    value={existingSearch}
                    onChange={(e) => setExistingSearch(e.target.value)}
                    placeholder="Search contacts by name or email..."
                    className="h-10 px-3 bg-white border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
                    style={mont}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Role in Contract *</label>
                  <div className="relative">
                    <select
                      value={existingRole}
                      onChange={(e) => setExistingRole(e.target.value)}
                      className="w-full h-10 pl-3 pr-9 bg-white border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#232323] appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer"
                      style={mont}
                    >
                      <option value="">Select role</option>
                      <option value="Buyer">Buyer</option>
                      <option value="Seller">Seller</option>
                      <option value="Agent">Agent</option>
                      <option value="Tenant">Tenant</option>
                      <option value="Landlord">Landlord</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={addExistingParticipant}
                    className="h-9 px-4 bg-[#1e4f86] rounded-[8px] flex items-center gap-2 text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
                    style={mont}
                  >
                    <UserPlus size={16} />
                    Add to Contract
                  </button>
                  <button
                    type="button"
                    onClick={() => setParticipantMode("none")}
                    className="h-9 px-4 border border-[#e5e7eb] rounded-[8px] text-[12px] font-medium text-[#6b7280] bg-white hover:bg-[#f3f4f6] transition-colors"
                    style={mont}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* New contact creation */}
            {participantMode === "new" && (
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <div className="size-7 shrink-0 rounded-full bg-[#d1d5db] flex items-center justify-center text-[11px] font-semibold text-[#6b7280]" style={mont}>?</div>
                  <div className="flex flex-col">
                    <p className="text-[12px] font-medium text-[#111827]" style={mont}>New Contact</p>
                    <p className="text-[11px] text-[#9ca3af]" style={mont}>Email address</p>
                  </div>
                </div>
                <p className="text-[12px] text-[#6b7280]" style={mont}>Contact Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} style={mont}>First Name *</label>
                    <input value={ncFirst} onChange={(e) => setNcFirst(e.target.value)} placeholder="e.g. Jane" className="h-10 px-3 bg-white border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors" style={mont} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} style={mont}>Last Name *</label>
                    <input value={ncLast} onChange={(e) => setNcLast(e.target.value)} placeholder="e.g. Smith" className="h-10 px-3 bg-white border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors" style={mont} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} style={mont}>Email Address *</label>
                    <input type="email" value={ncEmail} onChange={(e) => setNcEmail(e.target.value)} placeholder="jane@example.com" className="h-10 px-3 bg-white border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors" style={mont} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} style={mont}>Phone Number</label>
                    <input type="tel" value={ncPhone} onChange={(e) => setNcPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="h-10 px-3 bg-white border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors" style={mont} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Contact Type *</label>
                  <div className="relative">
                    <select value={ncType} onChange={(e) => setNcType(e.target.value)} className="w-full h-10 pl-3 pr-9 bg-white border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#232323] appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer" style={mont}>
                      <option value="">Select contact type</option>
                      <option value="Buyer">Buyer</option>
                      <option value="Seller">Seller</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
                  </div>
                </div>
                {/* Add as contact participant toggle */}
                <div className="flex items-center justify-between gap-3 border border-[#e5e7eb] rounded-[10px] bg-white px-3.5 py-3">
                  <div className="flex flex-col">
                    <p className="text-[12px] font-semibold text-[#1f2937]" style={mont}>Add as contact participant</p>
                    <p className="text-[11px] text-[#6b7280]" style={mont}>Link this new contact directly to this contract</p>
                  </div>
                  <Toggle checked={ncLinkAsParticipant} onChange={setNcLinkAsParticipant} />
                </div>
                {ncLinkAsParticipant && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} style={mont}>Role in Contract *</label>
                    <div className="relative">
                      <select value={ncRole} onChange={(e) => setNcRole(e.target.value)} className="w-full h-10 pl-3 pr-9 bg-white border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#232323] appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer" style={mont}>
                        <option value="">Select role in this contract</option>
                        <option value="Buyer">Buyer</option>
                        <option value="Seller">Seller</option>
                        <option value="Agent">Agent</option>
                        <option value="Tenant">Tenant</option>
                        <option value="Landlord">Landlord</option>
                      </select>
                      <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={createNewParticipant}
                    className="h-9 px-4 bg-[#1e4f86] rounded-[8px] flex items-center gap-2 text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
                    style={mont}
                  >
                    <UserPlus size={16} />
                    Create &amp; Add to Contract
                  </button>
                  <button
                    type="button"
                    onClick={() => setParticipantMode("none")}
                    className="h-9 px-4 border border-[#e5e7eb] rounded-[8px] text-[12px] font-medium text-[#6b7280] bg-white hover:bg-[#f3f4f6] transition-colors"
                    style={mont}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Listing / Status */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className={labelClass} style={mont}>Listing *</label>
              <div className="relative">
                <select
                  required
                  value={listing}
                  onChange={(e) => setListing(e.target.value)}
                  className="w-full h-10 pl-3 pr-9 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#232323] appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer"
                  style={mont}
                >
                  <option value="">Select Listing</option>
                  <option value="Sierra Lakeview Estate">Sierra Lakeview Estate</option>
                  <option value="Palermo Loft">Palermo Loft</option>
                  <option value="Nordelta Villa">Nordelta Villa</option>
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} style={mont}>Status *</label>
              <div className="relative">
                <select
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContractStatus)}
                  className="w-full h-10 pl-3 pr-9 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#232323] appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer"
                  style={mont}
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Property Listings */}
          <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-[12px] p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Home size={15} className="text-[#1e4f86]" />
              <p className="text-[14px] font-medium text-[#1e4f86]" style={mont}>Property Listings</p>
            </div>
            <p className="text-[12px] text-[#6a7282]" style={mont}>
              Add properties this seller owns to identify and link them to this contact.
            </p>
            <div className="flex flex-col gap-2.5">
              {properties.map((property, index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <span className="size-6 shrink-0 rounded-full bg-[#1e4f86] text-white flex items-center justify-center text-[11px] font-semibold" style={mont}>
                    {index + 1}
                  </span>
                  <input
                    value={property}
                    onChange={(e) => updateProperty(index, e.target.value)}
                    placeholder="Property address or listing ID"
                    className="flex-1 h-9 px-3 bg-white border-[1.5px] border-[#c2dcff] rounded-[8px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
                    style={mont}
                  />
                  <button
                    type="button"
                    className="h-9 px-3 bg-[#1e4f86] rounded-[8px] flex items-center gap-2 text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors shrink-0"
                    style={mont}
                  >
                    <ExternalLink size={12} />
                    View Listing
                  </button>
                  {properties.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setProperties((prev) => prev.filter((_, i) => i !== index))}
                      title="Remove"
                      className="size-9 shrink-0 flex items-center justify-center text-[#6a7282] hover:text-[#fb2c36] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setProperties((prev) => [...prev, ""])}
              className="self-start h-9 px-4 border-[1.5px] border-[#1a5ea8] rounded-[8px] text-[12px] font-bold text-[#1e4f86] hover:bg-[#eff6ff] transition-colors"
              style={mont}
            >
              Add Listing
            </button>
          </div>

          {/* Additional Details */}
          <div className="flex flex-col gap-4">
            <p className="text-[14px] font-medium text-[#1f2937]" style={mont}>Additional Details</p>
            <div className="flex flex-col gap-2">
              <label className={labelClass} style={mont}>Terms &amp; Conditions</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Enter specific contract terms, conditions, and special clauses..."
                rows={4}
                className="px-3.5 py-2.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors resize-none"
                style={mont}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={labelClass} style={mont}>Contract Documents</label>
              <div className="bg-[#fafbfc] border-2 border-dashed border-[#e5e7eb] rounded-[10px] flex flex-col items-center justify-center gap-1.5 py-6 text-center">
                <Upload size={24} className="text-[#9ca3af]" />
                <p className="text-[13px] font-medium text-[#6b7280]" style={mont}>Click to upload or drag and drop</p>
                <p className="text-[11px] text-[#9ca3af]" style={mont}>PDF, DOC, DOCX up to 10MB</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[41.5px] border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] bg-white hover:bg-[#f3f4f6] transition-colors"
              style={mont}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 h-[41.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={mont}
            >
              {isSaving ? "Saving…" : "Create Contract"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
