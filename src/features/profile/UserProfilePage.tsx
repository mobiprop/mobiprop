"use client";

import { useState, useEffect, useRef } from "react";

/* ─── assets ─── */
const heroBg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg2.png";
const heroOverlay = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg.png";
const avatarImg = "/assets/figma-temp/UserProfile/avatar.png";
const modalAvatarImg = "/assets/figma-temp/UserProfile/modal-avatar.png";
const iconEmail = "/assets/figma-temp/UserProfile/icon-email.png";
const iconPhone = "/assets/figma-temp/UserProfile/icon-phone.png";
const iconMap = "/assets/figma-temp/UserProfile/icon-map.png";
const iconEdit = "/assets/figma-temp/UserProfile/icon-edit.png";
const iconHeart = "/assets/figma-temp/UserProfile/heart.png";
const iconSqft = "/assets/figma-temp/UserProfile/icon-sqft.png";
const iconBed = "/assets/figma-temp/UserProfile/icon-bed.png";
const iconBath = "/assets/figma-temp/UserProfile/icon-bath.png";
const iconLocation = "/assets/figma-temp/UserProfile/icon-location.png";
/* inline SVG icons (Figma asset downloads were blank for these small icons) */

const propPhotos = [
  "/assets/figma-temp/UserProfile/prop-0.png",
  "/assets/figma-temp/UserProfile/prop-1.png",
  "/assets/figma-temp/UserProfile/prop-2.png",
  "/assets/figma-temp/UserProfile/prop-3.png",
  "/assets/figma-temp/UserProfile/prop-4.png",
  "/assets/figma-temp/UserProfile/prop-5.png",
  "/assets/figma-temp/UserProfile/prop-6.png",
  "/assets/figma-temp/UserProfile/prop-7.png",
];

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

/* ─── Inline SVG icons (Figma small asset downloads were blank) ─── */
function IconClose() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="#0d2138" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.667 11.333v1.334A1.333 1.333 0 0 0 4 14h8a1.333 1.333 0 0 0 1.333-1.333v-1.334M10.667 5.333 8 2.667 5.333 5.333M8 2.667v8" stroke="#0d2138" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 7.5l5 5 5-5" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconAccount({ active }: { active: boolean }) {
  const c = active ? "#0d2138" : "#6a7282";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="6.5" r="3" stroke={c} strokeWidth="1.25" />
      <path d="M3.5 17c0-3.314 2.91-6 6.5-6s6.5 2.686 6.5 6" stroke={c} strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function IconBell({ active }: { active: boolean }) {
  const c = active ? "#0d2138" : "#6a7282";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2.5A5 5 0 0 0 5 7.5v2.917L3.75 12.5h12.5L15 10.417V7.5A5 5 0 0 0 10 2.5Z" stroke={c} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.75 15a1.25 1.25 0 0 0 2.5 0" stroke={c} strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function IconLock({ active }: { active: boolean }) {
  const c = active ? "#0d2138" : "#6a7282";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3.75" y="9.167" width="12.5" height="9.166" rx="1.5" stroke={c} strokeWidth="1.25" />
      <path d="M6.667 9.167V6.25a3.333 3.333 0 0 1 6.666 0v2.917" stroke={c} strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="10" cy="13.75" r="1" fill={c} />
    </svg>
  );
}

function IconGlobe({ active }: { active: boolean }) {
  const c = active ? "#0d2138" : "#6a7282";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7.5" stroke={c} strokeWidth="1.25" />
      <path d="M10 2.5c-2.5 2.917-2.5 12.083 0 15M10 2.5c2.5 2.917 2.5 12.083 0 15M2.5 10h15" stroke={c} strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Edit Profile Modal ─── */
type SettingsTab = "Account" | "Notifications" | "Security" | "Language";

function EditProfileModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("Account");
  const [description, setDescription] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const sidebarItems: { label: SettingsTab; icon: (active: boolean) => React.ReactNode }[] = [
    { label: "Account",       icon: (a) => <IconAccount active={a} /> },
    { label: "Notifications", icon: (a) => <IconBell active={a} /> },
    { label: "Security",      icon: (a) => <IconLock active={a} /> },
    { label: "Language",      icon: (a) => <IconGlobe active={a} /> },
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white border border-[#e5e7eb] rounded-[20px] w-full max-w-[760px] max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex flex-col gap-[24px] p-[31px]">

          {/* ── Header ── */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-[8px]">
              <p className="text-[24px] font-semibold text-[#0d2138] leading-[28px] tracking-[-0.24px]" style={{ fontFamily: poppins }}>
                Edit Profile
              </p>
              <p className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px]" style={{ fontFamily: montserrat }}>
                Update your profile information and preferences
              </p>
            </div>
            <button onClick={onClose} className="shrink-0 mt-1 hover:opacity-60 transition-opacity" aria-label="Close">
              <IconClose />
            </button>
          </div>

          {/* ── Body: sidebar + content ── */}
          <div className="flex items-start gap-[16px]">

            {/* Settings sidebar */}
            <div className="shrink-0 w-[200px] bg-white border border-[#e5e7eb] rounded-[12px] p-[14px] flex flex-col gap-[8px]">
              <div className="px-[8px] pb-[4px] pt-[6px]">
                <p className="text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
                  Settings Menu
                </p>
              </div>
              {sidebarItems.map(({ label, icon }) => {
                const isActive = label === activeTab;
                return (
                  <button
                    key={label}
                    onClick={() => setActiveTab(label)}
                    className={`flex items-center gap-[8px] w-full p-[8px] rounded-[8px] text-left transition-colors ${
                      isActive ? "bg-[#f8fafc] border border-[#e5e7eb]" : "bg-white hover:bg-[#f9fafb]"
                    }`}
                  >
                    <span className="shrink-0">{icon(isActive)}</span>
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

            {/* Account content panel */}
            <div className="flex-1 min-w-0 flex flex-col gap-[16px]">

              {/* section heading */}
              <div className="flex flex-col gap-[12px]">
                <div className="flex flex-col gap-[6px]">
                  <p className="text-[24px] font-semibold text-[#0d2138] leading-[28px] tracking-[-0.24px]" style={{ fontFamily: poppins }}>
                    Account
                  </p>
                  <p className="text-[16px] text-[#6a7282] leading-[24px] tracking-[-0.16px]" style={{ fontFamily: montserrat }}>
                    Real-time information and activities of your property.
                  </p>
                </div>
                <div className="h-px bg-[#f0f0f0] w-full" />
              </div>

              {/* avatar upload */}
              <div className="flex flex-col gap-[8px]">
                <div className="flex items-center gap-[16px]">
                  <div className="border-2 border-[#e2e8f0] rounded-[14px] w-[72px] h-[72px] overflow-hidden shrink-0 p-[2px]">
                    <img src={modalAvatarImg} alt="Profile" className="w-full h-full object-cover rounded-[10px]" />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <button className="flex items-center gap-[8px] h-[36px] px-[12px] bg-white border border-[#e5e7eb] rounded-[8px] whitespace-nowrap">
                      <IconUpload />
                      <span className="text-[14px] text-[#0d2138] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
                        Upload New Photo
                      </span>
                    </button>
                    <button className="flex items-center h-[28px] px-[12px] rounded-[8px]">
                      <span className="text-[14px] text-[#e7000b] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
                        Remove Photo
                      </span>
                    </button>
                  </div>
                </div>
                <p className="text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
                  Recommended: Square image, at least 400x400px
                </p>
              </div>

              {/* form fields */}
              <div className="flex flex-col gap-[16px]">
                <div className="grid grid-cols-2 gap-[16px]">
                  <FormField label="First Name*" placeholder="Enter your first name" />
                  <FormField label="Last Name*" placeholder="Enter your first name" />
                </div>
                <div className="grid grid-cols-2 gap-[16px]">
                  <FormField label="Email" placeholder="Enter your email" />
                  <FormField label="Contact Number" placeholder="Enter your number" />
                </div>
                <div className="grid grid-cols-2 gap-[16px]">
                  <SelectField label="Country Name" placeholder="Select Country" />
                  <FormField label="City" placeholder="Enter your city name" />
                </div>
                <div className="grid grid-cols-2 gap-[16px]">
                  <SelectField label="Time Zone" placeholder="Asia/Jakarta (GMT+7)" />
                  <FormField label="Address" placeholder="Enter your address" />
                </div>

                {/* Description textarea */}
                <div className="flex flex-col gap-[4px]">
                  <label className="text-[14px] font-medium text-[#0d2138] leading-[18px]" style={{ fontFamily: montserrat }}>
                    Description
                  </label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, 250))}
                      placeholder="Typing....."
                      rows={5}
                      className="w-full border border-[#e5e7eb] rounded-[10px] px-[12px] pt-[10px] pb-[28px] text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px] outline-none focus:border-[#4896b6] transition-colors resize-none shadow-[0px_1px_1px_rgba(21,28,36,0.05)]"
                      style={{ fontFamily: montserrat }}
                    />
                    <span className="absolute bottom-[8px] right-[11px] text-[12px] text-[#6a7282] leading-[16px]" style={{ fontFamily: poppins }}>
                      {description.length}/250
                    </span>
                  </div>
                </div>
              </div>

              {/* action buttons */}
              <div className="flex items-center gap-[8px] justify-end pt-[4px]">
                <button
                  onClick={onClose}
                  className="flex items-center justify-center h-[38px] px-[20px] bg-white border border-[#e5e7eb] rounded-[78px]"
                >
                  <span className="text-[14px] text-[#5f5f5f] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
                    Cancel
                  </span>
                </button>
                <button
                  className="relative flex items-center justify-center h-[38px] px-[32px] rounded-[48px] overflow-hidden"
                  style={{ background: "linear-gradient(to bottom, #005ea4, #006fc2)", border: "1px solid #0088ff" }}
                >
                  <span className="relative text-[14px] font-medium text-white leading-[20px] tracking-[-0.14px] whitespace-nowrap" style={{ fontFamily: montserrat }}>
                    Save Changes
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable form field ─── */
function FormField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <label
        className="text-[14px] font-medium text-[#0d2138] leading-[20px] tracking-[-0.14px]"
        style={{ fontFamily: montserrat }}
      >
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        className="h-[38px] border border-[#e5e7eb] rounded-[8px] px-[12px] text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px] outline-none focus:border-[#4896b6] transition-colors bg-white"
        style={{ fontFamily: montserrat }}
      />
    </div>
  );
}

function SelectField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <label className="text-[14px] font-medium text-[#0d2138] leading-[18px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
        {label}
      </label>
      <div className="h-[38px] border border-[#e5e7eb] rounded-[8px] bg-white flex items-center px-[12px] justify-between cursor-pointer">
        <span className="text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px] truncate" style={{ fontFamily: montserrat }}>
          {placeholder}
        </span>
        <IconChevronDown />
      </div>
    </div>
  );
}

/* ─── Property Card ─── */
function PropertyCard({ photo, tag1 = "Sale", tag2 = "Apartment" }: { photo: string; tag1?: string; tag2?: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col gap-[20px] items-start w-full">
      <div className="relative h-[296px] w-full rounded-[16px] overflow-hidden shrink-0">
        <img src={photo} alt="Property" className="absolute inset-0 w-full h-full object-cover" />
        <button
          onClick={() => setSaved((s) => !s)}
          className="absolute top-[16px] right-[16px] bg-white rounded-full w-[32px] h-[32px] flex items-center justify-center shadow-sm"
        >
          <img src={iconHeart} alt="Save" className={`w-[16px] h-[16px] ${saved ? "opacity-100" : "opacity-60"}`} />
        </button>
        <div className="absolute top-[16px] left-[16px] flex gap-[4px]">
          <span className="bg-white bg-opacity-90 px-[12px] py-[4px] rounded-[36px] text-[14px] text-[#0d2138] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>{tag1}</span>
          <span className="bg-white bg-opacity-90 px-[12px] py-[4px] rounded-[36px] text-[14px] text-[#0d2138] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>{tag2}</span>
        </div>
      </div>

      <div className="flex flex-col gap-[10px] items-start w-full">
        <div className="border-b border-[#e5e7eb] pb-[10px] flex justify-between items-start w-full gap-4">
          <div className="flex flex-col gap-[2px]">
            <p className="text-[20px] font-medium text-[#0d2138] leading-[32px] tracking-[-0.2px] truncate max-w-[260px]" style={{ fontFamily: poppins }}>
              Coastal Modern Residence
            </p>
            <div className="flex gap-[4px] items-center">
              <img src={iconLocation} alt="" className="w-[16px] h-[16px] shrink-0" />
              <p className="text-[14px] text-[#0d2138] leading-[20px] tracking-[-0.14px] truncate max-w-[160px]" style={{ fontFamily: montserrat }}>
                Bayshore Gardens, Tampa, FL
              </p>
            </div>
          </div>
          <p className="text-[18px] font-semibold text-[#2b3038] leading-[26px] tracking-[-0.18px] whitespace-nowrap text-right shrink-0" style={{ fontFamily: poppins }}>
            $8,500,000
          </p>
        </div>

        <div className="flex gap-[20px] items-center">
          <div className="flex items-center gap-[8px]">
            <img src={iconSqft} alt="" className="w-[20px] h-[20px] shrink-0" />
            <span className="text-[14px] text-[#2b3038] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>680 sq.ft</span>
          </div>
          <div className="flex items-center gap-[8px]">
            <img src={iconBed} alt="" className="w-[20px] h-[20px] shrink-0" />
            <span className="text-[14px] text-[#2b3038] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>3 Bed</span>
          </div>
          <div className="flex items-center gap-[8px]">
            <img src={iconBath} alt="" className="w-[20px] h-[20px] shrink-0" />
            <span className="text-[14px] text-[#2b3038] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>2.5 Bath</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero / Profile Card ─── */
function ProfileHero({ onEditClick }: { onEditClick: () => void }) {
  return (
    <section className="relative overflow-hidden" style={{ minHeight: 488 }}>
      <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <img src={heroOverlay} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(167,189,221,0.97) 0%, rgba(255,255,255,0.77) 45%, white 63%)" }}
      />

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-[76px] pt-[87px] pb-[60px]">
        <div className="flex gap-[40px] lg:gap-[60px] items-start">
          {/* avatar card */}
          <div className="shrink-0 bg-white rounded-[16px] overflow-hidden w-[244px] h-[243px] relative">
            <img
              src={avatarImg}
              alt="Matias Ulrich"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ left: "-31px", top: "-93px", width: "306px", height: "458px", maxWidth: "none" }}
            />
          </div>

          {/* info */}
          <div className="flex flex-col gap-[24px] flex-1">
            <div className="flex flex-col gap-[28px]">
              <div className="relative flex flex-col gap-[8px]">
                <p className="text-[40px] font-semibold text-[#0d2138] leading-[52px] tracking-[-0.4px]" style={{ fontFamily: poppins }}>
                  Matias Ulrich
                </p>
                <p className="text-[18px] text-[#6a7282] leading-[26px] tracking-[-0.18px]" style={{ fontFamily: poppins }}>
                  Premium Member · Joined March 2022
                </p>

                {/* Edit Profile button */}
                <button
                  onClick={onEditClick}
                  className="absolute right-0 top-0 flex items-center gap-[8px] h-[44px] px-[16px] border border-[#d1d5dc] rounded-[12px] bg-white hover:bg-[#f8fafc] transition-colors"
                >
                  <img src={iconEdit} alt="" className="w-[16px] h-[16px]" />
                  <span className="text-[14px] font-medium text-[#0d2138] leading-[20px] tracking-[-0.14px] whitespace-nowrap" style={{ fontFamily: montserrat }}>
                    Edit Profile
                  </span>
                </button>
              </div>

              {/* info tiles */}
              <div className="flex flex-wrap gap-[8px]">
                <div className="bg-white rounded-[14px] flex items-center gap-[12px] h-[76px] px-[16px] w-[293px]">
                  <div className="bg-[rgba(72,150,182,0.16)] rounded-[10px] w-[40px] h-[40px] flex items-center justify-center shrink-0">
                    <img src={iconEmail} alt="" className="w-[20px] h-[20px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>Email</span>
                    <span className="text-[16px] font-semibold text-[#0d2138] leading-[24px] tracking-[-0.16px] whitespace-nowrap" style={{ fontFamily: montserrat }}>matias.ulrich@email.com</span>
                  </div>
                </div>

                <div className="bg-white rounded-[14px] flex items-center gap-[12px] h-[76px] px-[16px] w-[293px]">
                  <div className="bg-[rgba(72,150,182,0.16)] rounded-[10px] w-[40px] h-[40px] flex items-center justify-center shrink-0">
                    <img src={iconPhone} alt="" className="w-[20px] h-[20px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>Phone</span>
                    <span className="text-[16px] font-semibold text-[#0d2138] leading-[24px] tracking-[-0.16px] whitespace-nowrap" style={{ fontFamily: montserrat }}>+1 (555) 123-4567</span>
                  </div>
                </div>

                <div className="bg-white rounded-[14px] flex items-center gap-[12px] h-[76px] px-[16px] w-[293px]">
                  <div className="bg-[rgba(72,150,182,0.16)] rounded-[10px] w-[40px] h-[40px] flex items-center justify-center shrink-0">
                    <img src={iconMap} alt="" className="w-[20px] h-[20px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>Location</span>
                    <span className="text-[16px] font-semibold text-[#0d2138] leading-[24px] tracking-[-0.16px] whitespace-nowrap" style={{ fontFamily: montserrat }}>San Francisco, CA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* badge pills */}
            <div className="flex flex-wrap gap-[10px] items-center">
              <span className="bg-[#f8fafc] border border-[#d1d5dc] flex items-center gap-[4px] h-[32px] px-[13px] rounded-[10px] text-[14px] text-[#1e4f86] leading-[22px] tracking-[-0.14px] whitespace-nowrap" style={{ fontFamily: poppins }}>Active Buyer</span>
              <span className="bg-[#f8fafc] border border-[#d1d5dc] flex items-center gap-[4px] h-[32px] px-[13px] rounded-[10px] text-[14px] text-[#1e4f86] font-medium leading-[20px] tracking-[-0.14px] whitespace-nowrap" style={{ fontFamily: montserrat }}>Verified Account</span>
              <span className="bg-white border border-[#d1d5dc] flex items-center gap-[4px] h-[32px] px-[13px] rounded-[10px] text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px] whitespace-nowrap" style={{ fontFamily: montserrat }}>3 Saved Properties</span>
              <span className="bg-white border border-[#d1d5dc] flex items-center gap-[4px] h-[32px] px-[13px] rounded-[10px] text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px] whitespace-nowrap" style={{ fontFamily: montserrat }}>2 Active Inquiries</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Tabs + Saved Properties ─── */
const tabs = ["Saved Properties", "My Contracts", "Scheduled tours"] as const;
type Tab = (typeof tabs)[number];

function SavedPropertiesSection() {
  const [activeTab, setActiveTab] = useState<Tab>("Saved Properties");
  const savedPhotos = propPhotos.slice(0, 6);

  return (
    <section className="max-w-[1440px] mx-auto px-6 lg:px-[76px] py-[48px]">
      <div className="flex flex-col">
        <div className="flex items-center gap-[8px]">
          {tabs.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-[8px] px-[20px] py-[9px] rounded-tl-[8px] rounded-tr-[8px] transition-colors ${isActive ? "bg-[#f3f4f6] border-b-2 border-[#6889ae]" : ""}`}
              >
                <span className={`text-[18px] leading-[26px] tracking-[-0.18px] whitespace-nowrap ${isActive ? "text-[#15385f] font-medium" : "text-[#6a7282]"}`} style={{ fontFamily: poppins }}>
                  {tab}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-px bg-[#e5e7eb] w-full" />
      </div>

      <div className="mt-[24px]">
        {activeTab === "Saved Properties" && (
          <div className="flex flex-col gap-[24px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
              {savedPhotos.slice(0, 3).map((photo, i) => <PropertyCard key={i} photo={photo} />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
              {savedPhotos.slice(3, 6).map((photo, i) => <PropertyCard key={i + 3} photo={photo} />)}
            </div>
          </div>
        )}
        {activeTab === "My Contracts" && (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-[#6a7282] text-[16px]" style={{ fontFamily: montserrat }}>No contracts found.</p>
          </div>
        )}
        {activeTab === "Scheduled tours" && (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-[#6a7282] text-[16px]" style={{ fontFamily: montserrat }}>No scheduled tours.</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Recently Viewed ─── */
function RecentlyViewed() {
  const recentPhotos = propPhotos.slice(0, 3);
  return (
    <section className="max-w-[1440px] mx-auto px-6 lg:px-[76px] py-[48px] flex flex-col gap-[48px]">
      <p className="text-[44px] font-semibold text-[#0d2138] leading-[56px] tracking-[-0.44px] text-center" style={{ fontFamily: poppins }}>
        Recently Viewed
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[27px]">
        {recentPhotos.map((photo, i) => <PropertyCard key={i} photo={photo} />)}
      </div>
    </section>
  );
}

/* ─── main export ─── */
export function UserProfilePageContent() {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <ProfileHero onEditClick={() => setIsEditOpen(true)} />
      <SavedPropertiesSection />
      <RecentlyViewed />
      {isEditOpen && <EditProfileModal onClose={() => setIsEditOpen(false)} />}
    </>
  );
}
