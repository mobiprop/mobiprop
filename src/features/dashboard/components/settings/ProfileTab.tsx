"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, Save } from "lucide-react";

import { updateProfile } from "@/features/profile/actions";
import type { Profile } from "@/generated/prisma/client";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const inputClass =
  "h-9 px-3.5 bg-white border border-[#d1d5dc] rounded-[10px] text-[12px] text-[#0a0a0a] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] font-medium text-[#1f2937]";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

type ProfileTabProps = {
  profile: Profile;
};

export function ProfileTab({ profile }: ProfileTabProps) {
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

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Image must be smaller than 5MB.");
      return;
    }
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError("Image must be a PNG, JPEG, WEBP or GIF.");
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
      setError("First name is required.");
      return;
    }
    if (!lastName.trim()) {
      setError("Last name is required.");
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
    if (avatarFile) formData.set("avatar", avatarFile);

    try {
      const result = await updateProfile(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Something went wrong while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[16px] font-medium text-[#0d2138]" style={mont}>Profile Settings</p>

      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0 rounded-full overflow-hidden bg-[#e8f0fe] flex items-center justify-center">
          {avatarPreview ? (
            <img src={avatarPreview} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[24px] font-semibold text-[#1e4f86]" style={poppins}>
              {(profile.fullName ?? profile.email).charAt(0).toUpperCase()}
            </span>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 size-7 rounded-full bg-[#1e4f86] border-2 border-white flex items-center justify-center text-white hover:bg-[#1b487a] transition-colors"
          >
            <Camera size={13} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="flex flex-col">
          <p className="text-[20px] font-medium text-[#1e4f86]" style={poppins}>{profile.fullName ?? "—"}</p>
          <p className="text-[14px] text-[#6a7282]" style={mont}>{profile.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <label className={labelClass} style={mont}>First Name</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} style={mont} />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label className={labelClass} style={mont}>Last Name</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} style={mont} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass} style={mont}>Email</label>
          <input
            value={profile.email}
            disabled
            className={`${inputClass} bg-[#f8fafc] text-[#6a7282] cursor-not-allowed`}
            style={mont}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass} style={mont}>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} style={mont} />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass} style={mont}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="px-3.5 py-2.5 bg-white border border-[#d1d5dc] rounded-[10px] text-[12px] text-[#0a0a0a] outline-none focus:border-[#1e4f86] transition-colors resize-none h-24"
            style={mont}
          />
        </div>

        {error && <p className="text-[12px] text-[#dc2626]" style={mont}>{error}</p>}
        {success && <p className="text-[12px] text-[#10b981]" style={mont}>Profile updated successfully.</p>}

        <div>
          <button
            type="submit"
            disabled={isSaving}
            className="h-9 px-4 inline-flex items-center gap-2 bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60"
            style={mont}
          >
            <Save size={14} />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
