"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  Clock,
  Globe,
  KeyRound,
  Languages,
  Lock,
  Mail,
  MapPin,
  Monitor,
  ShieldCheck,
  Smartphone,
  Upload,
  User,
  X,
} from "lucide-react";

import {
  changePassword,
  logoutOtherSessions,
  updateLocalePreferences,
  updateNotificationPreferences,
  updateProfile,
  updateSecurityPreferences,
} from "./actions";
import {
  DEFAULT_PREFERENCES,
  resolvePreferences,
  type LocalePreferences,
  type NotificationPreferences,
  type SecurityPreferences,
} from "./preferences";
import type { Profile } from "@/generated/prisma/client";

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_DESCRIPTION_LENGTH = 250;

const COUNTRIES = [
  "Argentina",
  "Brazil",
  "Canada",
  "Chile",
  "Mexico",
  "Paraguay",
  "Spain",
  "United Kingdom",
  "United States",
  "Uruguay",
];

const TIMEZONES: { value: string; label: string }[] = [
  { value: "America/Los_Angeles", label: "Pacific Standard Time (PST) - UTC-8" },
  { value: "America/Denver", label: "Mountain Time (MT) - UTC-7" },
  { value: "America/Chicago", label: "Central Time (CT) - UTC-6" },
  { value: "America/New_York", label: "Eastern Time (ET) - UTC-5" },
  { value: "America/Argentina/Buenos_Aires", label: "Argentina Time (ART) - UTC-3" },
  { value: "America/Montevideo", label: "Uruguay Time (UYT) - UTC-3" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT) - UTC+0" },
  { value: "Europe/Madrid", label: "Central European Time (CET) - UTC+1" },
  { value: "Asia/Jakarta", label: "Asia/Jakarta (GMT+7)" },
];

const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-AR", label: "Español (Argentina)" },
  { value: "es-ES", label: "Español (España)" },
  { value: "pt-BR", label: "Português (Brasil)" },
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (05/27/2026)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (27/05/2026)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-05-27)" },
];

const TIME_FORMATS = [
  { value: "12h", label: "12-hour (2:30 PM)" },
  { value: "24h", label: "24-hour (14:30)" },
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function splitFullName(fullName: string | null) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

/* ─── primitives ─── */

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-[44px] h-[24px] rounded-full transition-colors ${checked ? "bg-[#1E4F86]" : "bg-[#e5e7eb]"}`}
    >
      <span
        className={`absolute top-[2px] w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all ${checked ? "left-[22px]" : "left-[2px]"}`}
      />
    </button>
  );
}

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-[8px]">
      <span className="text-[#15385f]">{icon}</span>
      <p className="text-[16px] font-semibold text-[#0d2138] leading-[24px] tracking-[-0.16px]" style={{ fontFamily: poppins }}>
        {title}
      </p>
    </div>
  );
}

function TabHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex flex-col gap-[6px]">
        <p className="text-[20px] md:text-[24px]  font-semibold text-[#0d2138] leading-[28px] tracking-[-0.24px]" style={{ fontFamily: poppins }}>
          {title}
        </p>
        <p className="text-[16px] text-[#6a7282] leading-[24px] tracking-[-0.16px]" style={{ fontFamily: montserrat }}>
          {subtitle}
        </p>
      </div>
      <div className="h-px bg-[#f0f0f0] w-full" />
    </div>
  );
}

function Feedback({ error, success }: { error: string | null; success: string | null }) {
  if (!error && !success) return null;
  return (
    <p
      className={`text-[14px] leading-[20px] tracking-[-0.14px] ${error ? "text-[#e7000b]" : "text-[#00a63e]"}`}
      style={{ fontFamily: montserrat }}
      role={error ? "alert" : "status"}
    >
      {error ?? success}
    </p>
  );
}

function FooterButtons({
  onCancel,
  onSave,
  saving,
  cancelLabel = "Cancel",
  saveLabel = "Save Changes",
}: {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  cancelLabel?: string;
  saveLabel?: string;
}) {
  return (
   <div className="flex items-center justify-end gap-[6px] pt-[4px] md:gap-[8px]">
  <button
    type="button"
    onClick={onCancel}
    disabled={saving}
    className="flex h-[36px] items-center justify-center rounded-[78px] border border-[#e5e7eb] bg-white px-[16px] transition-colors hover:bg-[#f8fafc] disabled:opacity-60 md:h-[38px] md:px-[20px]"
  >
    <span
      className="text-[13px] leading-[18px] tracking-[-0.13px] text-[#5f5f5f] md:text-[14px] md:leading-[20px] md:tracking-[-0.14px]"
      style={{ fontFamily: montserrat }}
    >
      {cancelLabel}
    </span>
  </button>

  <button
    type="button"
    onClick={onSave}
    disabled={saving}
    className="flex h-[36px] items-center justify-center rounded-[48px] px-[24px] disabled:opacity-60 md:h-[38px] md:px-[32px]"
    style={{
      background: "linear-gradient(to bottom, #005ea4, #006fc2)",
      border: "1px solid #0088ff",
    }}
  >
    <span
      className="whitespace-nowrap text-[13px] font-medium leading-[18px] tracking-[-0.13px] text-white md:text-[14px] md:leading-[20px] md:tracking-[-0.14px]"
      style={{ fontFamily: montserrat }}
    >
      {saving ? "Saving…" : saveLabel}
    </span>
  </button>
</div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-[14px] font-medium text-[#0A0A0A] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
      {children}
    </label>
  );
}

const inputBase =
  "h-[38px] rounded-[8px] px-[12px] text-[14px] leading-[20px] tracking-[-0.14px] outline-none transition-colors w-full";
const inputWhite = `${inputBase} bg-white border border-[#e5e7eb] text-[#0d2138] placeholder:text-[#6a7282] focus:border-[#4896b6] disabled:bg-[#f9fafb] disabled:text-[#9ca3af]`;
const inputGray = `${inputBase} bg-[#f3f4f6] border border-transparent text-[#0d2138] placeholder:text-[#6a7282] focus:border-[#4896b6]`;

function TextField({
  label,
  placeholder,
  value,
  onChange,
  disabled,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-[4px] w-full">
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={inputWhite}
        style={{ fontFamily: montserrat }}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  variant = "white",
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  variant?: "white" | "gray";
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-[4px] w-full">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative w-full">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${variant === "white" ? inputWhite : inputGray} appearance-none pr-[36px] ${value ? "" : "text-[#6a7282]"}`}
          style={{ fontFamily: montserrat }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={20} className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
      </div>
      {hint && (
        <p className="text-[12px] text-[#6a7282] leading-[18px] tracking-[-0.12px]" style={{ fontFamily: montserrat }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  card,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  card?: boolean;
}) {
  return (
    <div
      className={
        card
          ? "flex items-center justify-between gap-[16px] bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] px-[16px] py-[12px]"
          : "flex items-center justify-between gap-[16px] pb-[16px] border-b border-[#f0f0f0]"
      }
    >
      <div className="flex flex-col gap-[2px] min-w-0">
        <p className="text-[14px] font-semibold text-[#0d2138] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: poppins }}>
          {title}
        </p>
        <p className="text-[12px] text-[#6a7282] leading-[18px] tracking-[-0.12px]" style={{ fontFamily: montserrat }}>
          {description}
        </p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

/* ─── Account tab ─── */

function AccountTab({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: (profile: Profile) => void;
}) {
  const initialName = splitFullName(profile.fullName);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [timezone, setTimezone] = useState(profile.timezone ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [description, setDescription] = useState(profile.description ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke any object URL created for a locally-selected photo on unmount.
  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Image must be smaller than 5MB.");
      return;
    }
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError("Image must be a PNG, JPEG, WEBP or GIF.");
      return;
    }

    setError(null);
    setRemoveAvatar(false);
    setAvatarFile(file);
    setAvatarPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    setRemoveAvatar(true);
    setAvatarPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const formData = new FormData();
    formData.set("firstName", firstName);
    formData.set("lastName", lastName);
    formData.set("phone", phone);
    formData.set("country", country);
    formData.set("city", city);
    formData.set("timezone", timezone);
    formData.set("address", address);
    formData.set("description", description);
    if (avatarFile) formData.set("avatar", avatarFile);
    if (removeAvatar) formData.set("removeAvatar", "true");

    try {
      const result = await updateProfile(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSaved(result.profile);
      onClose();
    } catch {
      setError("Something went wrong while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-[16px]">
      <TabHeading title="Account" subtitle="Real-time information and activities of your property." />

      {/* avatar upload */}
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center gap-[16px]">
          <div className="border-2 border-[#e2e8f0] rounded-[14px] w-[96px] h-[96px] overflow-hidden shrink-0 p-[2px] flex items-center justify-center bg-[#f8fafc]">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover rounded-[10px]" />
            ) : (
              <span className="text-[24px] font-semibold text-[#1f5b97]" style={{ fontFamily: poppins }}>
                {initialsOf(`${firstName} ${lastName}`.trim() || profile.email)}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-[8px]">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_AVATAR_TYPES.join(",")}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-[8px] h-[36px] w-[175px] bg-white border border-[#e5e7eb] rounded-[8px] whitespace-nowrap hover:bg-[#f8fafc] transition-colors"
            >
              <Upload size={16} className="text-[#0d2138]" />
              <span className="text-[14px] text-[#0d2138] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
                Upload New Photo
              </span>
            </button>
            {avatarPreview && (
              <button type="button" onClick={handleRemovePhoto} className="flex items-center justify-center h-[28px] px-[12px] rounded-[8px]">
                <span className="text-[14px] text-[#e7000b] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
                  Remove Photo
                </span>
              </button>
            )}
          </div>
        </div>
        <p className="text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
          Recommended: Square image, at least 400x400px
        </p>
      </div>

      {/* form fields */}
      <div className="flex flex-col gap-[16px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
          <TextField label="First Name*" placeholder="Enter your first name" value={firstName} onChange={setFirstName} />
          <TextField label="Last Name*" placeholder="Enter your last name" value={lastName} onChange={setLastName} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
          <TextField label="Email" placeholder="Enter your email" value={profile.email} onChange={() => {}} disabled />
          <TextField label="Contact Number" placeholder="Enter your number" value={phone} onChange={setPhone} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
          <SelectField
            label="Country Name"
            value={country}
            onChange={setCountry}
            placeholder="Select Country"
            options={COUNTRIES.map((c) => ({ value: c, label: c }))}
          />
          <TextField label="City" placeholder="Enter your city name" value={city} onChange={setCity} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
          <SelectField label="Time Zone" value={timezone} onChange={setTimezone} placeholder="Asia/Jakarta (GMT+7)" options={TIMEZONES} />
          <TextField label="Address" placeholder="Enter your address" value={address} onChange={setAddress} />
        </div>

        {/* description */}
        <div className="flex flex-col gap-[4px]">
          <FieldLabel>Description</FieldLabel>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
              placeholder="Typing....."
              className="w-full h-[180px] bg-white border border-[#e5e7eb] rounded-[10px] pl-[12px] pr-[8px] pt-[10px] pb-[28px] text-[14px] text-[#0d2138] placeholder:text-[#6a7282] leading-[20px] tracking-[-0.14px] outline-none focus:border-[#4896b6] transition-colors resize-none"
              style={{ fontFamily: montserrat }}
            />
            <span className="absolute bottom-[12px] right-[11px] text-[12px] text-[#6a7282] tracking-[-0.12px]" style={{ fontFamily: poppins }}>
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>
        </div>
      </div>

      <Feedback error={error} success={null} />
      <FooterButtons onCancel={onClose} onSave={handleSave} saving={isSaving} />
    </div>
  );
}

/* ─── Notifications tab ─── */

const EMAIL_NOTIFICATION_ROWS: { key: keyof NotificationPreferences; title: string; description: string }[] = [
  { key: "emailNewListings", title: "New Property Listings", description: "Get notified when new properties match your preferences" },
  { key: "emailPriceChanges", title: "Price Changes", description: "Alerts when saved properties change in price" },
  { key: "emailMessages", title: "Messages & Inquiries", description: "Receive emails for new messages from agents" },
  { key: "emailNewsletter", title: "Newsletter & Updates", description: "Weekly digest of market trends and tips" },
];

const PUSH_NOTIFICATION_ROWS: { key: keyof NotificationPreferences; title: string; description: string }[] = [
  { key: "pushNewListings", title: "New Listings", description: "Instant alerts for new property matches" },
  { key: "pushMessages", title: "Messages", description: "Get notified immediately when you receive messages" },
  { key: "pushPriceAlerts", title: "Price Alerts", description: "Real-time price drop notifications" },
];

function NotificationsTab({
  initial,
  onClose,
  onSaved,
}: {
  initial: NotificationPreferences;
  onClose: () => void;
  onSaved: (profile: Profile) => void;
}) {
  const [prefs, setPrefs] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setPref = (key: keyof NotificationPreferences, value: boolean) => {
    setSuccess(null);
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await updateNotificationPreferences(prefs);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSaved(result.profile);
      setSuccess("Notification preferences saved.");
    } catch {
      setError("Something went wrong while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-[20px]">
      <TabHeading title="Notifications" subtitle="Manage how you receive notifications and updates." />

      <div className="flex flex-col gap-[16px]">
        <SectionHeader icon={<Mail size={18} />} title="Email Notifications" />
        {EMAIL_NOTIFICATION_ROWS.map((row) => (
          <ToggleRow
            key={row.key}
            title={row.title}
            description={row.description}
            checked={prefs[row.key]}
            onChange={(v) => setPref(row.key, v)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-[16px] pt-[8px]">
        <SectionHeader icon={<Bell size={18} />} title="Push Notifications" />
        {PUSH_NOTIFICATION_ROWS.map((row) => (
          <ToggleRow
            key={row.key}
            title={row.title}
            description={row.description}
            checked={prefs[row.key]}
            onChange={(v) => setPref(row.key, v)}
          />
        ))}
      </div>

      <Feedback error={error} success={success} />
      <FooterButtons onCancel={onClose} onSave={handleSave} saving={isSaving} />
    </div>
  );
}

/* ─── Security tab ─── */

const PASSWORD_REQUIREMENTS = [
  "At least 8 characters long",
  "Contains uppercase and lowercase letters",
  "Includes at least one number",
  "Contains at least one special character",
];

function SecurityTab({
  initial,
  onSaved,
}: {
  initial: SecurityPreferences;
  onSaved: (profile: Profile) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [prefs, setPrefs] = useState(initial);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sessionsMessage, setSessionsMessage] = useState<{ error?: string; success?: string } | null>(null);

  // Current device label, detected client-side (we cannot enumerate other Supabase sessions).
  // The modal only mounts after a click, so navigator is always available here.
  const [device] = useState(() => {
    if (typeof navigator === "undefined") return { name: "This device", isMobile: false };
    const ua = navigator.userAgent;
    const browser = /edg\//i.test(ua)
      ? "Edge"
      : /chrome|crios/i.test(ua)
        ? "Chrome"
        : /firefox|fxios/i.test(ua)
          ? "Firefox"
          : /safari/i.test(ua)
            ? "Safari"
            : "Browser";
    const os = /iphone|ipad/i.test(ua)
      ? "iPhone"
      : /android/i.test(ua)
        ? "Android"
        : /mac/i.test(ua)
          ? "Mac"
          : /windows/i.test(ua)
            ? "Windows"
            : "Device";
    return { name: `${os} - ${browser}`, isMobile: /iphone|ipad|android/i.test(ua) };
  });

  const handleUpdatePassword = async () => {
    setIsUpdatingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const formData = new FormData();
      formData.set("currentPassword", currentPassword);
      formData.set("newPassword", newPassword);
      formData.set("confirmPassword", confirmPassword);

      const result = await changePassword(formData);
      if ("error" in result) {
        setPasswordError(result.error);
        return;
      }
      setPasswordSuccess("Your password has been updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Something went wrong while updating your password. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Persist 2FA / login-alert toggles immediately; revert on failure.
  const handleTogglePref = async (key: keyof SecurityPreferences, value: boolean) => {
    const previous = prefs;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setPrefsError(null);
    try {
      const result = await updateSecurityPreferences(next);
      if ("error" in result) {
        setPrefs(previous);
        setPrefsError(result.error);
        return;
      }
      onSaved(result.profile);
    } catch {
      setPrefs(previous);
      setPrefsError("Failed to save your security settings. Please try again.");
    }
  };

  const handleLogoutOthers = async () => {
    setIsLoggingOut(true);
    setSessionsMessage(null);
    try {
      const result = await logoutOtherSessions();
      if ("error" in result) {
        setSessionsMessage({ error: result.error });
        return;
      }
      setSessionsMessage({ success: "All other sessions have been logged out." });
    } catch {
      setSessionsMessage({ error: "Failed to log out other sessions. Please try again." });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const passwordInput = (label: string, placeholder: string, value: string, onChange: (v: string) => void) => (
    <div className="flex flex-col gap-[4px]">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="password"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputGray}
        style={{ fontFamily: montserrat }}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-[20px]">
      <TabHeading title="Security" subtitle="Manage your account security and privacy settings." />

      {/* Password */}
      <div className="flex flex-col gap-[12px]">
        <SectionHeader icon={<KeyRound size={18} />} title="Password" />
        {passwordInput("Current Password", "Enter current password", currentPassword, setCurrentPassword)}
        {passwordInput("New Password", "Enter new password", newPassword, setNewPassword)}
        {passwordInput("Confirm New Password", "Confirm new password", confirmPassword, setConfirmPassword)}

        <div className="bg-[#eff6ff] border border-[#bedbff] rounded-[10px] px-[16px] py-[12px] flex flex-col gap-[6px]">
          <p className="text-[12px] font-semibold text-[#0d2138] leading-[18px]" style={{ fontFamily: poppins }}>
            Password Requirements:
          </p>
          {PASSWORD_REQUIREMENTS.map((req) => (
            <p key={req} className="text-[12px] text-[#364153] leading-[16px] tracking-[-0.12px]" style={{ fontFamily: montserrat }}>
              · {req}
            </p>
          ))}
        </div>

        <Feedback error={passwordError} success={passwordSuccess} />

        <button
          type="button"
          onClick={handleUpdatePassword}
          disabled={isUpdatingPassword}
          className="self-start flex items-center justify-center h-[38px] px-[16px] bg-[#15385f] hover:bg-[#0d2138] rounded-[8px] disabled:opacity-60 transition-colors"
        >
          <span className="text-[14px] font-medium text-white leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
            {isUpdatingPassword ? "Updating…" : "Update Password"}
          </span>
        </button>
      </div>

      <div className="h-px bg-[#f0f0f0] w-full" />

      {/* Two-Factor Authentication */}
      <div className="flex flex-col gap-[12px]">
        <SectionHeader icon={<ShieldCheck size={18} />} title="Two-Factor Authentication" />
        <ToggleRow
          card
          title="Enable 2FA"
          description="Add an extra layer of security to your account"
          checked={prefs.twoFactorEnabled}
          onChange={(v) => handleTogglePref("twoFactorEnabled", v)}
        />
      </div>

      {/* Login Alerts */}
      <div className="flex flex-col gap-[12px]">
        <SectionHeader icon={<Bell size={18} />} title="Login Alerts" />
        <ToggleRow
          card
          title="Notify me of new logins"
          description="Get alerts when your account is accessed from a new device"
          checked={prefs.loginAlerts}
          onChange={(v) => handleTogglePref("loginAlerts", v)}
        />
      </div>

      <Feedback error={prefsError} success={null} />

      {/* Active Sessions */}
      <div className="flex flex-col gap-[12px]">
        <SectionHeader icon={<Smartphone size={18} />} title="Active Sessions" />

       <div className="flex flex-col gap-3 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
  <div className="flex min-w-0 items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white">
      {device.isMobile ? (
        <Smartphone size={18} className="text-[#15385f]" />
      ) : (
        <Monitor size={18} className="text-[#15385f]" />
      )}
    </div>

    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <p
        className="truncate text-sm font-semibold leading-5 tracking-[-0.14px] text-[#0d2138]"
        style={{ fontFamily: poppins }}
        title={device.name}
      >
        {device.name}
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className="flex items-center gap-1 text-xs leading-4 text-[#6a7282]"
          style={{ fontFamily: montserrat }}
        >
          <MapPin size={12} className="shrink-0" />
          This device
        </span>

        <span
          className="flex items-center gap-1 text-xs leading-4 text-[#6a7282]"
          style={{ fontFamily: montserrat }}
        >
          <Clock size={12} className="shrink-0" />
          Active now
        </span>
      </div>
    </div>
  </div>

  <span
    className="w-fit shrink-0 self-end rounded-md bg-[#dcfce7] px-2.5 py-0.5 text-xs leading-[18px] text-[#00a63e] min-[400px]:self-auto"
    style={{ fontFamily: montserrat }}
  >
    Current
  </span>
</div>

        {sessionsMessage && <Feedback error={sessionsMessage.error ?? null} success={sessionsMessage.success ?? null} />}

        <button
          type="button"
          onClick={handleLogoutOthers}
          disabled={isLoggingOut}
          className="flex items-center justify-center h-[40px] w-full bg-white border border-[#e5e7eb] rounded-[8px] hover:bg-[#f8fafc] disabled:opacity-60 transition-colors"
        >
          <span className="text-[14px] font-medium text-[#0d2138] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
            {isLoggingOut ? "Logging out…" : "Log Out All Other Sessions"}
          </span>
        </button>
      </div>
    </div>
  );
}

/* ─── Language & Region tab ─── */

function LanguageTab({
  initial,
  onSaved,
}: {
  initial: LocalePreferences;
  onSaved: (profile: Profile) => void;
}) {
  const [locale, setLocale] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const update = (patch: Partial<LocalePreferences>) => {
    setSuccess(null);
    setLocale((l) => ({ ...l, ...patch }));
  };

  const handleAutoDetect = (enabled: boolean) => {
    const patch: Partial<LocalePreferences> = { autoDetectTimezone: enabled };
    if (enabled) {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (TIMEZONES.some((tz) => tz.value === detected)) patch.timezone = detected;
    }
    update(patch);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await updateLocalePreferences(locale);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onSaved(result.profile);
      setSuccess("Language & region preferences saved.");
    } catch {
      setError("Something went wrong while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-[20px]">
      <TabHeading title="Language & Region" subtitle="Customize your language, timezone, and regional preferences." />

      {/* Display Language */}
      <div className="flex flex-col gap-[12px]">
        <SectionHeader icon={<Globe size={18} />} title="Display Language" />
        <SelectField
          label="Select Language"
          value={locale.language}
          onChange={(v) => update({ language: v })}
          options={LANGUAGES}
          variant="gray"
          hint="This will change the language used throughout the app"
        />
      </div>

      <div className="h-px bg-[#f0f0f0] w-full" />

      {/* Timezone */}
      <div className="flex flex-col gap-[12px]">
        <SectionHeader icon={<Clock size={18} />} title="Timezone" />
        <SelectField
          label="Select Timezone"
          value={locale.timezone}
          onChange={(v) => update({ timezone: v })}
          options={TIMEZONES}
          variant="gray"
          hint="Used for displaying dates and times"
        />
        <ToggleRow
          card
          title="Auto-detect Timezone"
          description="Automatically update based on your location"
          checked={locale.autoDetectTimezone}
          onChange={handleAutoDetect}
        />
      </div>

      <div className="h-px bg-[#f0f0f0] w-full" />

      {/* Date & Time Format */}
      <div className="flex flex-col gap-[12px]">
        <SectionHeader icon={<Clock size={18} />} title="Date & Time Format" />
        <SelectField label="Date Format" value={locale.dateFormat} onChange={(v) => update({ dateFormat: v })} options={DATE_FORMATS} variant="gray" />
        <SelectField label="Time Format" value={locale.timeFormat} onChange={(v) => update({ timeFormat: v })} options={TIME_FORMATS} variant="gray" />
      </div>

      <Feedback error={error} success={success} />
      <FooterButtons
        onCancel={() => {
          setLocale(DEFAULT_PREFERENCES.locale);
          setSuccess(null);
          setError(null);
        }}
        onSave={handleSave}
        saving={isSaving}
        cancelLabel="Reset to Default"
        saveLabel="Save Preference"
      />
    </div>
  );
}

/* ─── Modal shell ─── */

type SettingsTab = "Account" | "Notifications" | "Security" | "Language";

export function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: (profile: Profile) => void;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("Account");
  const overlayRef = useRef<HTMLDivElement>(null);

  const preferences = useMemo(() => resolvePreferences(profile), [profile]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const sidebarItems: { label: SettingsTab; icon: typeof User }[] = [
    { label: "Account", icon: User },
    { label: "Notifications", icon: Bell },
    { label: "Security", icon: Lock },
    { label: "Language", icon: Languages },
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Edit Profile"
    >
      <div className="bg-white border border-[#e5e7eb] rounded-[20px] w-full max-w-[1196px] max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex flex-col gap-[24px] p-[20px] sm:p-[31px]">
          {/* ── Header ── */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-[8px]">
              <p className="text-[20px] md:text-[24px]  font-semibold text-[#0d2138] leading-[28px] tracking-[-0.24px]" style={{ fontFamily: poppins }}>
                Edit Profile
              </p>
              <p className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px]" style={{ fontFamily: montserrat }}>
                Update your profile information and preferences
              </p>
            </div>
            <button onClick={onClose} className="shrink-0 mt-1 hover:opacity-60 transition-opacity" aria-label="Close">
              <X size={24} className="text-[#0d2138]" strokeWidth={1.5} />
            </button>
          </div>

          {/* ── Body: sidebar + content ── */}
          <div className="flex flex-col md:flex-row items-start gap-[16px]">
            {/* Settings sidebar */}
            <div className="shrink-0 w-full md:w-[244px] bg-white border border-[#e5e7eb] rounded-[12px] p-[14px] flex flex-col gap-[8px]">
              <div className="px-[8px] pb-[4px] pt-[6px]">
                <p className="text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
                  Settings Menu
                </p>
              </div>
              {sidebarItems.map(({ label, icon: Icon }) => {
                const isActive = label === activeTab;
                return (
                  <button
                    key={label}
                    onClick={() => setActiveTab(label)}
                    className={`flex items-center gap-[8px] w-full p-[8px] rounded-[8px] text-left transition-colors ${
                      isActive ? "bg-[#f8fafc] border border-[#e5e7eb]" : "bg-white hover:bg-[#f9fafb]"
                    }`}
                  >
                    <Icon size={20} strokeWidth={1.5} className={isActive ? "text-[#0d2138]" : "text-[#6a7282]"} />
                    <span
                      className={`text-[14px] leading-[20px] tracking-[-0.14px] ${isActive ? "font-medium text-[#0d2138]" : "text-[#6a7282]"}`}
                      style={{ fontFamily: montserrat }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Content panel */}
            <div className="flex-1 min-w-0 w-full md:p-[24px] md:pt-0">
              {activeTab === "Account" && <AccountTab profile={profile} onClose={onClose} onSaved={onSaved} />}
              {activeTab === "Notifications" && (
                <NotificationsTab initial={preferences.notifications} onClose={onClose} onSaved={onSaved} />
              )}
              {activeTab === "Security" && <SecurityTab initial={preferences.security} onSaved={onSaved} />}
              {activeTab === "Language" && <LanguageTab initial={preferences.locale} onSaved={onSaved} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
