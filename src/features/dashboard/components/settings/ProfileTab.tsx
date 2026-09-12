"use client";
import { optimizeAvatarForUpload } from "@/lib/client-image";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Save } from "lucide-react";

import { updateProfile } from "@/features/profile/actions";
import { translateProfileError } from "@/features/profile/error-codes";
import type { Profile } from "@/generated/prisma/client";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const inputClass =
  "h-9 px-3.5 bg-white border border-[#d1d5dc] rounded-[10px] text-[12px] text-[#0a0a0a] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] font-medium text-[#1f2937]";

const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

type ProfileTabProps = {
  profile: Profile;
};

export function ProfileTab({ profile }: ProfileTabProps) {
  const { t } = useTranslation("dashboardSettings");
  const [firstName, setFirstName] = useState(profile.fullName?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(profile.fullName?.split(" ").slice(1).join(" ") ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.description ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError(t("profile.errors.imageBadType"));
      return;
    }

    setError(null);
    setAvatarFile(file);
    setAvatarPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) {
      setError(t("profile.errors.firstNameRequired"));
      return;
    }
    if (!lastName.trim()) {
      setError(t("profile.errors.lastNameRequired"));
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.set("firstName", firstName.trim());
    formData.set("lastName", lastName.trim());
    formData.set("phone", phone.trim());
    formData.set("country", profile.country ?? "");
    formData.set("city", profile.city ?? "");
    formData.set("timezone", profile.timezone ?? "");
    formData.set("address", profile.address ?? "");
    formData.set("description", bio.trim());


    try {
      if (avatarFile) formData.set("avatar", await optimizeAvatarForUpload(avatarFile));
      const result = await updateProfile(formData);
      if ("error" in result) {
        setError(translateProfileError(result.error, t));
        return;
      }
      setSuccess(true);
    } catch {
      setError(t("profile.errors.generic"));
    } finally {
      setIsSaving(false);
    }
  }

 const labelClass =
  "text-[14px] font-medium leading-5 text-[#202938]";

const inputClass =
  "h-[42px] w-full min-w-0 rounded-[10px] border border-[#ccd4df] bg-white px-3.5 text-[14px] text-[#2b3038] outline-none transition-all placeholder:text-[#8d97a6] focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 disabled:cursor-not-allowed disabled:bg-[#fafbfc] disabled:text-[#7b8493]";

return (
  <div className="flex w-full min-w-0 flex-col">
    {/* Title */}
    <h1
      className="text-[14px] font-semibold leading-7 text-[#0d2138] sm:text-[16px]"
      style={mont}
    >
      {t("profile.title")}
    </h1>

    {/* Profile information */}
    <div className="mt-5 flex min-w-0 flex-col items-start gap-4 sm:mt-6 sm:flex-row sm:items-center sm:gap-5">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="flex size-[78px] items-center justify-center overflow-hidden rounded-full bg-[#e8f0fe] sm:size-[90px]">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt={`${profile.fullName ?? "User"} profile`}
              className="size-full object-cover"
            />
          ) : (
            <span
              className="text-[24px] font-semibold text-[#1e4f86]"
              style={poppins}
            >
              {(profile.fullName ?? profile.email ?? "U")
                .charAt(0)
                .toUpperCase()}
            </span>
          )}
        </div>

        {/* Camera button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={t("profile.changePhotoAria")}
          className="absolute -bottom-0.5 -right-0.5 flex size-8 items-center justify-center rounded-full border-[3px] border-white bg-white text-[#1e4f86] shadow-[0_1px_4px_rgba(15,23,42,0.16)] transition-colors hover:bg-[#eff6ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30"
        >
          <Camera size={14} strokeWidth={2} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Name and email */}
      <div className="min-w-0 flex-1">
        <p
          className="break-words text-[16px] font-semibold leading-7 text-[#1e4f86] sm:text-[20px] sm:leading-8"
          style={poppins}
        >
          {profile.fullName ?? "—"}
        </p>

        <p
          className="mt-1 break-all text-[14px] leading-5 text-[#6a7282] sm:text-[14px]"
          style={mont}
        >
          {profile.email}
        </p>
      </div>
    </div>

    {/* Form */}
    <form
      onSubmit={handleSubmit}
      className="mt-7 flex min-w-0 flex-col gap-4 sm:mt-8 sm:gap-5"
    >
      {/* First and last name */}
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-[18px]">
        <div className="flex min-w-0 flex-col gap-2">
          <label
            htmlFor="profile-first-name"
            className={labelClass}
            style={mont}
          >
            {t("profile.firstNameLabel")}
          </label>

          <input
            id="profile-first-name"
            type="text"
            value={firstName}
            onChange={(event) =>
              setFirstName(event.target.value)
            }
            placeholder={t("profile.firstNamePlaceholder")}
            autoComplete="given-name"
            className={inputClass}
            style={mont}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <label
            htmlFor="profile-last-name"
            className={labelClass}
            style={mont}
          >
            {t("profile.lastNameLabel")}
          </label>

          <input
            id="profile-last-name"
            type="text"
            value={lastName}
            onChange={(event) =>
              setLastName(event.target.value)
            }
            placeholder={t("profile.lastNamePlaceholder")}
            autoComplete="family-name"
            className={inputClass}
            style={mont}
          />
        </div>
      </div>

      {/* Email */}
      <div className="flex min-w-0 flex-col gap-2">
        <label
          htmlFor="profile-email"
          className={labelClass}
          style={mont}
        >
          {t("profile.emailLabel")}
        </label>

        <input
          id="profile-email"
          type="email"
          value={profile.email}
          disabled
          className={inputClass}
          style={mont}
        />
      </div>

      {/* Phone */}
      <div className="flex min-w-0 flex-col gap-2">
        <label
          htmlFor="profile-phone"
          className={labelClass}
          style={mont}
        >
          {t("profile.phoneLabel")}
        </label>

        <input
          id="profile-phone"
          type="tel"
          value={phone}
          onChange={(event) =>
            setPhone(event.target.value)
          }
          placeholder={t("profile.phonePlaceholder")}
          autoComplete="tel"
          className={inputClass}
          style={mont}
        />
      </div>

      {/* Bio */}
      <div className="flex min-w-0 flex-col gap-2">
        <label
          htmlFor="profile-bio"
          className={labelClass}
          style={mont}
        >
          {t("profile.bioLabel")}
        </label>

        <textarea
          id="profile-bio"
          value={bio}
          onChange={(event) =>
            setBio(event.target.value)
          }
          rows={5}
          placeholder={t("profile.bioPlaceholder")}
          className="min-h-[85px] w-full min-w-0 resize-y rounded-[10px] border border-[#ccd4df] bg-white px-3.5 py-3 text-[14px] leading-6 text-[#2b3038] outline-none transition-all placeholder:text-[#8d97a6] focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 sm:min-h-[110px]"
          style={mont}
        />
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[14px] leading-5 text-[#dc2626]"
          style={mont}
        >
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div
          role="status"
          className="rounded-[10px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[14px] leading-5 text-[#008236]"
          style={mont}
        >
          {t("profile.success")}
        </div>
      )}

      {/* Save button */}
      <div className="pt-1 sm:pt-0">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-[41px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#245c98] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e4f86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          style={mont}
        >
          <Save size={16} className="shrink-0" />

          {isSaving ? t("profile.saving") : t("profile.saveChanges")}
        </button>
      </div>
    </form>
  </div>
);
}
