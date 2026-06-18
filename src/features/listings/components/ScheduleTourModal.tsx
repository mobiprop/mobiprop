"use client";

import { useState } from "react";
import { X, Calendar, Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

import { useRequestTourMutation } from "@/hooks/mutations/useTourMutations";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const inputCls =
  "h-11 px-4 border border-[#d1d5db] rounded-[10px] text-[13px] text-[#0d2138] placeholder:text-[#9ca3af] outline-none focus:border-[#1e4f86] transition-colors w-full bg-white";

function minDatetimeLocal() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

type Props = {
  propertyId?: string;
  propertyTitle?: string;
  onClose: () => void;
};

export function ScheduleTourModal({ propertyId, propertyTitle, onClose }: Props) {
  const mutation = useRequestTourMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState(minDatetimeLocal());
  const [duration, setDuration] = useState(60);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ tourNumber: string; scheduledAt: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Your name is required."); return; }
    if (!email.trim() && !phone.trim()) { setError("Please provide at least an email or phone number."); return; }
    if (!scheduledAt) { setError("Please choose a date and time."); return; }
    if (new Date(scheduledAt) <= new Date()) { setError("Please choose a future date and time."); return; }

    try {
      const result = await mutation.mutateAsync({
        submittedName: name.trim(),
        submittedEmail: email.trim() || undefined,
        submittedPhone: phone.trim() || undefined,
        submittedMessage: message.trim() || undefined,
        propertyId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: duration,
      });
      setSuccess({ tourNumber: result.tourNumber, scheduledAt: result.scheduledAt });
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4"
          style={{ background: "linear-gradient(135deg, #0d2138 0%, #1e4f86 100%)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-white" style={mont}>Schedule a Visit</h2>
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
                <p className="text-[16px] font-bold text-[#0d2138]" style={mont}>Tour Requested!</p>
                <p className="text-[13px] text-[#6b7280] mt-1" style={mont}>
                  Reference: <span className="font-semibold text-[#0d2138]">{success.tourNumber}</span>
                </p>
                <p className="text-[13px] text-[#6b7280] mt-0.5" style={mont}>
                  {format(new Date(success.scheduledAt), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <p className="text-[12px] text-[#9ca3af]" style={mont}>
                Our team will confirm your appointment shortly.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-[#0d2138] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[#1a3a5c] transition-colors"
                style={mont}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#374151]" style={mont}>Full Name *</label>
                <input
                  className={inputCls}
                  style={mont}
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#374151]" style={mont}>Email</label>
                  <input
                    className={inputCls}
                    style={mont}
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#374151]" style={mont}>Phone</label>
                  <input
                    className={inputCls}
                    style={mont}
                    placeholder="+54 9..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Date + Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#374151]" style={mont}>Preferred Date & Time *</label>
                  <input
                    type="datetime-local"
                    className={inputCls}
                    style={mont}
                    value={scheduledAt}
                    min={minDatetimeLocal()}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#374151]" style={mont}>Duration</label>
                  <select
                    className="h-11 px-3 border border-[#d1d5db] rounded-[10px] text-[13px] text-[#0d2138] bg-white outline-none focus:border-[#1e4f86] cursor-pointer"
                    style={mont}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#374151]" style={mont}>Message (optional)</label>
                <textarea
                  className="px-4 py-2.5 border border-[#d1d5db] rounded-[10px] text-[13px] text-[#0d2138] placeholder:text-[#9ca3af] outline-none focus:border-[#1e4f86] resize-none"
                  style={mont}
                  placeholder="Any questions or special requests…"
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-[12px] text-red-500" style={mont}>{error}</p>
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
                Request Tour
              </button>

              <p className="text-[11px] text-[#9ca3af] text-center" style={mont}>
                No commitment needed. Our agent will confirm your appointment.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
