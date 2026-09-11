"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Search, Loader2, Calendar as CalendarIcon, Clock } from "lucide-react";

import type { Role } from "@/lib/permissions";
import { useCreateTourMutation } from "@/hooks/mutations/useTourMutations";
import { CalendarPanel } from "./CalendarPanel";
import { TimePanel } from "./TimePanel";
import { SearchableSelect } from "./SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const inputCls =
  "h-10 px-3.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors w-full";
const labelCls = "text-[12px] font-medium text-[#1f2937]";

type Agent = { id: string; fullName: string | null; email: string };
type Listing = { id: string; listingId: string; title: string; location: string };

type InitialValues = {
  name?: string;
  email?: string;
  phone?: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyListingId?: string;
  propertyLocation?: string;
  agentId?: string;
};

type Props = {
  role: Role;
  onClose: () => void;
  onCreated: (id: string) => void;
  leadId?: string;
  initialValues?: InitialValues;
};

// Default scheduling: now + 1 hour
function defaultSchedule() {
  return new Date(Date.now() + 60 * 60 * 1000);
}

function timeString(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const TIME_FMT = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

function formatTimeLabel(time: string) {
  const [h, m] = time.split(":").map(Number);
  return TIME_FMT.format(new Date(2000, 0, 1, h || 0, m || 0));
}

export function AddTourModal({ onClose, onCreated, leadId, initialValues }: Props) {
  const { t } = useTranslation("leads");
  const create = useCreateTourMutation();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [message, setMessage] = useState("");
  const initialSchedule = defaultSchedule();
  const [scheduledDate, setScheduledDate] = useState<Date>(initialSchedule);
  const [scheduledTime, setScheduledTime] = useState(timeString(initialSchedule));
  const [openPanel, setOpenPanel] = useState<"date" | "time" | null>(null);
  const calRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(60);
  const [agentId, setAgentId] = useState(initialValues?.agentId ?? "");
  const [listingSearch, setListingSearch] = useState("");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(
    initialValues?.propertyId
      ? {
          id: initialValues.propertyId,
          listingId: initialValues.propertyListingId ?? "",
          title: initialValues.propertyTitle ?? "",
          location: initialValues.propertyLocation ?? "",
        }
      : null,
  );
  const [listings, setListings] = useState<Listing[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState("");

  // Load agents once
  useEffect(() => {
    fetch("/api/dashboard/agents?limit=100&status=ACTIVE")
      .then((r) => r.json())
      .then((j) => setAgents(j.agents ?? []))
      .catch(() => {});
  }, []);

  // Search listings
  useEffect(() => {
    if (!listingSearch.trim()) {
      // Clearing stale results before the debounced fetch below runs, not deriving state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setListings([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/dashboard/listings?search=${encodeURIComponent(listingSearch)}&limit=6`)
        .then((r) => r.json())
        .then((j) => setListings(j.listings ?? []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [listingSearch]);

  // Close the date/time popover on outside click
  useEffect(() => {
    if (!openPanel) return;
    const onDown = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setOpenPanel(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openPanel]);

  // Combine the picked date with the time field into a single Date
  function buildScheduledAt(): Date {
    const [h, m] = scheduledTime.split(":").map(Number);
    const d = new Date(scheduledDate);
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError(t("addTourModal.errors.nameRequired")); return; }
    if (!scheduledTime) { setError(t("addTourModal.errors.timeRequired")); return; }
    const scheduledAt = buildScheduledAt();
    if (scheduledAt <= new Date()) { setError(t("addTourModal.errors.futureDateRequired")); return; }

    try {
      const result = await create.mutateAsync({
        submittedName: name.trim(),
        submittedEmail: email.trim() || undefined,
        submittedPhone: phone.trim() || undefined,
        submittedMessage: message.trim() || undefined,
        propertyId: selectedListing?.id,
        leadId,
        assignedAgentId: agentId || undefined,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: duration,
        source: "DASHBOARD_CREATED",
      });
      onCreated(result.id);
    } catch (err) {
      setError((err as Error).message ?? t("addTourModal.errors.createFailed"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[16px] shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f3f4f6]">
          <h2 className="text-[16px] font-bold text-[#0d2138]" style={mont}>{t("addTourModal.title")}</h2>
          <button onClick={onClose} className="p-1.5 rounded-[6px] hover:bg-[#f3f4f6] transition-colors">
            <X size={16} color="#6b7280" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {/* Visitor info */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={mont}>{t("addTourModal.fullName")}</label>
            <input className={inputCls} style={mont} placeholder={t("addTourModal.fullNamePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={mont}>{t("addTourModal.email")}</label>
              <input className={inputCls} style={mont} type="email" placeholder={t("addTourModal.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls} style={mont}>{t("addTourModal.phone")}</label>
              <input className={inputCls} style={mont} placeholder={t("addTourModal.phonePlaceholder")} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          {/* Scheduling */}
          <div ref={calRef}>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelCls} style={mont}>{t("addTourModal.date")}</label>
                <button
                  type="button"
                  onClick={() => setOpenPanel((p) => (p === "date" ? null : "date"))}
                  className={`${inputCls} flex items-center justify-between gap-2 bg-white text-left ${openPanel === "date" ? "border-[#1e4f86]" : ""}`}
                  style={mont}
                >
                  <span className="truncate">{DATE_FMT.format(scheduledDate)}</span>
                  <CalendarIcon size={14} color="#6a7282" className="shrink-0" />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls} style={mont}>{t("addTourModal.time")}</label>
                <button
                  type="button"
                  onClick={() => setOpenPanel((p) => (p === "time" ? null : "time"))}
                  className={`${inputCls} flex items-center justify-between gap-2 bg-white text-left ${openPanel === "time" ? "border-[#1e4f86]" : ""}`}
                  style={mont}
                >
                  <span className="truncate">{formatTimeLabel(scheduledTime)}</span>
                  <Clock size={14} color="#6a7282" className="shrink-0" />
                </button>
              </div>
            </div>
            {openPanel === "date" && (
              <CalendarPanel
                inline
                value={scheduledDate}
                minDate={new Date()}
                onSelect={(d) => { setScheduledDate(d); setOpenPanel(null); }}
                onClose={() => setOpenPanel(null)}
              />
            )}
            {openPanel === "time" && (
              <TimePanel
                inline
                value={scheduledTime}
                onSelect={setScheduledTime}
                onClose={() => setOpenPanel(null)}
              />
            )}
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={mont}>{t("addTourModal.duration")}</label>
            <SearchableSelect
              size="sm"
              searchable={false}
              value={String(duration)}
              onChange={(next) => setDuration(Number(next))}
              options={[30, 45, 60, 90, 120].map((m) => ({ value: String(m), label: t("addTourModal.minutesLabel", { count: m }) }))}
              placeholder={t("addTourModal.selectDuration")}
              ariaLabel={t("addTourModal.duration")}
            />
          </div>

          {/* Listing search */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={mont}>{t("addTourModal.property")}</label>
            {selectedListing ? (
              <div className="flex items-center gap-2 border border-[#e5e7eb] rounded-[10px] px-3 h-10">
                <p className="flex-1 text-[12px] text-[#0d2138]" style={mont}>{selectedListing.title} · {selectedListing.listingId}</p>
                <button type="button" onClick={() => { setSelectedListing(null); setListingSearch(""); }}>
                  <X size={13} color="#9ca3af" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 border border-[#e5e7eb] rounded-[10px] px-3 h-10">
                  <Search size={13} color="#9ca3af" />
                  <input
                    type="text"
                    placeholder={t("addTourModal.listingSearchPlaceholder")}
                    className="flex-1 outline-none text-[12px] text-[#0d2138] bg-transparent placeholder:text-[#9ca3af]"
                    style={mont}
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                  />
                </div>
                {listings.length > 0 && (
                  <div className="mobi-dropdown-menu absolute top-full left-0 right-0 z-10 bg-white border border-[#e5e7eb] rounded-[10px] shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {listings.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => { setSelectedListing(l); setListingSearch(""); setListings([]); }}
                        className="w-full text-left px-3 py-2 hover:bg-[#f9fafb] text-[12px] text-[#0d2138]"
                        style={mont}
                      >
                        <span className="font-medium">{l.title}</span>
                        <span className="text-[#9ca3af]"> · {l.listingId} · {l.location}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Agent */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={mont}>{t("addTourModal.assignAgent")}</label>
            <SearchableSelect
              size="sm"
              value={agentId}
              onChange={setAgentId}
              options={agents.map((a) => ({ value: a.id, label: a.fullName ?? a.email }))}
              placeholder={t("addTourModal.noAgent")}
              searchPlaceholder={t("addTourModal.searchAgentsPlaceholder")}
              emptyLabel={t("addTourModal.noAgentsFound")}
              ariaLabel={t("addTourModal.assignAgent")}
            />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1">
            <label className={labelCls} style={mont}>{t("addTourModal.visitorMessage")}</label>
            <textarea
              className="px-3.5 py-2.5 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] resize-none"
              style={mont}
              placeholder={t("addTourModal.visitorMessagePlaceholder")}
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {error && <p className="text-[12px] text-red-500" style={mont}>{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-[10px] border border-[#e5e7eb] text-[13px] text-[#374151] hover:bg-[#f3f4f6] transition-colors"
              style={mont}
            >
              {t("addTourModal.cancel")}
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="h-10 px-4 rounded-[10px] bg-[#0d2138] text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-[#1a3a5c] disabled:opacity-40 transition-colors"
              style={mont}
            >
              {create.isPending && <Loader2 size={13} className="animate-spin" />}
              {t("addTourModal.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
