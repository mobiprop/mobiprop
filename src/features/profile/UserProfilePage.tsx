"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { EditProfileModal } from "./EditProfileModal";
import type { Profile } from "@/generated/prisma/client";
import {
  UserRound,
  BadgeCheck,
  Bookmark,
  MessageSquare,
  Heart, FileText, Calendar,
  Download,
} from "lucide-react";
import { useMyToursQuery, useMyContractsQuery } from "@/hooks/queries/useDashboardToursQuery";
import { useCancelMyTourMutation } from "@/hooks/mutations/useTourMutations";
import type { MyTourDto } from "@/features/crm/types/crm-dto";
import type { MyContractDto } from "@/features/integrations/docusign-actions";
import { TOUR_STATUS_BADGE, CONTRACT_STATUS_BADGE } from "@/features/crm/tour-status-badge";
import { format } from "date-fns";
import type { Currency } from "@/generated/prisma/enums";
import { PropertyCard, type PropertyCardData } from "@/features/listings/components/PropertyCard";

/* ─── assets ─── */
const clouds =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/224a1a87c6d1fc7b05e65142626032911210d860.webp";
const heroBg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg2.webp";
const iconEmail = "/assets/figma-temp/UserProfile/email.svg";
const iconPhone = "/assets/figma-temp/UserProfile/phone.svg";
const iconMap = "/assets/figma-temp/UserProfile/location.svg";
const iconEdit = "/assets/figma-temp/UserProfile/icon-edit.svg";
const iconSqft = "/assets/figma-temp/UserProfile/icon-sqft.svg";
const iconBed = "/assets/figma-temp/UserProfile/icon-bed.svg";
const iconBath = "/assets/figma-temp/UserProfile/icon-bath.svg";
const iconLocation = "/assets/figma-temp/UserProfile/icon-location.svg";

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

/* ─── Saved property type ─── */
type SavedListing = {
  id: string;
  slug: string;
  title: string;
  location: string;
  type: string;
  operationType: string;
  salePrice: number | null;
  rentPrice: number | null;
  saleCurrency: Currency;
  rentCurrency: Currency;
  bedrooms: number | null;
  bathrooms: number | null;
  totalAreaM2: number | null;
  coverImageUrl: string | null;
  savedAt: string;
};

function SavedCard({ listing, onRemove }: { listing: SavedListing; onRemove: (id: string) => void }) {
  return <PropertyCard property={{...listing, listingId:listing.id, operationType:listing.operationType as PropertyCardData["operationType"]}} savedOverride onToggleSaved={() => onRemove(listing.id)} />;
}

/* ─── Hero / Profile Card ─── */
function ProfileHero({ profile, onEditClick, savedCount }: { profile: Profile; onEditClick: () => void; savedCount: number }) {
  const { t, i18n } = useTranslation("accountProfile");
  const displayName = profile.fullName?.trim() || profile.email;
  const joinedLabel = new Intl.DateTimeFormat(i18n.language === "es" ? "es-AR" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(profile.createdAt);
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
  <div className="relative z-10 mx-auto max-w-[var(--space-fluid-container-max)] px-4 pb-[40px] pt-[36px] sm:px-6 sm:pb-[50px] sm:pt-[48px] lg:px-[76px] lg:pb-[60px] lg:pt-[87px]">
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
              {t("hero.addPhoto")}
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
              {t("hero.premiumMemberJoined", { date: joinedLabel })}
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
                  {t("hero.editProfile")}
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
                  {t("hero.emailLabel")}
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
                  {t("hero.phoneLabel")}
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
                    {t("hero.addPhoneNumber")}
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
                  {t("hero.locationLabel")}
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
                    {t("hero.addLocation")}
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
            {t("hero.activeBuyer")}
          </span>

          <span
            className="flex h-[32px] items-center gap-[6px] whitespace-nowrap rounded-[10px] border border-[#d1d5dc] bg-[#f8fafc] px-[13px] text-[14px] font-medium leading-[20px] tracking-[-0.14px] text-[#1e4f86]"
            style={{ fontFamily: montserrat }}
          >
            <BadgeCheck size={16} strokeWidth={1.8} />
            {t("hero.verifiedAccount")}
          </span>

          <span
            className="flex h-[32px] items-center gap-[6px] whitespace-nowrap rounded-[10px] border border-[#d1d5dc] bg-white px-[13px] text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282]"
            style={{ fontFamily: montserrat }}
          >
            <Bookmark size={16} strokeWidth={1.8} />
            {t("hero.savedProperty", { count: savedCount })}
          </span>

          <span
            className="flex h-[32px] items-center gap-[6px] whitespace-nowrap rounded-[10px] border border-[#d1d5dc] bg-white px-[13px] text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282]"
            style={{ fontFamily: montserrat }}
          >
            <MessageSquare size={16} strokeWidth={1.8} />
            {t("hero.activeInquiries", { count: 2 })}
          </span>
        </div>
      </div>
    </div>
  </div>
</section>
  );
}

/* ─── Tabs + Saved Properties ─── */
// Stable English values drive `activeTab` state/comparisons; the rendered
// label comes from the "accountProfile" i18n namespace via TAB_I18N_KEY.
const tabs = ["Saved Properties", "My Contracts", "Scheduled tours"] as const;
type Tab = (typeof tabs)[number];
const TAB_I18N_KEY: Record<Tab, string> = {
  "Saved Properties": "tabs.savedProperties",
  "My Contracts": "tabs.myContracts",
  "Scheduled tours": "tabs.scheduledTours",
};

function TourCard({ tour, onCancel }: { tour: MyTourDto; onCancel: (id: string) => void }) {
  const { t } = useTranslation("accountProfile");
  const badge = TOUR_STATUS_BADGE[tour.status];
  const isTerminal = tour.status === "COMPLETED" || tour.status === "CANCELLED" || tour.status === "NO_SHOW";
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calendar size={16} color="#4f46e5" />
          <span className="text-[14px] font-semibold text-[#0d2138]" style={{ fontFamily: montserrat }}>
            {format(new Date(tour.scheduledAt), "MMM d, yyyy")}
          </span>
          <span className="text-[13px] text-[#6b7280]" style={{ fontFamily: montserrat }}>
            {format(new Date(tour.scheduledAt), "h:mm a")} · {t("tours.durationMinutes", { count: tour.durationMinutes })}
          </span>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.text, fontFamily: montserrat }}>
          {t(`dashboard:tourStatus.${tour.status}`, { defaultValue: badge.label })}
        </span>
      </div>
      {tour.property && (
        <a href={`/listings/${tour.property.slug}`} className="flex items-start gap-3 hover:opacity-80 transition-opacity">
          {tour.property.coverUrl && (
            <img src={tour.property.coverUrl} alt={tour.property.title} className="w-16 h-12 rounded-[8px] object-cover shrink-0" />
          )}
          <div>
            <p className="text-[13px] font-medium text-[#0d2138]" style={{ fontFamily: montserrat }}>{tour.property.title}</p>
            <p className="text-[11px] text-[#9ca3af]" style={{ fontFamily: montserrat }}>{tour.property.location}</p>
          </div>
        </a>
      )}
      {tour.assignedAgent && (
        <p className="text-[12px] text-[#6b7280]" style={{ fontFamily: montserrat }}>
          {t("tours.agentLabel")} <span className="font-medium text-[#0d2138]">{tour.assignedAgent.fullName ?? tour.assignedAgent.email}</span>
        </p>
      )}
      {tour.cancellationReason && (
        <p className="text-[12px] text-[#dc2626]" style={{ fontFamily: montserrat }}>{t("tours.reasonLabel")} {tour.cancellationReason}</p>
      )}
      {!isTerminal && (
        <button
          onClick={() => onCancel(tour.id)}
          className="self-start text-[12px] text-[#dc2626] hover:underline"
          style={{ fontFamily: montserrat }}
        >
          {t("tours.cancelTour")}
        </button>
      )}
    </div>
  );
}

function ContractCard({ contract }: { contract: MyContractDto }) {
  const { t } = useTranslation("accountProfile");
  const badge = CONTRACT_STATUS_BADGE[contract.status];
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[16px] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText size={16} color="#4f46e5" />
          <span className="text-[14px] font-semibold text-[#0d2138]" style={{ fontFamily: montserrat }}>
            {contract.templateName}
          </span>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.text, fontFamily: montserrat }}>
          {t(`dashboard:envelopeStatus.${contract.status}`, { defaultValue: badge.label })}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6b7280]" style={{ fontFamily: montserrat }}>
        <span>{t("contracts.sent", { date: format(new Date(contract.sentAt), "MMM d, yyyy") })}</span>
        {contract.completedAt && <span>{t("contracts.signed", { date: format(new Date(contract.completedAt), "MMM d, yyyy") })}</span>}
        {contract.role && <span>{t("contracts.roleLabel")} <span className="font-medium text-[#0d2138]">{t(`contracts.role.${contract.role}`)}</span></span>}
        {contract.opportunityNumber && <span>{t("contracts.opportunityLabel")} <span className="font-medium text-[#0d2138]">{contract.opportunityNumber}</span></span>}
      </div>
      {contract.propertyReference && (
        <p className="text-[12px] text-[#6b7280]" style={{ fontFamily: montserrat }}>{contract.propertyReference}</p>
      )}
      {contract.documentUrl && (
        <a
          href={contract.documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={contract.documentFileName ?? undefined}
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-medium text-[#4f46e5] hover:underline"
          style={{ fontFamily: montserrat }}
        >
          <Download size={13} /> {t("contracts.viewDownload")}
        </a>
      )}
    </div>
  );
}

function SavedPropertiesSection({
  listings,
  isLoading,
  onRemove,
  profileId,
}: {
  listings: SavedListing[];
  isLoading: boolean;
  onRemove: (id: string) => void;
  profileId: string;
}) {
  const { t } = useTranslation("accountProfile");
  const [activeTab, setActiveTab] = useState<Tab>("Saved Properties");
  const { data: toursData, isLoading: toursLoading } = useMyToursQuery(profileId);
  const cancelTour = useCancelMyTourMutation(profileId);
  const tours = toursData ?? [];
  const { data: contractsData, isLoading: contractsLoading } = useMyContractsQuery(profileId);
  const contracts = contractsData ?? [];

  return (
    <section className="property-section-container py-[32px] sm:py-[40px] lg:py-[48px]">
      {/* Tab bar */}
      <div className="flex flex-col">
        <div className="flex w-full items-center gap-[4px] overflow-x-auto pb-[2px] sm:gap-[8px]">
          {tabs.map((tab) => {
            const isActive = tab === activeTab;
            const TabIcon =
              tab === "Saved Properties" ? Heart : tab === "My Contracts" ? FileText : Calendar;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex shrink-0 items-center gap-[6px] rounded-tl-[8px] rounded-tr-[8px] px-[12px] py-[8px] transition-colors sm:gap-[8px] sm:px-[16px] lg:px-[20px] lg:py-[9px] ${
                  isActive ? "bg-[#f3f4f6] border-b-2 border-[#6889ae]" : ""
                }`}
              >
                <TabIcon
                  size={20}
                  strokeWidth={1.8}
                  className={isActive ? "text-[#15385f]" : "text-[#6a7282]"}
                />
                <span
                  className={`whitespace-nowrap text-[14px] leading-[22px] sm:text-[16px] lg:text-[18px] ${
                    isActive ? "text-[#15385f] font-medium" : "text-[#6a7282]"
                  }`}
                  style={{ fontFamily: poppins }}
                >
                  {t(TAB_I18N_KEY[tab])}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-px bg-[#e5e7eb] w-full" />
      </div>

      {/* Tab content */}
      <div className="mt-[20px] sm:mt-[24px]">
        {activeTab === "Saved Properties" && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-4 animate-pulse">
                    <div className="h-[260px] w-full rounded-[16px] bg-[#eef1f5]" />
                    <div className="h-5 w-2/3 rounded bg-[#eef1f5]" />
                    <div className="h-4 w-1/2 rounded bg-[#eef1f5]" />
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f4f6]">
                  <Heart size={28} className="text-[#d1d5dc]" />
                </div>
                <p className="text-[16px] text-[#6a7282]" style={{ fontFamily: montserrat }}>
                  {t("savedProperties.empty")}{" "}
                  <Link href="/listings" className="text-[#1a4878] hover:underline">
                    {t("savedProperties.browseListings")}
                  </Link>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <SavedCard key={listing.id} listing={listing} onRemove={onRemove} />
                ))}
              </div>
            )}
          </>
        )}
        {activeTab === "My Contracts" && (
          <>
            {contractsLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="animate-pulse flex flex-col gap-4 w-full max-w-lg">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-[16px] bg-[#eef1f5]" />
                  ))}
                </div>
              </div>
            ) : contracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f4f6]">
                  <FileText size={28} className="text-[#d1d5dc]" />
                </div>
                <p className="text-[16px] text-[#6a7282]" style={{ fontFamily: montserrat }}>
                  {t("contracts.empty")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-w-2xl">
                {contracts.map((contract) => (
                  <ContractCard key={contract.id} contract={contract} />
                ))}
              </div>
            )}
          </>
        )}
        {activeTab === "Scheduled tours" && (
          <>
            {toursLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <div className="animate-pulse flex flex-col gap-4 w-full max-w-lg">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-[16px] bg-[#eef1f5]" />
                  ))}
                </div>
              </div>
            ) : tours.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f4f6]">
                  <Calendar size={28} className="text-[#d1d5dc]" />
                </div>
                <p className="text-[16px] text-[#6a7282]" style={{ fontFamily: montserrat }}>
                  {t("tours.empty")}{" "}
                  <Link href="/listings" className="text-[#1a4878] hover:underline">{t("tours.browseListingsToBook")}</Link> {t("tours.browseListingsToBookSuffix")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 max-w-2xl">
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} onCancel={(id) => cancelTour.mutate(id)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ─── main export ─── */
export function UserProfilePageContent({ profile: initialProfile }: { profile: Profile }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const savedKey = queryKeys.savedListingsPage();

  const { data, isLoading } = useQuery({
    queryKey: savedKey,
    queryFn: async () => {
      const res = await fetch("/api/saved-listings/list");
      if (!res.ok) return { listings: [] as SavedListing[] };
      return res.json() as Promise<{ listings: SavedListing[] }>;
    },
    staleTime: 2 * 60 * 1000,
  });
  const displayListings = data?.listings ?? [];

  const removeMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/saved-listings/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: savedKey });
      const previous = queryClient.getQueryData<{ listings: SavedListing[] }>(savedKey);
      queryClient.setQueryData<{ listings: SavedListing[] }>(savedKey, (old) => ({
        listings: (old?.listings ?? []).filter((l) => l.id !== id),
      }));
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(savedKey, context.previous);
    },
  });

  const handleRemove = (id: string) => removeMutation.mutate(id);

  const handleSaved = (updated: Profile) => {
    setProfile(updated);
    router.refresh();
  };

  return (
    <>
      <ProfileHero
        profile={profile}
        onEditClick={() => setIsEditOpen(true)}
        savedCount={displayListings.length}
      />
      <SavedPropertiesSection
        listings={displayListings}
        isLoading={isLoading}
        onRemove={handleRemove}
        profileId={profile.id}
      />
      {isEditOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setIsEditOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
