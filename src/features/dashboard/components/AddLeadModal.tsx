"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Search, Loader2 } from "lucide-react";

import { LeadSource, LeadTemperature, LeadLifecycleStatus } from "@/generated/prisma/enums";
import { useCreateLeadMutation } from "@/hooks/mutations/useLeadMutations";

function suggestTemperature(score: number): LeadTemperature {
  if (score >= 70) return LeadTemperature.HOT;
  if (score >= 40) return LeadTemperature.WARM;
  return LeadTemperature.COLD;
}
import type { ContactDto } from "@/features/crm/types/crm-dto";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const inputCls =
  "h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";
const labelCls = "text-[12px] font-medium text-[#1f2937]";
const selectCls =
  "w-full h-10 pl-3 pr-9 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#232323] bg-white appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer";

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: LeadSource.MANUAL,                   label: "Manual Entry" },
  { value: LeadSource.WEBSITE_LISTING_INQUIRY,  label: "Listing Inquiry" },
  { value: LeadSource.WEBSITE_CONTACT_FORM,     label: "Contact Form" },
  { value: LeadSource.SCHEDULED_TOUR,           label: "Scheduled Tour" },
  { value: LeadSource.PHONE,                    label: "Phone" },
  { value: LeadSource.EMAIL,                    label: "Email" },
  { value: LeadSource.WHATSAPP,                 label: "WhatsApp" },
  { value: LeadSource.REFERRAL,                 label: "Referral" },
  { value: LeadSource.SOCIAL_MEDIA,             label: "Social Media" },
  { value: LeadSource.OTHER,                    label: "Other" },
];

const TEMP_OPTIONS: { value: LeadTemperature; label: string }[] = [
  { value: LeadTemperature.COLD, label: "Cold" },
  { value: LeadTemperature.WARM, label: "Warm" },
  { value: LeadTemperature.HOT,  label: "Hot"  },
];

const STATUS_OPTIONS: { value: LeadLifecycleStatus; label: string }[] = [
  { value: LeadLifecycleStatus.NEW,         label: "New"         },
  { value: LeadLifecycleStatus.CONTACTED,   label: "Contacted"   },
  { value: LeadLifecycleStatus.FOLLOW_UP,   label: "Follow Up"   },
  { value: LeadLifecycleStatus.QUALIFIED,   label: "Qualified"   },
  { value: LeadLifecycleStatus.UNQUALIFIED, label: "Unqualified" },
];

type Agent = { id: string; fullName: string | null; email: string };
type Listing = { id: string; listingId: string; title: string; location: string };

type AddLeadModalProps = {
  onClose: () => void;
  onCreated?: () => void;
};

export function AddLeadModal({ onClose, onCreated }: AddLeadModalProps) {
  const create = useCreateLeadMutation();

  // Contact section
  const [contactSearch, setContactSearch] = useState("");
  const [contacts, setContacts] = useState<ContactDto[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactDto | null>(null);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const contactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  // Lead details
  const [source, setSource]               = useState<LeadSource>(LeadSource.MANUAL);
  const [sourceDetail, setSourceDetail]   = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [listings, setListings]           = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showListingDropdown, setShowListingDropdown] = useState(false);
  const listingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [budgetMin, setBudgetMin]         = useState("");
  const [budgetMax, setBudgetMax]         = useState("");
  const [currency, setCurrency]           = useState("ARS");
  const [score, setScore]                 = useState(0);
  const [temperature, setTemperature]     = useState<LeadTemperature>(LeadTemperature.COLD);
  const [tempManual, setTempManual]       = useState(false);
  const [lifecycleStatus, setLifecycle]   = useState<LeadLifecycleStatus>(LeadLifecycleStatus.NEW);
  const [agents, setAgents]               = useState<Agent[]>([]);
  const [assignedAgentId, setAgentId]     = useState("");
  const [notes, setNotes]                 = useState("");
  const [error, setError]                 = useState("");

  // Load agents once on mount
  useEffect(() => {
    fetch("/api/dashboard/agents")
      .then((r) => r.json())
      .then((j) => setAgents((j.agents ?? []).filter((a: Agent & { status: string }) => a.status === "ACTIVE")))
      .catch(() => {});
  }, []);

  // Contact search debounce
  function handleContactSearch(val: string) {
    setContactSearch(val);
    setSelectedContact(null);
    if (contactTimer.current) clearTimeout(contactTimer.current);
    if (!val.trim()) { setContacts([]); return; }
    contactTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/dashboard/contacts?search=${encodeURIComponent(val)}`);
        const j = await r.json();
        setContacts((j.contacts ?? []).slice(0, 5));
        setShowContactDropdown(true);
      } catch {}
    }, 300);
  }

  function selectContact(c: ContactDto) {
    setSelectedContact(c);
    setContactSearch(`${c.firstName} ${c.lastName}`.trim());
    setName(`${c.firstName} ${c.lastName}`.trim());
    setEmail(c.email ?? "");
    setPhone(c.phone ?? "");
    setLocation(c.location ?? "");
    setContacts([]);
    setShowContactDropdown(false);
  }

  // Listing search debounce
  function handleListingSearch(val: string) {
    setListingSearch(val);
    setSelectedListing(null);
    if (listingTimer.current) clearTimeout(listingTimer.current);
    if (!val.trim()) { setListings([]); return; }
    listingTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/dashboard/listings?search=${encodeURIComponent(val)}&limit=5`);
        const j = await r.json();
        setListings(j.listings ?? []);
        setShowListingDropdown(true);
      } catch {}
    }, 300);
  }

  function selectListing(l: Listing) {
    setSelectedListing(l);
    setListingSearch(`${l.listingId} – ${l.title}`);
    setListings([]);
    setShowListingDropdown(false);
  }

  // Suggest temperature when score changes (unless manually set)
  function handleScoreChange(val: number) {
    setScore(val);
    if (!tempManual) setTemperature(suggestTemperature(val));
  }

  function handleTemperatureChange(val: LeadTemperature) {
    setTemperature(val);
    setTempManual(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Name is required"); return; }
    if (!email && !phone) { setError("Provide at least an email or phone number"); return; }

    try {
      await create.mutateAsync({
        contactId: selectedContact?.id,
        submittedName: name.trim(),
        submittedEmail: email.trim() || undefined,
        submittedPhone: phone.trim() || undefined,
        submittedLocation: location.trim() || undefined,
        source,
        sourceDetail: sourceDetail.trim() || undefined,
        primaryListingId: selectedListing?.id,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        currency,
        score,
        temperature,
        lifecycleStatus,
        assignedAgentId: assignedAgentId || undefined,
        notes: notes.trim() || undefined,
      });
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[16px] w-full max-w-[720px] max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e5e7eb] sticky top-0 bg-white z-10">
          <p className="text-[16px] font-semibold text-[#0d2138]" style={mont}>Add New Lead</p>
          <button type="button" onClick={onClose} className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
          {/* ── Section 1: Contact ── */}
          <p className="text-[13px] font-semibold text-[#1e4f86] uppercase tracking-wide" style={mont}>Contact</p>

          {/* Contact search */}
          <div className="flex flex-col gap-1.5 relative">
            <label className={labelCls} style={mont}>Search Existing Contact</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a7282]" />
              <input
                value={contactSearch}
                onChange={(e) => handleContactSearch(e.target.value)}
                onFocus={() => contacts.length > 0 && setShowContactDropdown(true)}
                placeholder="Name, email or phone…"
                className="h-10 w-full pl-9 pr-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
                style={mont}
              />
            </div>
            {showContactDropdown && contacts.length > 0 && (
              <div className="absolute top-[72px] left-0 right-0 z-20 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg overflow-hidden">
                {contacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectContact(c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#f3f4f6] border-b border-[#f3f4f6] last:border-b-0"
                  >
                    <p className="text-[13px] font-medium text-[#0d2138]" style={mont}>{c.firstName} {c.lastName}</p>
                    <p className="text-[11px] text-[#6a7282]" style={mont}>{c.email ?? ""} {c.phone ?? ""}</p>
                  </button>
                ))}
              </div>
            )}
            {selectedContact && (
              <p className="text-[11px] text-[#059669]" style={mont}>Linked to existing contact: {selectedContact.contactId}</p>
            )}
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={mont}>Full Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              className={inputCls}
              style={mont}
            />
          </div>

          {/* Email / Phone */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={mont}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className={inputCls}
                style={mont}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={mont}>Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 5555-0000"
                className={inputCls}
                style={mont}
              />
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={mont}>Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or region"
              className={inputCls}
              style={mont}
            />
          </div>

          {/* ── Section 2: Lead Details ── */}
          <p className="text-[13px] font-semibold text-[#1e4f86] uppercase tracking-wide mt-1" style={mont}>Lead Details</p>

          {/* Source / Source detail */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={mont}>Lead Source *</label>
              <div className="relative">
                <select required value={source} onChange={(e) => setSource(e.target.value as LeadSource)} className={selectCls} style={mont}>
                  {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={mont}>Source Detail</label>
              <input
                value={sourceDetail}
                onChange={(e) => setSourceDetail(e.target.value)}
                placeholder="e.g. Zonaprop, Instagram…"
                className={inputCls}
                style={mont}
              />
            </div>
          </div>

          {/* Property interest */}
          <div className="flex flex-col gap-1.5 relative">
            <label className={labelCls} style={mont}>Interested Property</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6a7282]" />
              <input
                value={listingSearch}
                onChange={(e) => handleListingSearch(e.target.value)}
                onFocus={() => listings.length > 0 && setShowListingDropdown(true)}
                placeholder="Search by listing ID or title…"
                className="h-10 w-full pl-9 pr-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
                style={mont}
              />
            </div>
            {showListingDropdown && listings.length > 0 && (
              <div className="absolute top-[72px] left-0 right-0 z-20 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg overflow-hidden">
                {listings.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => selectListing(l)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#f3f4f6] border-b border-[#f3f4f6] last:border-b-0"
                  >
                    <p className="text-[13px] font-medium text-[#0d2138]" style={mont}>{l.listingId} — {l.title}</p>
                    <p className="text-[11px] text-[#6a7282]" style={mont}>{l.location}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Budget */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={mont}>Budget Range</label>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6a7282]" style={mont}>Min</span>
                <input
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  className="h-10 w-full pl-9 pr-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
                  style={mont}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[#6a7282]" style={mont}>Max</span>
                <input
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  className="h-10 w-full pl-9 pr-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
                  style={mont}
                />
              </div>
              <div className="relative">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectCls} style={mont}>
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Lead score */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className={labelCls} style={mont}>Lead Score</label>
              <span className="text-[12px] font-semibold text-[#1e4f86]" style={mont}>{score}/100</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={score}
              onChange={(e) => handleScoreChange(Number(e.target.value))}
              className="w-full h-1.5 appearance-none rounded-full cursor-pointer accent-[#1e4f86]"
              style={{ background: `linear-gradient(to right, #1e4f86 ${score}%, #e5e7eb ${score}%)` }}
            />
            <div className="flex items-center justify-between text-[11px] text-[#6a7282]" style={mont}>
              <span>Cold (0)</span>
              <span>Warm (40)</span>
              <span>Hot (70+)</span>
            </div>
          </div>

          {/* Temperature / Status */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={mont}>Temperature</label>
              <div className="relative">
                <select value={temperature} onChange={(e) => handleTemperatureChange(e.target.value as LeadTemperature)} className={selectCls} style={mont}>
                  {TEMP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
              {!tempManual && <p className="text-[11px] text-[#6a7282]" style={mont}>Suggested from score</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} style={mont}>Lifecycle Status</label>
              <div className="relative">
                <select value={lifecycleStatus} onChange={(e) => setLifecycle(e.target.value as LeadLifecycleStatus)} className={selectCls} style={mont}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Assigned Agent */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={mont}>Assigned Agent</label>
            <div className="relative">
              <select value={assignedAgentId} onChange={(e) => setAgentId(e.target.value)} className={selectCls} style={mont}>
                <option value="">— Unassigned —</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.fullName ?? a.email}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} style={mont}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Initial notes about this lead…"
              rows={3}
              maxLength={5000}
              className="px-3.5 py-2.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors resize-none"
              style={mont}
            />
          </div>

          {error && (
            <p className="text-[12px] text-[#dc2626] bg-[#fee2e2] rounded-[8px] px-3 py-2" style={mont}>{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
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
              disabled={create.isPending}
              className="flex-1 h-[41.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              style={mont}
            >
              {create.isPending && <Loader2 size={14} className="animate-spin" />}
              {create.isPending ? "Creating…" : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
