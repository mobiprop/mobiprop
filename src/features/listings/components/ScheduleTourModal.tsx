"use client";

import { useState, useEffect, useRef } from "react";
import { X, Calendar, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useRequestTourMutation, TourConflictError } from "@/hooks/mutations/useTourMutations";
import { CalendarPanel } from "@/features/dashboard/components/CalendarPanel";
import { TimePanel } from "@/features/dashboard/components/TimePanel";
import { SearchableSelect } from "@/features/dashboard/components/SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const inputCls =
  "h-12 px-4 border border-[#ccdeef] rounded-xl text-sm text-[#232323] placeholder:text-[#6c6c6c] outline-none focus:border-[#005089] focus:ring-2 focus:ring-[#005089]/15 transition-colors w-full bg-white";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previous; };
  }, []);

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
      setError(err instanceof TourConflictError
        ? "Ese horario no está disponible. Elegí otro horario para la visita."
        : t("tourModal.errors.generic"));
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
    <dialog ref={dialogRef} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="tour-title" className="fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-[560px] overflow-y-auto rounded-3xl border border-[#e9e9e9] bg-white p-0 text-[#232323] shadow-2xl backdrop:bg-[#00223a]/50 backdrop:backdrop-blur-sm">
      <div className="relative w-full">
        {/* Header */}
        <div
          className="border-b border-[#e9e9e9] bg-[#f0f6fa] px-6 py-6 sm:px-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl border border-[#ccdeef] bg-white text-[#005089]"><Calendar size={22} strokeWidth={1.5} /></span>
              <h2 id="tour-title" className="text-2xl font-medium text-[#00223a]" style={poppins}>{t("tourModal.title")}</h2>
              {propertyTitle && (
                <p className="text-sm text-[#4f4f4f] mt-2 max-w-[400px]" style={mont}>{propertyTitle}</p>
              )}
            </div>
            <button type="button" aria-label="Cerrar" onClick={onClose} className="flex size-10 shrink-0 self-start items-center justify-center rounded-full border border-[#ccdeef] bg-white text-[#005089] hover:bg-[#e1edf5] transition-colors">
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 sm:px-8">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <span className="flex size-20 items-center justify-center rounded-full border border-[#ccdeef] bg-[#f0f6fa] text-[#005089]"><CheckCircle2 size={40} strokeWidth={1.5} /></span>
              <div>
                <p className="text-[16px] font-bold text-[#00223a]" style={mont}>{t("tourModal.success.heading")}</p>
                <p className="text-sm text-[#6b7280] mt-1" style={mont}>
                  {t("tourModal.success.reference")} <span className="font-semibold text-[#00223a]">{success.tourNumber}</span>
                </p>
                <p className="text-sm text-[#6b7280] mt-0.5" style={mont}>
                  {DATE_FMT.format(new Date(success.scheduledAt))} · {TIME_FMT.format(new Date(success.scheduledAt))}
                </p>
              </div>
              <p className="text-sm text-[#6c6c6c]" style={mont}>
                {t("tourModal.success.confirmNote")}
              </p>
              <button
                onClick={onClose}
                className="home-button mt-2 w-full"
                style={mont}
              >
                {t("tourModal.success.done")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tour-name" className="text-sm font-medium text-[#232323]" style={mont}>{t("tourModal.form.fullNameLabel")}</label>
                <input
                  className={inputCls}
                  style={mont}
                  placeholder={t("tourModal.form.fullNamePlaceholder")}
                  id="tour-name" autoComplete="name" value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tour-email" className="text-sm font-medium text-[#232323]" style={mont}>{t("tourModal.form.emailLabel")}</label>
                  <input
                    className={inputCls}
                    style={mont}
                    type="email"
                    placeholder={t("tourModal.form.emailPlaceholder")}
                    id="tour-email" autoComplete="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="tour-phone" className="text-sm font-medium text-[#232323]" style={mont}>{t("tourModal.form.phoneLabel")}</label>
                  <input
                    className={inputCls}
                    style={mont}
                    placeholder={t("tourModal.form.phonePlaceholder")}
                    id="tour-phone" type="tel" autoComplete="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Preferred date + time */}
              <div ref={calRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="relative flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#232323]" style={mont}>{t("tourModal.form.preferredDateLabel")}</label>
                  <button
                    type="button"
                    onClick={() => setOpenPanel((p) => (p === "date" ? null : "date"))}
                    className={`${inputCls} flex items-center justify-between gap-2 text-left ${openPanel === "date" ? "border-[#1e4f86]" : ""}`}
                    style={mont}
                  >
                    <span className="truncate">{DATE_FMT.format(scheduledDate)}</span>
                    <Calendar size={15} color="#005089" strokeWidth={1.5} className="shrink-0" />
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
                  <label className="text-sm font-medium text-[#232323]" style={mont}>{t("tourModal.form.timeLabel")}</label>
                  <button
                    type="button"
                    onClick={() => setOpenPanel((p) => (p === "time" ? null : "time"))}
                    className={`${inputCls} flex items-center justify-between gap-2 text-left ${openPanel === "time" ? "border-[#1e4f86]" : ""}`}
                    style={mont}
                  >
                    <span className="truncate">{formatTimeLabel(scheduledTime)}</span>
                    <Clock size={15} color="#005089" strokeWidth={1.5} className="shrink-0" />
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
                <label className="text-sm font-medium text-[#232323]" style={mont}>{t("tourModal.form.durationLabel")}</label>
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
                <label htmlFor="tour-message" className="text-sm font-medium text-[#232323]" style={mont}>{t("tourModal.form.messageLabel")}</label>
                <textarea
                  className={`${inputCls} h-auto py-3 resize-none`}
                  style={mont}
                  placeholder={t("tourModal.form.messagePlaceholder")}
                  rows={3}
                  id="tour-message" value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" style={mont}>{error}</p>
              )}

              {suggestedSlots.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-[#232323]" style={mont}>
                    {t("tourModal.form.availableTimesInstead")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSlots.map((iso) => (
                      <button
                        key={iso}
                        type="button"
                        disabled={mutation.isPending}
                        onClick={() => handlePickSuggestedSlot(iso)}
                        className="rounded-[8px] border border-[#1e4f86] px-3 py-1.5 text-sm font-medium text-[#1e4f86] transition-colors hover:bg-[#eff6ff] disabled:opacity-40"
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
                className="home-button w-full min-h-12 flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                style={{
                  background: "linear-gradient(to bottom, #005ea4, #006fc2)",
                  border: "1px solid #0088ff",
                  fontFamily: poppins.fontFamily,
                }}
              >
                {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={18} strokeWidth={1.5} />}
                {t("tourModal.form.submitButton")}
              </button>

              <p className="text-xs text-[#6c6c6c] text-center" style={mont}>
                {t("tourModal.form.disclaimer")}
              </p>
            </form>
          )}
        </div>
      </div>
    </dialog>
  );
}
