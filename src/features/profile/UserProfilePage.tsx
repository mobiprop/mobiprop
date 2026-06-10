"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { logoutAction } from "@/features/auth/actions";
import { EditProfileModal } from "./EditProfileModal";
import type { Profile } from "@/generated/prisma/client";

/* ─── assets ─── */
const heroBg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg2.png";
const heroOverlay = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg.png";
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

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ─── Inline SVG icons (Figma small asset downloads were blank) ─── */
function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.667 11.333v1.334A1.333 1.333 0 0 0 4 14h8a1.333 1.333 0 0 0 1.333-1.333v-1.334M10.667 5.333 8 2.667 5.333 5.333M8 2.667v8" stroke="#0d2138" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
function ProfileHero({ profile, onEditClick }: { profile: Profile; onEditClick: () => void }) {
  const displayName = profile.fullName?.trim() || profile.email;
  const joinedLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(profile.createdAt);
  const locationLabel = [profile.city, profile.country].filter(Boolean).join(", ");

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
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={displayName}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <button
                type="button"
                onClick={onEditClick}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3 bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors"
              >
                <span className="size-16 rounded-full bg-[#1f5b97] text-white flex items-center justify-center text-[24px] font-semibold" style={{ fontFamily: poppins }}>
                  {initialsOf(displayName)}
                </span>
                <span className="flex items-center gap-1.5 text-[14px] font-medium text-[#1e4f86]" style={{ fontFamily: montserrat }}>
                  <IconUpload />
                  Add Photo
                </span>
              </button>
            )}
          </div>

          {/* info */}
          <div className="flex flex-col gap-[24px] flex-1">
            <div className="flex flex-col gap-[28px]">
              <div className="relative flex flex-col gap-[8px]">
                <p className="text-[40px] font-semibold text-[#0d2138] leading-[52px] tracking-[-0.4px]" style={{ fontFamily: poppins }}>
                  {displayName}
                </p>
                <p className="text-[18px] text-[#6a7282] leading-[26px] tracking-[-0.18px]" style={{ fontFamily: poppins }}>
                  Premium Member · Joined {joinedLabel}
                </p>

                {/* Edit Profile + Logout buttons */}
                <div className="absolute right-0 top-0 flex items-center gap-[8px]">
                  <button
                    onClick={onEditClick}
                    className="flex items-center gap-[8px] h-[44px] px-[16px] border border-[#d1d5dc] rounded-[12px] bg-white hover:bg-[#f8fafc] transition-colors"
                  >
                    <img src={iconEdit} alt="" className="w-[16px] h-[16px]" />
                    <span className="text-[14px] font-medium text-[#0d2138] leading-[20px] tracking-[-0.14px] whitespace-nowrap" style={{ fontFamily: montserrat }}>
                      Edit Profile
                    </span>
                  </button>
                </div>
              </div>

              {/* info tiles */}
              <div className="flex flex-wrap gap-[8px]">
                <div className="bg-white rounded-[14px] flex items-center gap-[12px] h-[76px] px-[16px] w-[293px]">
                  <div className="bg-[rgba(72,150,182,0.16)] rounded-[10px] w-[40px] h-[40px] flex items-center justify-center shrink-0">
                    <img src={iconEmail} alt="" className="w-[20px] h-[20px]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>Email</span>
                    <span className="text-[16px] font-semibold text-[#0d2138] leading-[24px] tracking-[-0.16px] truncate" style={{ fontFamily: montserrat }}>{profile.email}</span>
                  </div>
                </div>

                <div className="bg-white rounded-[14px] flex items-center gap-[12px] h-[76px] px-[16px] w-[293px]">
                  <div className="bg-[rgba(72,150,182,0.16)] rounded-[10px] w-[40px] h-[40px] flex items-center justify-center shrink-0">
                    <img src={iconPhone} alt="" className="w-[20px] h-[20px]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>Phone</span>
                    {profile.phone ? (
                      <span className="text-[16px] font-semibold text-[#0d2138] leading-[24px] tracking-[-0.16px] whitespace-nowrap" style={{ fontFamily: montserrat }}>{profile.phone}</span>
                    ) : (
                      <button type="button" onClick={onEditClick} className="text-left text-[14px] font-medium text-[#1e4f86] leading-[24px] tracking-[-0.14px] hover:underline whitespace-nowrap" style={{ fontFamily: montserrat }}>
                        Add phone number
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-[14px] flex items-center gap-[12px] h-[76px] px-[16px] w-[293px]">
                  <div className="bg-[rgba(72,150,182,0.16)] rounded-[10px] w-[40px] h-[40px] flex items-center justify-center shrink-0">
                    <img src={iconMap} alt="" className="w-[20px] h-[20px]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>Location</span>
                    {locationLabel ? (
                      <span className="text-[16px] font-semibold text-[#0d2138] leading-[24px] tracking-[-0.16px] whitespace-nowrap" style={{ fontFamily: montserrat }}>{locationLabel}</span>
                    ) : (
                      <button type="button" onClick={onEditClick} className="text-left text-[14px] font-medium text-[#1e4f86] leading-[24px] tracking-[-0.14px] hover:underline whitespace-nowrap" style={{ fontFamily: montserrat }}>
                        Add location
                      </button>
                    )}
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
export function UserProfilePageContent({ profile: initialProfile }: { profile: Profile }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleSaved = (updated: Profile) => {
    setProfile(updated);
    router.refresh();
  };

  return (
    <>
      <ProfileHero profile={profile} onEditClick={() => setIsEditOpen(true)} />
      <SavedPropertiesSection />
      <RecentlyViewed />
      {isEditOpen && (
        <EditProfileModal profile={profile} onClose={() => setIsEditOpen(false)} onSaved={handleSaved} />
      )}
    </>
  );
}
