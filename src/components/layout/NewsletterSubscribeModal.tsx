"use client";

import { useState } from "react";
import { X, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const inputCls =
  "h-11 px-4 border border-[#d1d5db] rounded-[10px] text-[13px] text-[#0d2138] placeholder:text-[#9ca3af] outline-none focus:border-[#1e4f86] transition-colors w-full bg-white";

type Props = {
  initialEmail?: string;
  onClose: () => void;
};

export function NewsletterSubscribeModal({ initialEmail = "", onClose }: Props) {
  const { t } = useTranslation("footer");

  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(t("subscribeModal.nameRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError(t("subscribeModal.emailRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          location: location.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || t("subscribeModal.errorGeneric"));
      }
      setSuccess(true);
    } catch {
      setError(t("subscribeModal.errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

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
            <h2 className="text-[18px] font-bold text-white" style={mont}>
              {t("subscribeModal.title")}
            </h2>
            <button aria-label="Cerrar suscripción" onClick={onClose} className="p-1.5 rounded-[8px] bg-white/10 hover:bg-white/20 transition-colors">
              <X size={16} color="white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle2 size={48} color="#059669" />
              <p className="text-[14px] text-[#374151]" style={mont}>{t("subscribeModal.success")}</p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-[#0d2138] text-white rounded-[10px] text-[13px] font-semibold hover:bg-[#1a3a5c] transition-colors"
                style={mont}
              >
                {t("subscribeModal.submit")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-[13px] text-[#6b7280]" style={mont}>{t("subscribeModal.subtitle")}</p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#374151]" style={mont}>{t("subscribeModal.nameLabel")}</label>
                <input
                  className={inputCls}
                  style={mont}
                  placeholder={t("subscribeModal.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#374151]" style={mont}>{t("subscribeModal.emailLabel")}</label>
                <input
                  type="email"
                  className={inputCls}
                  style={mont}
                  placeholder={t("subscribeModal.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#374151]" style={mont}>{t("subscribeModal.phoneLabel")}</label>
                  <input
                    className={inputCls}
                    style={mont}
                    placeholder={t("subscribeModal.phonePlaceholder")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#374151]" style={mont}>{t("subscribeModal.locationLabel")}</label>
                  <input
                    className={inputCls}
                    style={mont}
                    placeholder={t("subscribeModal.locationPlaceholder")}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="text-[12px] text-red-500" style={mont}>{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-[10px] text-white text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-opacity mt-1"
                style={{
                  background: "linear-gradient(to bottom, #005ea4, #006fc2)",
                  border: "1px solid #0088ff",
                  fontFamily: poppins.fontFamily,
                }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {submitting ? t("subscribeModal.submitting") : t("subscribeModal.submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
