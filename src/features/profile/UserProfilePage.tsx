"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { logoutAction } from "@/features/auth/actions";
import { EditProfileModal } from "./EditProfileModal";
import type { Profile } from "@/generated/prisma/client";
import {
  UserRound,
  BadgeCheck,
  Bookmark,
  MessageSquare,
  Heart, FileText, MapPin
} from "lucide-react";

/* ─── assets ─── */
const clouds =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/224a1a87c6d1fc7b05e65142626032911210d860.png";
const heroBg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg2.png";
const heroOverlay = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg.png";
const iconEmail = "/assets/figma-temp/UserProfile/email.svg";
const iconPhone = "/assets/figma-temp/UserProfile/phone.svg";
const iconMap = "/assets/figma-temp/UserProfile/location.svg";
const iconEdit = "/assets/figma-temp/UserProfile/icon-edit.svg";
const iconHeart = "/assets/figma-temp/UserProfile/Heart.svg";
const iconSqft = "/assets/figma-temp/UserProfile/icon-sqft.svg";
const iconBed = "/assets/figma-temp/UserProfile/icon-bed.svg";
const iconBath = "/assets/figma-temp/UserProfile/icon-bath.svg";
const iconLocation = "/assets/figma-temp/UserProfile/icon-location.svg";
/* inline SVG icons (Figma asset downloads were blank for these small icons) */

const propPhotos = [
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-7.png",
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-8.png",
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-9.png",
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-1.png",
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-5.png",
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/listing-4.png",
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
    <div className="flex w-full flex-col items-start gap-[16px] sm:gap-[18px] lg:gap-[20px]">
      <div className="relative h-[220px] w-full shrink-0 overflow-hidden rounded-[14px] sm:h-[260px] sm:rounded-[16px] lg:h-[296px]">
        <img src={photo} alt="Property" className="absolute inset-0 w-full h-full object-cover" />
        <button
          onClick={() => setSaved((s) => !s)}
          className="absolute right-[12px] top-[12px] flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white shadow-sm sm:right-[16px] sm:top-[16px]"
        >
          <img src={iconHeart} alt="Save" className={`w-[16px] h-[16px] ${saved ? "opacity-100" : "opacity-60"}`} />
        </button>
        <div className="absolute left-[12px] top-[12px] flex flex-wrap gap-[4px] sm:left-[16px] sm:top-[16px]">
          <span className="rounded-[36px] bg-white bg-opacity-90 px-[10px] py-[3px] text-[12px] leading-[18px] tracking-[-0.12px] text-[#0d2138] sm:px-[12px] sm:py-[4px] sm:text-[14px] sm:leading-[20px] sm:tracking-[-0.14px]" style={{ fontFamily: montserrat }}>{tag1}</span>
          <span className="rounded-[36px] bg-white bg-opacity-90 px-[10px] py-[3px] text-[12px] leading-[18px] tracking-[-0.12px] text-[#0d2138] sm:px-[12px] sm:py-[4px] sm:text-[14px] sm:leading-[20px] sm:tracking-[-0.14px]" style={{ fontFamily: montserrat }}>{tag2}</span>
        </div>
      </div>

      <div className="flex flex-col gap-[10px] items-start w-full">
        <div className="flex w-full flex-col items-start gap-[8px] border-b border-[#e5e7eb] pb-[10px] sm:flex-row sm:justify-between sm:gap-4">
          <div className="flex flex-col gap-[2px]">
            <p className="max-w-full truncate text-[18px] font-medium leading-[28px] tracking-[-0.18px] text-[#0d2138] sm:max-w-[260px] sm:text-[18px] sm:leading-[32px] sm:tracking-[-0.2px]" style={{ fontFamily: poppins }}>
              Coastal Modern Residence
            </p>
            <div className="flex gap-[4px] items-center">
              <img src={iconLocation} alt="" className="w-[16px] h-[16px] shrink-0" />
              <p className="max-w-[230px] truncate text-[13px] leading-[19px] tracking-[-0.13px] text-[#0d2138] sm:max-w-[160px] sm:text-[14px] sm:leading-[20px] sm:tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
                Bayshore Gardens, Tampa, FL
              </p>
            </div>
          </div>
          <p className="shrink-0 whitespace-nowrap text-left text-[17px] font-semibold leading-[24px] tracking-[-0.17px] text-[#2b3038] sm:text-right sm:text-[17px] sm:leading-[26px] sm:tracking-[-0.18px]" style={{ fontFamily: poppins }}>
            $8,500,000
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-[16px] gap-y-[8px] sm:gap-[20px]">
          <div className="flex items-center gap-[6px] sm:gap-[8px]">
            <img src={iconSqft} alt="" className="w-[20px] h-[20px] shrink-0" />
            <span className="text-[14px] text-[#2b3038] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>680 sq.ft</span>
          </div>
          <div className="flex items-center gap-[6px] sm:gap-[8px]">
            <img src={iconBed} alt="" className="w-[20px] h-[20px] shrink-0" />
            <span className="text-[14px] text-[#2b3038] leading-[20px] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>3 Bed</span>
          </div>
          <div className="flex items-center gap-[6px] sm:gap-[8px]">
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
   <section className="relative min-h-[488px] overflow-hidden border-b border-black/10">
  {/* Main background */}
  <div className="absolute inset-0 overflow-hidden">
    <img
      src={heroBg}
      alt=""
      className="absolute -top-[10%] h-[110%] w-full object-cover"
    />
  </div>

  {/* Main light gradient */}
  <div
    className="absolute inset-0"
    style={{
      background:
        "linear-gradient(to bottom, rgba(167,189,221,0.97) 0%, rgba(255,255,255,0.77) 45%, white 63%)",
    }}
  />

  {/* Clouds */}
  <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
    <img
      src={clouds}
      alt=""
      className="absolute h-full w-full object-cover"
    />
  </div>

  {/* Bottom blue gradient */}
  <div
    className="absolute inset-0"
    style={{
      background:
        "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #EDF6FF 100%)",
    }}
  />

  {/* Profile content */}
  <div className="relative z-10 mx-auto max-w-[1440px] px-4 pb-[40px] pt-[36px] sm:px-6 sm:pb-[50px] sm:pt-[48px] lg:px-[76px] lg:pb-[60px] lg:pt-[87px]">
    <div className="flex flex-col items-center gap-[24px] sm:gap-[32px] lg:flex-row lg:items-start lg:gap-[60px]">
      {/* Avatar card */}
      <div className="relative h-[170px] w-[170px] shrink-0 overflow-hidden rounded-[16px] bg-white sm:h-[210px] sm:w-[210px] lg:h-[243px] lg:w-[244px]">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={displayName}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={onEditClick}
            className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 bg-[#f8fafc] transition-colors hover:bg-[#f1f5f9]"
          >
            <span
              className="flex size-16 items-center justify-center rounded-full bg-[#1f5b97] text-[24px] font-semibold text-white"
              style={{ fontFamily: poppins }}
            >
              {initialsOf(displayName)}
            </span>

            <span
              className="flex items-center gap-1.5 text-[14px] font-medium text-[#1e4f86]"
              style={{ fontFamily: montserrat }}
            >
              <IconUpload />
              Add Photo
            </span>
          </button>
        )}
      </div>

      {/* Profile information */}
      <div className="flex w-full min-w-0 flex-1 flex-col gap-[20px] sm:gap-[24px]">
        <div className="flex flex-col gap-[20px] sm:gap-[24px] lg:gap-[28px]">
          <div className="relative flex flex-col gap-[8px]">
            <p
              className="break-words pr-0 text-center text-[26px] font-semibold leading-[34px] tracking-[-0.3px] text-[#0d2138] sm:text-[34px] sm:leading-[44px] lg:pr-[150px] lg:text-left lg:text-[40px] lg:leading-[52px]"
              style={{ fontFamily: poppins }}
            >
              {displayName}
            </p>

            <p
              className="text-center text-[14px] leading-[22px] tracking-[-0.14px] text-[#6a7282] sm:text-[17px] sm:leading-[26px] lg:text-left lg:text-[18px]"
              style={{ fontFamily: poppins }}
            >
              Premium Member · Joined {joinedLabel}
            </p>

            <div className="mt-2 flex items-center justify-center lg:absolute lg:right-0 lg:top-0 lg:mt-0 lg:justify-start">
              <button
                type="button"
                onClick={onEditClick}
                className="flex h-[42px] w-full items-center justify-center gap-[8px] rounded-[12px] border border-[#d1d5dc] bg-white px-[16px] transition-colors hover:bg-[#f8fafc] sm:w-auto lg:h-[44px]"
              >
                <img
                  src={iconEdit}
                  alt=""
                  className="h-[16px] w-[16px]"
                />

                <span
                  className="whitespace-nowrap text-[14px] font-medium leading-[20px] tracking-[-0.14px] text-[#0d2138]"
                  style={{ fontFamily: montserrat }}
                >
                  Edit Profile
                </span>
              </button>
            </div>
          </div>

          {/* Information tiles */}
          <div className="grid grid-cols-1 gap-[8px] sm:grid-cols-2 xl:grid-cols-3">
            <div className="flex h-[76px] min-w-0 items-center gap-[12px] rounded-[14px] bg-white px-[16px]">
              <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-[rgba(72,150,182,0.16)]">
                <img
                  src={iconEmail}
                  alt=""
                  className="h-[20px] w-[20px]"
                />
              </div>

              <div className="flex min-w-0 flex-col">
                <span
                  className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282]"
                  style={{ fontFamily: montserrat }}
                >
                  Email
                </span>

                <span
                  className="truncate text-[16px] font-semibold leading-[24px] tracking-[-0.16px] text-[#0d2138]"
                  style={{ fontFamily: montserrat }}
                >
                  {profile.email}
                </span>
              </div>
            </div>

            <div className="flex h-[76px] min-w-0 items-center gap-[12px] rounded-[14px] bg-white px-[16px]">
              <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-[rgba(72,150,182,0.16)]">
                <img
                  src={iconPhone}
                  alt=""
                  className="h-[20px] w-[20px]"
                />
              </div>

              <div className="flex min-w-0 flex-col">
                <span
                  className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282]"
                  style={{ fontFamily: montserrat }}
                >
                  Phone
                </span>

                {profile.phone ? (
                  <span
                    className="truncate text-[16px] font-semibold leading-[24px] tracking-[-0.16px] text-[#0d2138]"
                    style={{ fontFamily: montserrat }}
                  >
                    {profile.phone}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onEditClick}
                    className="text-left text-[14px] font-medium leading-[24px] text-[#1e4f86] hover:underline"
                    style={{ fontFamily: montserrat }}
                  >
                    Add phone number
                  </button>
                )}
              </div>
            </div>

            <div className="flex h-[76px] min-w-0 items-center gap-[12px] rounded-[14px] bg-white px-[16px] sm:col-span-2 xl:col-span-1">
              <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-[rgba(72,150,182,0.16)]">
                <img
                  src={iconMap}
                  alt=""
                  className="h-[20px] w-[20px]"
                />
              </div>

              <div className="flex min-w-0 flex-col">
                <span
                  className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282]"
                  style={{ fontFamily: montserrat }}
                >
                  Location
                </span>

                {locationLabel ? (
                  <span
                    className="truncate text-[16px] font-semibold leading-[24px] tracking-[-0.16px] text-[#0d2138]"
                    style={{ fontFamily: montserrat }}
                  >
                    {locationLabel}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onEditClick}
                    className="text-left text-[14px] font-medium leading-[24px] text-[#1e4f86] hover:underline"
                    style={{ fontFamily: montserrat }}
                  >
                    Add location
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Badge pills */}
        <div className="flex flex-wrap items-center justify-center gap-[8px] sm:gap-[10px] lg:justify-start">
          <span
            className="flex h-[32px] items-center gap-[6px] whitespace-nowrap rounded-[10px] border border-[#d1d5dc] bg-[#f8fafc] px-[13px] text-[14px] leading-[22px] tracking-[-0.14px] text-[#1e4f86]"
            style={{ fontFamily: poppins }}
          >
            <UserRound size={16} strokeWidth={1.8} />
            Active Buyer
          </span>

          <span
            className="flex h-[32px] items-center gap-[6px] whitespace-nowrap rounded-[10px] border border-[#d1d5dc] bg-[#f8fafc] px-[13px] text-[14px] font-medium leading-[20px] tracking-[-0.14px] text-[#1e4f86]"
            style={{ fontFamily: montserrat }}
          >
            <BadgeCheck size={16} strokeWidth={1.8} />
            Verified Account
          </span>

          <span
            className="flex h-[32px] items-center gap-[6px] whitespace-nowrap rounded-[10px] border border-[#d1d5dc] bg-white px-[13px] text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282]"
            style={{ fontFamily: montserrat }}
          >
            <Bookmark size={16} strokeWidth={1.8} />
            3 Saved Properties
          </span>

          <span
            className="flex h-[32px] items-center gap-[6px] whitespace-nowrap rounded-[10px] border border-[#d1d5dc] bg-white px-[13px] text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282]"
            style={{ fontFamily: montserrat }}
          >
            <MessageSquare size={16} strokeWidth={1.8} />
            2 Active Inquiries
          </span>
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
    <section className="mx-auto max-w-[1440px] px-4 py-[32px] sm:px-6 sm:py-[40px] lg:px-[76px] lg:py-[48px]">
      <div className="flex flex-col">
  <div className="flex w-full items-center gap-[4px] overflow-x-auto pb-[2px] sm:gap-[8px]">
    {tabs.map((tab) => {
      const isActive = tab === activeTab;

      const TabIcon =
        tab === "Saved Properties"
          ? Heart
          : tab === "My Contracts"
            ? FileText
            : MapPin;

      return (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex shrink-0 items-center gap-[6px] rounded-tl-[8px] rounded-tr-[8px] px-[12px] py-[8px] transition-colors sm:gap-[8px] sm:px-[16px] lg:px-[20px] lg:py-[9px] ${
            isActive
              ? "bg-[#f3f4f6] border-b-2 border-[#6889ae]"
              : ""
          }`}
        >
          <TabIcon
            size={20}
            strokeWidth={1.8}
            className={isActive ? "text-[#15385f]" : "text-[#6a7282]"}
          />

          <span
            className={`whitespace-nowrap text-[14px] leading-[22px] tracking-[-0.14px] sm:text-[16px] sm:leading-[24px] lg:text-[18px] lg:leading-[26px] lg:tracking-[-0.18px] ${
              isActive
                ? "text-[#15385f] font-medium"
                : "text-[#6a7282]"
            }`}
            style={{ fontFamily: poppins }}
          >
            {tab}
          </span>
        </button>
      );
    })}
  </div>

  <div className="h-px bg-[#e5e7eb] w-full" />
</div>

      <div className="mt-[20px] sm:mt-[24px]">
        {activeTab === "Saved Properties" && (
          <div className="flex flex-col gap-[24px]">
            <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:grid-cols-3">
              {savedPhotos.slice(0, 3).map((photo, i) => <PropertyCard key={i} photo={photo} />)}
            </div>
            <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:grid-cols-3">
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
    <section className="mx-auto flex max-w-[1440px] flex-col gap-[28px] px-4 py-[32px] sm:gap-[36px] sm:px-6 sm:py-[40px] lg:gap-[48px] lg:px-[76px] lg:py-[48px]">
      <p className="text-center text-[30px] font-semibold leading-[40px] tracking-[-0.3px] text-[#0d2138] sm:text-[38px] sm:leading-[48px] lg:text-[44px] lg:leading-[56px] lg:tracking-[-0.44px]" style={{ fontFamily: poppins }}>
        Recently Viewed
      </p>
      <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:grid-cols-3 lg:gap-[27px]">
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
