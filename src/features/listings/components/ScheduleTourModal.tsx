"use client";

import { useState, useEffect, useRef } from "react";
import { X, Calendar, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { useRequestTourMutation, TourConflictError } from "@/hooks/mutations/useTourMutations";
import { CalendarPanel } from "@/features/dashboard/components/CalendarPanel";
import { TimePanel } from "@/features/dashboard/components/TimePanel";
import { SearchableSelect } from "@/features/dashboard/components/SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const inputCls =
  "h-11 px-4 border border-[#d1d5db] rounded-[10px] text-[13px] text-[#0d2138] placeholder:text-[#9ca3af] outline-none focus:border-[#1e4f86] transition-colors w-full bg-white";

function defaultSchedule() {
  return new Date(Date.now() + 60 * 60 * 1000);
}

function timeString(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const DATE_FMT = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const TIME_FMT = new Intl.DateTimeFormat("es-AR", { hour: "numeric", minute: "2-digit" });

const SLOT_FMT = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatTimeLabel(time: string) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(2000, 0, 1, h || 0, m || 0);
  return TIME_FMT.format(d);
}

type Props = {
  propertyId?: string;
  propertyTitle?: string;
  onClose: () => void;
};

export function ScheduleTourModal({ propertyId, propertyTitle, onClose }: Props) {
  const { t } = useTranslation("listingDetail");
  const mutation = useRequestTourMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const initialSchedule = defaultSchedule();
  const [scheduledDate, setScheduledDate] = useState<Date>(initialSchedule);
  const [scheduledTime, setScheduledTime] = useState(timeString(initialSchedule));
  const [openPanel, setOpenPanel] = useState<"date" | "time" | null>(null);
  const calRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(60);
  const [error, setError] = useState("");
  const [suggestedSlots, setSuggestedSlots] = useState<string[]>([]);
  const [success, setSuccess] = useState<{ tourNumber: string; scheduledAt: string } | null>(null);

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

  async function submitTour(scheduledAt: Date) {
    setError("");
    setSuggestedSlots([]);

    try {
      const result = await mutation.mutateAsync({
        submittedName: name.trim(),
        submittedEmail: email.trim() || undefined,
        submittedPhone: phone.trim() || undefined,
        submittedMessage: message.trim() || undefined,
        propertyId,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: duration,
      });
      setSuccess({ tourNumber: result.tourNumber, scheduledAt: result.scheduledAt });
    } catch (err) {
      if (err instanceof TourConflictError) {
        setSuggestedSlots(err.suggestedSlots);
      }
      setError((err as Error).message || t("tourModal.errors.generic"));
    }
  }

  function handlePickSuggestedSlot(iso: string) {
    const d = new Date(iso);
    setScheduledDate(d);
    setScheduledTime(timeString(d));
    void submitTour(d);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError(t("tourModal.errors.nameRequired")); return; }
    if (!email.trim() && !phone.trim()) { setError(t("tourModal.errors.contactRequired")); return; }
    if (!scheduledTime) { setError(t("tourModal.errors.timeRequired")); return; }
    const scheduledAt = buildScheduledAt();
    if (scheduledAt <= new Date()) { setError(t("tourModal.errors.futureDateRequired")); return; }

    await submitTour(scheduledAt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-md">
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4 rounded-t-[20px] overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0d2138 0%, #1e4f86 100%)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-white" style={mont}>{t("tourModal.title")}</h2>
              {propertyTitle && (
                <p className="text-[12px] text-[#93c5fd] mt-0.5 truncate max-w-[300px]" style={mont}>{propertyTitle}</p>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-[8px] bg-white/10 hover:bg-white/20 transition-colors">
              <X size={16} color="white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 size={48} color="#059669" />
              <div>
                <p className="text-[16px] font-bold text-[#0d2138]" style={mont}>{t("tourModal.success.heading")}</p>
                <p className="text-[13px] text-[#6b7280] mt-1" style={mont}>
                  {t("tourModal.success.reference")} <span className="font-semibold text-[#0d2138]">{success.tourNumber}</span>
                </p>
                <p className="text-[13px] text-[#6b7280] mt-0.5" style={mont}>
                  {format(new Date(success.scheduledAt), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <p className="text-[12px] text-[#9ca3af]" style={mont}>
                {t("tourModal.success.confirmNote")}
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-[#0d2138] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[#1a3a5c] transition-colors"
                style={mont}
              >
                {t("tourModal.success.done")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#374151]" style={mont}>{t("tourModal.form.fullNameLabel")}</label>
                <input
                  className={inputCls}
                  style={mont}
                  placeholder={t("tourModal.form.fullNamePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#374151]" style={mont}>{t("tourModal.form.emailLabel")}</label>
                  <input
                    className={inputCls}
                    style={mont}
                    type="email"
                    placeholder={t("tourModal.form.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#374151]" style={mont}>{t("tourModal.form.phoneLabel")}</label>
                  <input
                    className={inputCls}
                    style={mont}
                    placeholder={t("tourModal.form.phonePlaceholder")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Preferred date + time */}
              <div ref={calRef} className="grid grid-cols-2 gap-3">
                <div className="relative flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#374151]" style={mont}>{t("tourModal.form.preferredDateLabel")}</label>
                  <button
                    type="button"
                    onClick={() => setOpenPanel((p) => (p === "date" ? null : "date"))}
                    className={`${inputCls} flex items-center justify-between gap-2 text-left ${openPanel === "date" ? "border-[#1e4f86]" : ""}`}
                    style={mont}
                  >
                    <span className="truncate">{DATE_FMT.format(scheduledDate)}</span>
                    <Calendar size={15} color="#6a7282" className="shrink-0" />
                  </button>
                  {openPanel === "date" && (
                    <CalendarPanel
                      align="left"
                      value={scheduledDate}
                      minDate={new Date()}
                      onSelect={(d) => { setScheduledDate(d); setOpenPanel(null); }}
                      onClose={() => setOpenPanel(null)}
                    />
                  )}
                </div>
                <div className="relative flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#374151]" style={mont}>{t("tourModal.form.timeLabel")}</label>
                  <button
                    type="button"
                    onClick={() => setOpenPanel((p) => (p === "time" ? null : "time"))}
                    className={`${inputCls} flex items-center justify-between gap-2 text-left ${openPanel === "time" ? "border-[#1e4f86]" : ""}`}
                    style={mont}
                  >
                    <span className="truncate">{formatTimeLabel(scheduledTime)}</span>
                    <Clock size={15} color="#6a7282" className="shrink-0" />
                  </button>
                  {openPanel === "time" && (
                    <TimePanel
                      align="right"
                      value={scheduledTime}
                      onSelect={setScheduledTime}
                      onClose={() => setOpenPanel(null)}
                    />
                  )}
                </div>
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#374151]" style={mont}>{t("tourModal.form.durationLabel")}</label>
                <SearchableSelect
                  searchable={false}
                  value={String(duration)}
                  onChange={(v) => setDuration(Number(v))}
                  placeholder={t("tourModal.form.durationLabel")}
                  options={[
                    { value: "30", label: t("tourModal.form.duration30") },
                    { value: "45", label: t("tourModal.form.duration45") },
                    { value: "60", label: t("tourModal.form.duration60") },
                    { value: "90", label: t("tourModal.form.duration90") },
                    { value: "120", label: t("tourModal.form.duration120") },
                  ]}
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#374151]" style={mont}>{t("tourModal.form.messageLabel")}</label>
                <textarea
                  className="px-4 py-2.5 border border-[#d1d5db] rounded-[10px] text-[13px] text-[#0d2138] placeholder:text-[#9ca3af] outline-none focus:border-[#1e4f86] resize-none"
                  style={mont}
                  placeholder={t("tourModal.form.messagePlaceholder")}
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-[12px] text-red-500" style={mont}>{error}</p>
              )}

              {suggestedSlots.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[12px] font-semibold text-[#374151]" style={mont}>
                    {t("tourModal.form.availableTimesInstead")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSlots.map((iso) => (
                      <button
                        key={iso}
                        type="button"
                        disabled={mutation.isPending}
                        onClick={() => handlePickSuggestedSlot(iso)}
                        className="rounded-[8px] border border-[#1e4f86] px-3 py-1.5 text-[12px] font-medium text-[#1e4f86] transition-colors hover:bg-[#eff6ff] disabled:opacity-40"
                        style={mont}
                      >
                        {SLOT_FMT.format(new Date(iso))}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full h-11 rounded-[10px] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-opacity mt-1"
                style={{
                  background: "linear-gradient(to bottom, #005ea4, #006fc2)",
                  border: "1px solid #0088ff",
                  fontFamily: poppins.fontFamily,
                }}
              >
                {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
                {t("tourModal.form.submitButton")}
              </button>

              <p className="text-[11px] text-[#9ca3af] text-center" style={mont}>
                {t("tourModal.form.disclaimer")}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
