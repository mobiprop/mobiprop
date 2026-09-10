"use client";

import { useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { useSavedListings } from "@/hooks/useSavedListings";
import { LoginPromptModal } from "@/components/modals/LoginPromptModal";
import { ScheduleTourModal } from "./ScheduleTourModal";
import { ImageLightbox } from "./ImageLightbox";
import svgPaths from "./singleListingSvgPaths";
import type { PublicListingAgent } from "../listing-actions";
import type { ListingImageDto, PublicListingDto } from "../types/listing-dto";
import type { AmenityKey } from "@/schemas/listing.schema";
import { AMENITY_OPTIONS } from "@/schemas/listing.schema";
import {
  formatRentPrice,
  formatSalePrice,
  propertyTypeLabel,
} from "../utils/format";
import { PropertyLocationMap } from "@/components/maps/PropertyLocationMap";

// Below this native pixel size on its shorter side, stretching a photo across
// the full-bleed hero box (object-cover) would upscale it noticeably — many
// WordPress-migrated photos are this small. Below the threshold we letterbox
// (object-contain on a blurred backdrop) instead of forcing the crop.
const HERO_MIN_SAFE_DIMENSION = 800;

function isHeroUnsafe(image: Pick<ListingImageDto, "width" | "height"> | null): boolean {
  if (!image || image.width === null || image.height === null) return false;
  return Math.min(image.width, image.height) < HERO_MIN_SAFE_DIMENSION;
}

const fallbackImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/SingleListingPage/property-1.webp";
const agentImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/SingleListingPage/emily.webp";
const footerBgImg =
  "/assets/figma-temp/SingleListingPage/3fba757107af3080a480784b8edf8f9a8a4c4646.png";

const amenityIcons: { key: AmenityKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "PARKING",
    label: "Parking",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d={svgPaths.p1d98b900}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p36e7a000}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M9 17H15"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p29835400}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "GARDEN",
    label: "Garden",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d={svgPaths.p360d1bb0}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M7.0002 16V22"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M13.0002 19V22"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p15de6d20}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "POOL",
    label: "Pool",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d={svgPaths.p23954e80}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p7d13a80}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p1597c000}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "GYM",
    label: "Gym",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M14.4001 14.4L9.6001 9.59998"
          stroke="#1E4F86"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.6569 21.4849C18.2819 21.8601 17.7732 22.0709 17.2428 22.071C16.7123 22.071 16.2035 21.8604 15.8284 21.4854C15.4533 21.1104 15.2424 20.6017 15.2423 20.0713C15.2423 19.5408 15.4529 19.032 15.8279 18.6569L14.0609 20.4249C13.6858 20.8 13.1769 21.0108 12.6464 21.0108C12.1159 21.0108 11.607 20.8 11.2319 20.4249C10.8568 20.0498 10.646 19.5409 10.646 19.0104C10.646 18.4799 10.8568 17.9711 11.2319 17.5959L17.5959 11.2319C17.9711 10.8568 18.4799 10.646 19.0104 10.646C19.5409 10.646 20.0498 10.8568 20.4249 11.2319C20.8 11.607 21.0108 12.1159 21.0108 12.6464C21.0108 13.1769 20.8 13.6858 20.4249 14.0609L18.6569 15.8279C19.032 15.4529 19.5408 15.2423 20.0713 15.2423C20.6017 15.2424 21.1104 15.4533 21.4854 15.8284C21.8604 16.2035 22.071 16.7123 22.071 17.2428C22.0709 17.7732 21.8601 18.2819 21.4849 18.6569L18.6569 21.4849Z"
          stroke="#1E4F86"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21.5001 21.5L20.1001 20.1"
          stroke="#1E4F86"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.90049 3.90012L2.50049 2.50012"
          stroke="#1E4F86"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.40376 12.768C6.02861 13.1432 5.5198 13.3539 4.98926 13.3539C4.45872 13.3539 3.94991 13.1432 3.57476 12.768C3.19961 12.3929 2.98886 11.884 2.98886 11.3535C2.98886 10.823 3.19961 10.3142 3.57476 9.93901L5.34276 8.17201C5.15701 8.3577 4.9365 8.50498 4.69382 8.60545C4.45115 8.70592 4.19106 8.7576 3.92841 8.75756C3.39796 8.75746 2.88928 8.54666 2.51426 8.17151C2.32857 7.98575 2.18129 7.76524 2.08082 7.52257C1.98035 7.27989 1.92866 7.0198 1.92871 6.75715C1.9288 6.22671 2.13961 5.71802 2.51476 5.34301L5.34276 2.51501C5.71778 2.13986 6.22646 1.92905 6.75691 1.92896C7.01956 1.92891 7.27965 1.9806 7.52232 2.08106C7.765 2.18153 7.98551 2.32882 8.17126 2.51451C8.35702 2.7002 8.50438 2.92065 8.60493 3.16329C8.70549 3.40593 8.75727 3.666 8.75731 3.92865C8.75736 4.1913 8.70567 4.45139 8.6052 4.69407C8.50474 4.93674 8.35745 5.15725 8.17176 5.34301L9.93876 3.57501C10.3139 3.19986 10.8227 2.9891 11.3533 2.9891C11.8838 2.9891 12.3926 3.19986 12.7678 3.57501C13.1429 3.95016 13.3537 4.45897 13.3537 4.98951C13.3537 5.52005 13.1429 6.02886 12.7678 6.40401L6.40376 12.768Z"
          stroke="#1E4F86"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "BALCONY",
    label: "Balcony",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M18 9L12 3L6 9"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M12 3V17"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M4.9998 21H18.9998"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "ELEVATOR",
    label: "Elevator",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M14.0003 10.6667L11.3337 13.3334L8.66699 10.6667"
          stroke="#1E4F86"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.333 13.3334V2.66675"
          stroke="#1E4F86"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 5.33341L4.66667 2.66675L7.33333 5.33341"
          stroke="#1E4F86"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.66699 2.66675V13.3334"
          stroke="#1E4F86"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "SECURITY",
    label: "Security",
    icon: (
      <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
        <path
          d={svgPaths.p2b59380}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "FURNISHED",
    label: "Furnished",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d={svgPaths.p10c26880}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.pbc36600}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M4.0002 18V20"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M19.9998 18V20"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d="M12 4.00005V13"
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "PET_FRIENDLY",
    label: "Pet Friendly",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d={svgPaths.p3835b200}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p2f030500}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.p2c5da200}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <path
          d={svgPaths.pfabe780}
          stroke="#1E4F86"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    key: "CREDIT_APPROVED",
    label: "Credit Approved",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <g clipPath="url(#clip0_1712_2678)">
          <path
            d="M2.5668 5.74657C2.46949 5.30825 2.48443 4.85246 2.61023 4.42146C2.73604 3.99046 2.96863 3.5982 3.28644 3.28105C3.60425 2.9639 3.997 2.73213 4.42827 2.60723C4.85953 2.48233 5.31535 2.46835 5.75346 2.56657C5.9946 2.18944 6.3268 1.87907 6.71943 1.66409C7.11206 1.44911 7.55249 1.33643 8.00013 1.33643C8.44776 1.33643 8.8882 1.44911 9.28083 1.66409C9.67346 1.87907 10.0057 2.18944 10.2468 2.56657C10.6856 2.46792 11.1422 2.48184 11.5741 2.60704C12.0061 2.73225 12.3994 2.96466 12.7174 3.28267C13.0354 3.60068 13.2678 3.99395 13.393 4.4259C13.5182 4.85786 13.5321 5.31446 13.4335 5.75324C13.8106 5.99437 14.121 6.32657 14.3359 6.7192C14.5509 7.11183 14.6636 7.55227 14.6636 7.9999C14.6636 8.44754 14.5509 8.88797 14.3359 9.2806C14.121 9.67323 13.8106 10.0054 13.4335 10.2466C13.5317 10.6847 13.5177 11.1405 13.3928 11.5718C13.2679 12.003 13.0361 12.3958 12.719 12.7136C12.4018 13.0314 12.0096 13.264 11.5786 13.3898C11.1476 13.5156 10.6918 13.5305 10.2535 13.4332C10.0126 13.8118 9.68018 14.1235 9.28688 14.3394C8.89358 14.5554 8.45215 14.6686 8.00346 14.6686C7.55478 14.6686 7.11335 14.5554 6.72004 14.3394C6.32674 14.1235 5.99429 13.8118 5.75346 13.4332C5.31535 13.5315 4.85953 13.5175 4.42827 13.3926C3.997 13.2677 3.60425 13.0359 3.28644 12.7188C2.96863 12.4016 2.73604 12.0093 2.61023 11.5783C2.48443 11.1473 2.46949 10.6916 2.5668 10.2532C2.18677 10.0127 1.87374 9.68002 1.65683 9.28605C1.43992 8.89207 1.32617 8.44964 1.32617 7.9999C1.32617 7.55016 1.43992 7.10773 1.65683 6.71376C1.87374 6.31979 2.18677 5.98707 2.5668 5.74657Z"
            stroke="#1E4F86"
            strokeWidth="1.33333"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 8.00008L7.33333 9.33341L10 6.66675"
            stroke="#1E4F86"
            strokeWidth="1.33333"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath id="clip0_1712_2678">
            <rect width="16" height="16" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    key: "INTERNET",
    label: "Internet",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 13.3333H8.00667"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M1.33301 5.87994C3.16642 4.24009 5.5399 3.3335 7.99967 3.3335C10.4594 3.3335 12.8329 4.24009 14.6663 5.87994"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.33301 8.57271C4.5792 7.35119 6.25466 6.66699 7.99967 6.66699C9.74469 6.66699 11.4201 7.35119 12.6663 8.57271"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.66699 10.9526C6.29009 10.3419 7.12782 9.99976 8.00033 9.99976C8.87283 9.99976 9.71056 10.3419 10.3337 10.9526"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "GAS",
    label: "Gas",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M5.66634 9.66667C6.10837 9.66667 6.53229 9.49107 6.84485 9.17851C7.15741 8.86595 7.33301 8.44203 7.33301 8C7.33301 7.08 6.99967 6.66667 6.66634 6C5.95167 4.57133 6.51701 3.29733 7.99967 2C8.33301 3.66667 9.33301 5.26667 10.6663 6.33333C11.9997 7.4 12.6663 8.66667 12.6663 10C12.6663 10.6128 12.5456 11.2197 12.3111 11.7859C12.0766 12.352 11.7328 12.8665 11.2995 13.2998C10.8662 13.7332 10.3517 14.0769 9.78553 14.3114C9.21934 14.546 8.61251 14.6667 7.99967 14.6667C7.38684 14.6667 6.78 14.546 6.21382 14.3114C5.64763 14.0769 5.13318 13.7332 4.69984 13.2998C4.2665 12.8665 3.92276 12.352 3.68824 11.7859C3.45371 11.2197 3.33301 10.6128 3.33301 10C3.33301 9.23133 3.62167 8.47067 3.99967 8C3.99967 8.44203 4.17527 8.86595 4.48783 9.17851C4.80039 9.49107 5.22431 9.66667 5.66634 9.66667Z"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "RADIANT_FLOORS",
    label: "Radiant Floors",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M9.33301 2.66659V9.69325C9.84139 9.98676 10.2387 10.4398 10.4634 10.9822C10.688 11.5245 10.7274 12.1258 10.5755 12.6928C10.4235 13.2599 10.0888 13.7609 9.62304 14.1183C9.15732 14.4756 8.5867 14.6693 7.99968 14.6693C7.41265 14.6693 6.84203 14.4756 6.37631 14.1183C5.91059 13.7609 5.57581 13.2599 5.42387 12.6928C5.27194 12.1258 5.31135 11.5245 5.536 10.9822C5.76064 10.4398 6.15796 9.98676 6.66634 9.69325V2.66659C6.66634 2.31296 6.80682 1.97382 7.05687 1.72378C7.30692 1.47373 7.64605 1.33325 7.99968 1.33325C8.3533 1.33325 8.69244 1.47373 8.94248 1.72378C9.19253 1.97382 9.33301 2.31296 9.33301 2.66659Z"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "WATER",
    label: "Water",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M4.66667 10.8668C6.13333 10.8668 7.33333 9.64678 7.33333 8.16678C7.33333 7.39345 6.95333 6.66011 6.19333 6.04011C5.43333 5.42011 4.86 4.50011 4.66667 3.53345C4.47333 4.50011 3.90667 5.42678 3.14 6.04011C2.37333 6.65345 2 7.40011 2 8.16678C2 9.64678 3.2 10.8668 4.66667 10.8668Z"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.3729 4.40009C8.83141 3.66751 9.15644 2.85946 9.3329 2.01343C9.66624 3.68009 10.6662 5.28009 11.9996 6.34676C13.3329 7.41343 13.9996 8.68009 13.9996 10.0134C14.0034 10.935 13.7335 11.8369 13.2241 12.6048C12.7147 13.3728 11.9888 13.9722 11.1383 14.3271C10.2879 14.682 9.35118 14.7764 8.44702 14.5983C7.54285 14.4202 6.71193 13.9777 6.05957 13.3268"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "BARBECUE",
    label: "Barbecue",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <g clipPath="url(#clip0_1712_2709)">
          <path
            d="M10.6666 1.33325L9.13324 2.86659C8.76678 3.24044 8.56152 3.74308 8.56152 4.26659C8.56152 4.79009 8.76678 5.29273 9.13324 5.66659L10.3332 6.86659C10.7071 7.23304 11.2097 7.4383 11.7332 7.4383C12.2567 7.4383 12.7594 7.23304 13.1332 6.86659L14.6666 5.33325"
            stroke="#1E4F86"
            strokeWidth="1.33333"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.99978 9.99995L2.19978 2.19995C1.9337 2.46065 1.72232 2.77183 1.57801 3.11525C1.43371 3.45868 1.35938 3.82744 1.35938 4.19995C1.35938 4.57246 1.43371 4.94123 1.57801 5.28465C1.72232 5.62807 1.9337 5.93925 2.19978 6.19995L7.06645 11.0666C7.53312 11.5333 8.39978 11.5333 8.93312 11.0666L9.99978 9.99995ZM9.99978 9.99995L14.6665 14.6666"
            stroke="#1E4F86"
            strokeWidth="1.33333"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M1.40039 14.5333L5.66706 10.3333"
            stroke="#1E4F86"
            strokeWidth="1.33333"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.6667 3.33325L8 7.99992"
            stroke="#1E4F86"
            strokeWidth="1.33333"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath id="clip0_1712_2709">
            <rect width="16" height="16" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
  },
  {
    key: "LAUNDRY",
    label: "Laundry",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M2 4H4"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.333 4H11.3397"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.6667 1.33325H3.33333C2.59695 1.33325 2 1.93021 2 2.66659V13.3333C2 14.0696 2.59695 14.6666 3.33333 14.6666H12.6667C13.403 14.6666 14 14.0696 14 13.3333V2.66659C14 1.93021 13.403 1.33325 12.6667 1.33325Z"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.00033 11.9999C9.84127 11.9999 11.3337 10.5075 11.3337 8.66659C11.3337 6.82564 9.84127 5.33325 8.00033 5.33325C6.15938 5.33325 4.66699 6.82564 4.66699 8.66659C4.66699 10.5075 6.15938 11.9999 8.00033 11.9999Z"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.99967 11.9999C8.4417 11.9999 8.86563 11.8243 9.17819 11.5118C9.49075 11.1992 9.66634 10.7753 9.66634 10.3333C9.66634 9.89122 9.49075 9.4673 9.17819 9.15474C8.86563 8.84218 8.4417 8.66659 7.99967 8.66659C7.55765 8.66659 7.13372 8.49099 6.82116 8.17843C6.5086 7.86587 6.33301 7.44195 6.33301 6.99992C6.33301 6.55789 6.5086 6.13397 6.82116 5.82141C7.13372 5.50885 7.55765 5.33325 7.99967 5.33325"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "TENNIS_COURT",
    label: "Tennis Court",
    icon: (
      <svg width="14" height="15" viewBox="0 0 14 15" fill="none">
        <path
          d="M10.7933 9.31715C11.5006 9.31715 12.1789 9.59811 12.679 10.0982C13.179 10.5983 13.46 11.2766 13.46 11.9838C13.46 12.6911 13.179 13.3693 12.679 13.8694C12.1789 14.3695 11.5006 14.6505 10.7933 14.6505C10.0861 14.6505 9.40781 14.3695 8.90771 13.8694C8.40762 13.3693 8.12667 12.6911 8.12667 11.9838C8.12667 11.2766 8.40762 10.5983 8.90771 10.0982C9.40781 9.59811 10.0861 9.31715 10.7933 9.31715ZM10.7933 10.6505C10.4397 10.6505 10.1006 10.791 9.85052 11.041C9.60048 11.2911 9.46 11.6302 9.46 11.9838C9.46 12.3374 9.60048 12.6766 9.85052 12.9266C10.1006 13.1767 10.4397 13.3172 10.7933 13.3172C11.147 13.3172 11.4861 13.1767 11.7361 12.9266C11.9862 12.6766 12.1267 12.3374 12.1267 11.9838C12.1267 11.6302 11.9862 11.2911 11.7361 11.041C11.4861 10.791 11.147 10.6505 10.7933 10.6505ZM2.82667 9.01049C2.82667 9.01049 3.76667 8.06382 3.77333 6.18382C3.53333 4.72382 4.10667 3.01049 5.42 1.70382C7.37333 -0.249514 10.22 -0.569514 11.7933 0.983819C13.3467 2.55715 13.0267 5.40382 11.0733 7.35715C9.76667 8.67049 8.05333 9.24382 6.59333 9.00382C4.71333 9.01049 3.76667 9.95049 3.76667 9.95049L0.94 12.7772L0 11.8372L2.82667 9.01049ZM10.84 1.93715C9.79333 0.897153 7.79333 1.21049 6.36 2.65049C4.93333 4.07715 4.61333 6.08382 5.65333 7.12382C6.7 8.16382 8.7 7.84382 10.1267 6.41715C11.5667 4.98382 11.88 2.98382 10.84 1.93715Z"
          fill="#1E4F86"
        />
      </svg>
    ),
  },
  {
    key: "AIR_CONDITIONING",
    label: "Air Conditioning",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8.53301 13.0667C8.70202 13.1935 8.89874 13.2783 9.10695 13.3141C9.31516 13.3499 9.52891 13.3358 9.73057 13.2728C9.93222 13.2098 10.116 13.0998 10.2668 12.9518C10.4176 12.8038 10.5311 12.6221 10.5979 12.4217C10.6647 12.2213 10.683 12.0079 10.6511 11.799C10.6192 11.5902 10.5382 11.3919 10.4147 11.2205C10.2911 11.0491 10.1286 10.9095 9.94058 10.8132C9.75252 10.717 9.54428 10.6667 9.33301 10.6667H1.33301"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.6663 5.33342C11.8368 5.10614 12.0625 4.92621 12.3221 4.81071C12.5816 4.69521 12.8664 4.64797 13.1494 4.67348C13.4323 4.699 13.704 4.79641 13.9387 4.95648C14.1734 5.11655 14.3633 5.33396 14.4904 5.58806C14.6174 5.84216 14.6774 6.12452 14.6647 6.40833C14.6519 6.69214 14.5668 6.96797 14.4174 7.20963C14.2681 7.4513 14.0594 7.65077 13.8113 7.78912C13.5631 7.92746 13.2838 8.00008 12.9997 8.00008H1.33301"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.53301 2.93341C6.70202 2.80665 6.89874 2.72187 7.10695 2.68605C7.31516 2.65023 7.52891 2.6644 7.73056 2.7274C7.93222 2.79039 8.11603 2.9004 8.26683 3.04837C8.41763 3.19633 8.53111 3.37802 8.59792 3.57844C8.66473 3.77887 8.68295 3.99231 8.65109 4.20116C8.61923 4.41001 8.5382 4.6083 8.41466 4.7797C8.29113 4.95109 8.12864 5.09067 7.94058 5.18694C7.75252 5.28321 7.54428 5.33341 7.33301 5.33341H1.33301"
          stroke="#1E4F86"
          strokeWidth="1.33333"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

// Icon catalog for the stats strip; values come from the listing at render time.
const statCatalog = [
  {
    label: "Type",
    value: "For Sale",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.6838 3.01704C14.2463 2.57943 13.653 2.33351 13.0342 2.33337H4.66683C4.04799 2.33337 3.4545 2.57921 3.01691 3.01679C2.57933 3.45438 2.3335 4.04787 2.3335 4.66671V13.034C2.33363 13.6528 2.57955 14.2462 3.01716 14.6837L13.1718 24.8384C13.7021 25.3653 14.4193 25.661 15.1668 25.661C15.9144 25.661 16.6316 25.3653 17.1618 24.8384L24.8385 17.1617C25.3654 16.6314 25.6612 15.9143 25.6612 15.1667C25.6612 14.4192 25.3654 13.702 24.8385 13.1717L14.6838 3.01704Z" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.74984 9.33329C9.072 9.33329 9.33317 9.07213 9.33317 8.74996C9.33317 8.42779 9.072 8.16663 8.74984 8.16663C8.42767 8.16663 8.1665 8.42779 8.1665 8.74996C8.1665 9.07213 8.42767 9.33329 8.74984 9.33329Z" fill="#232323" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Price",
    value: "$12,500,000",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.3335 7H4.66683C3.37816 7 2.3335 8.04467 2.3335 9.33333V18.6667C2.3335 19.9553 3.37816 21 4.66683 21H23.3335C24.6222 21 25.6668 19.9553 25.6668 18.6667V9.33333C25.6668 8.04467 24.6222 7 23.3335 7Z" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.9998 16.3333C15.2885 16.3333 16.3332 15.2886 16.3332 14C16.3332 12.7113 15.2885 11.6666 13.9998 11.6666C12.7112 11.6666 11.6665 12.7113 11.6665 14C11.6665 15.2886 12.7112 16.3333 13.9998 16.3333Z" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 14H7.01167M21 14H21.0117" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Beds",
    value: "5",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.3335 23.3333V14C2.3335 13.3811 2.57933 12.7876 3.01691 12.35C3.4545 11.9125 4.04799 11.6666 4.66683 11.6666H23.3335C23.9523 11.6666 24.5458 11.9125 24.9834 12.35C25.421 12.7876 25.6668 13.3811 25.6668 14V23.3333" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.6665 11.6666V6.99996C4.6665 6.38112 4.91234 5.78763 5.34992 5.35004C5.78751 4.91246 6.381 4.66663 6.99984 4.66663H20.9998C21.6187 4.66663 22.2122 4.91246 22.6498 5.35004C23.0873 5.78763 23.3332 6.38112 23.3332 6.99996V11.6666" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 4.66663V11.6666" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.3335 21H25.6668" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Baths",
    value: "6",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.6668 4.66663L9.3335 6.99996" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.8335 22.1666V24.5" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.3335 14H25.6668" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.1665 22.1666V24.5" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.4998 5.83339L8.891 4.22455C8.55362 3.8856 8.12524 3.65168 7.6577 3.55109C7.19015 3.45049 6.70348 3.48754 6.25655 3.65775C5.80962 3.82795 5.42158 4.12402 5.13939 4.51014C4.85721 4.89626 4.69295 5.35587 4.6665 5.83339V19.8334C4.6665 20.4522 4.91234 21.0457 5.34992 21.4833C5.78751 21.9209 6.381 22.1667 6.99984 22.1667H20.9998C21.6187 22.1667 22.2122 21.9209 22.6498 21.4833C23.0873 21.0457 23.3332 20.4522 23.3332 19.8334V14.0001" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Size",
    value: "8,100 sq ft",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.5 3.5H24.5V10.5" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 24.5H3.5V17.5" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24.5002 3.5L16.3335 11.6667" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.5 24.5L11.6667 16.3334" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Parking",
    value: "3",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.1668 19.8333H24.5002C25.2002 19.8333 25.6668 19.3666 25.6668 18.6666V15.1666C25.6668 14.1166 24.8502 13.1833 23.9168 12.95C21.8168 12.3666 18.6668 11.6666 18.6668 11.6666C18.6668 11.6666 17.1502 10.0333 16.1002 8.98329C15.5168 8.51663 14.8168 8.16663 14.0002 8.16663H5.8335C5.1335 8.16663 4.55016 8.63329 4.20016 9.21663L2.56683 12.6C2.41234 13.0506 2.3335 13.5236 2.3335 14V18.6666C2.3335 19.3666 2.80016 19.8333 3.50016 19.8333H5.8335" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.16683 22.1667C9.45549 22.1667 10.5002 21.122 10.5002 19.8333C10.5002 18.5447 9.45549 17.5 8.16683 17.5C6.87816 17.5 5.8335 18.5447 5.8335 19.8333C5.8335 21.122 6.87816 22.1667 8.16683 22.1667Z" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 19.8334H17.5" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.8333 22.1667C21.122 22.1667 22.1667 21.122 22.1667 19.8333C22.1667 18.5447 21.122 17.5 19.8333 17.5C18.5447 17.5 17.5 18.5447 17.5 19.8333C17.5 21.122 18.5447 22.1667 19.8333 22.1667Z" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Lot Size",
    value: "1.1 acres",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2.33337V25.6667" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17.5 22.1666L14 25.6666L10.5 22.1666" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22.1665 10.5L25.6665 14L22.1665 17.5" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.3335 14H25.6668" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.8335 10.5L2.3335 14L5.8335 17.5" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 5.83337L14 2.33337L17.5 5.83337" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Covered m²",
    value: "95 m²",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.5 24.5V15.1667C17.5 14.8572 17.3771 14.5605 17.1583 14.3417C16.9395 14.1229 16.6428 14 16.3333 14H11.6667C11.3572 14 11.0605 14.1229 10.8417 14.3417C10.6229 14.5605 10.5 14.8572 10.5 15.1667V24.5" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.5 11.6667C3.49992 11.3273 3.57389 10.9919 3.71675 10.684C3.85962 10.3762 4.06793 10.1031 4.32717 9.88404L12.4938 2.88521C12.915 2.52927 13.4486 2.33398 14 2.33398C14.5514 2.33398 15.085 2.52927 15.5062 2.88521L23.6728 9.88404C23.9321 10.1031 24.1404 10.3762 24.2832 10.684C24.4261 10.9919 24.5001 11.3273 24.5 11.6667V22.1667C24.5 22.7855 24.2542 23.379 23.8166 23.8166C23.379 24.2542 22.7855 24.5 22.1667 24.5H5.83333C5.21449 24.5 4.621 24.2542 4.18342 23.8166C3.74583 23.379 3.5 22.7855 3.5 22.1667V11.6667Z" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Semi-covered m²",
    value: "15 m²",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25.6668 13.9999C25.3515 11.126 23.9866 8.46964 21.8337 6.53998C19.6807 4.61033 16.8913 3.54321 14.0002 3.54321C11.109 3.54321 8.31961 4.61033 6.16667 6.53998C4.01374 8.46964 2.64879 11.126 2.3335 13.9999H25.6668Z" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 14V23.3333C14 23.9522 14.2458 24.5457 14.6834 24.9832C15.121 25.4208 15.7145 25.6667 16.3333 25.6667C16.9522 25.6667 17.5457 25.4208 17.9832 24.9832C18.4208 24.5457 18.6667 23.9522 18.6667 23.3333" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 2.33337V3.50004" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Lot Frontage",
    value: "20 m²",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2.33337V25.6667" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17.5 22.1666L14 25.6666L10.5 22.1666" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22.1665 10.5L25.6665 14L22.1665 17.5" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.3335 14H25.6668" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.8335 10.5L2.3335 14L5.8335 17.5" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 5.83337L14 2.33337L17.5 5.83337" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Lot Depth",
    value: "25 m²",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2.33337V25.6667" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17.5 22.1666L14 25.6666L10.5 22.1666" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22.1665 10.5L25.6665 14L22.1665 17.5" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.3335 14H25.6668" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.8335 10.5L2.3335 14L5.8335 17.5" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 5.83337L14 2.33337L17.5 5.83337" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Built in",
    value: "2021",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.3335 2.33337V7.00004" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.6665 2.33337V7.00004" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22.1667 4.66663H5.83333C4.54467 4.66663 3.5 5.71129 3.5 6.99996V23.3333C3.5 24.622 4.54467 25.6666 5.83333 25.6666H22.1667C23.4553 25.6666 24.5 24.622 24.5 23.3333V6.99996C24.5 5.71129 23.4553 4.66663 22.1667 4.66663Z" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.5 11.6666H24.5" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Floors",
    value: "2 stories",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.9684 2.5433C14.6644 2.40464 14.3342 2.33289 14 2.33289C13.6659 2.33289 13.3357 2.40464 13.0317 2.5433L3.03337 7.0933C2.82635 7.18459 2.65033 7.3341 2.52676 7.52363C2.40319 7.71317 2.3374 7.93454 2.3374 8.1608C2.3374 8.38706 2.40319 8.60844 2.52676 8.79797C2.65033 8.9875 2.82635 9.13702 3.03337 9.2283L13.0434 13.79C13.3474 13.9286 13.6776 14.0004 14.0117 14.0004C14.3458 14.0004 14.676 13.9286 14.98 13.79L24.99 9.23997C25.1971 9.14868 25.3731 8.99917 25.4966 8.80964C25.6202 8.6201 25.686 8.39873 25.686 8.17247C25.686 7.94621 25.6202 7.72484 25.4966 7.5353C25.3731 7.34577 25.1971 7.19625 24.99 7.10497L14.9684 2.5433Z" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.3335 14C2.33295 14.2231 2.3964 14.4418 2.51634 14.6299C2.63627 14.8181 2.80766 14.9679 3.01017 15.0617L13.0435 19.6233C13.3459 19.7603 13.674 19.8311 14.006 19.8311C14.338 19.8311 14.6661 19.7603 14.9685 19.6233L24.9785 15.0733C25.185 14.9805 25.36 14.8296 25.4823 14.639C25.6045 14.4484 25.6686 14.2264 25.6668 14" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.3335 19.8334C2.33295 20.0565 2.3964 20.2751 2.51634 20.4633C2.63627 20.6515 2.80766 20.8013 3.01017 20.895L13.0435 25.4567C13.3459 25.5936 13.674 25.6645 14.006 25.6645C14.338 25.6645 14.6661 25.5936 14.9685 25.4567L24.9785 20.9067C25.185 20.8139 25.36 20.663 25.4823 20.4724C25.6045 20.2818 25.6686 20.0598 25.6668 19.8334" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Property ID",
    value: "PHF-3128-RN",
    copy: true,
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.6665 11.6666H20.9998" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.6665 16.3334H20.9998" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.19824 17.5C7.43874 16.8164 7.88553 16.2242 8.47693 15.8054C9.06833 15.3865 9.77519 15.1615 10.4999 15.1615C11.2246 15.1615 11.9315 15.3865 12.5229 15.8054C13.1143 16.2242 13.5611 16.8164 13.8016 17.5" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.4998 15.1667C11.7885 15.1667 12.8332 14.122 12.8332 12.8333C12.8332 11.5447 11.7885 10.5 10.4998 10.5C9.21117 10.5 8.1665 11.5447 8.1665 12.8333C8.1665 14.122 9.21117 15.1667 10.4998 15.1667Z" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23.3335 5.83337H4.66683C3.37816 5.83337 2.3335 6.87804 2.3335 8.16671V19.8334C2.3335 21.122 3.37816 22.1667 4.66683 22.1667H23.3335C24.6222 22.1667 25.6668 21.122 25.6668 19.8334V8.16671C25.6668 6.87804 24.6222 5.83337 23.3335 5.83337Z" stroke="#232323" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// The listing operation type only ever takes these three values, so its
// display text is translated through a small switch rather than a plain
// record — this keeps the translation function (which needs a hook) out of
// module scope while still covering SALE / RENT / SALE_AND_RENT.
function operationTypeLabel(t: TFunction, operationType: PublicListingDto["operationType"]): string {
  switch (operationType) {
    case "SALE":
      return t("home:featuredListings.filterSale");
    case "RENT":
      return t("home:featuredListings.filterRent");
    case "SALE_AND_RENT":
      return t("listingDetail:badges.saleAndRent");
  }
}

const detailIconNames: Record<string, string> = {
  Type: "type", Price: "price", Beds: "beds", Baths: "baths", Size: "size",
  Parking: "parking", "Lot Size": "lot-size", "Built in": "built-in",
  Floors: "floors", "Property ID": "property-id", "Covered m²": "covered",
  "Semi-covered m²": "semi-covered",
};

function statIcon(label: string): React.ReactNode {
  const name = detailIconNames[label];
  if (name) return <img src={`/listings/detail-${name}.svg`} width={20} height={20} alt="" aria-hidden="true" />;
  return statCatalog.find((s) => s.label === label)?.icon ?? null;
}

// AmenityKey -> translation key, so the DB-stored English enum values never
// leak into the UI (see listingAmenities below).
const AMENITY_LABEL_KEYS: Record<AmenityKey, string> = {
  PARKING: "listingDetail:amenities.parking",
  GARDEN: "listingDetail:amenities.garden",
  POOL: "listingDetail:amenities.pool",
  GYM: "listingDetail:amenities.gym",
  BALCONY: "listingDetail:amenities.balcony",
  ELEVATOR: "listingDetail:amenities.elevator",
  SECURITY: "listingDetail:amenities.security",
  FURNISHED: "listingDetail:amenities.furnished",
  PET_FRIENDLY: "listingDetail:amenities.petFriendly",
  CREDIT_APPROVED: "listingDetail:amenities.creditApproved",
  INTERNET: "listingDetail:amenities.internet",
  GAS: "listingDetail:amenities.gas",
  RADIANT_FLOORS: "listingDetail:amenities.radiantFloors",
  AIR_CONDITIONING: "listingDetail:amenities.airConditioning",
  BARBECUE: "listingDetail:amenities.barbecue",
  LAUNDRY: "listingDetail:amenities.laundry",
  WATER: "listingDetail:amenities.water",
  TENNIS_COURT: "listingDetail:amenities.tennisCourt",
  CENTRAL_HEATING: "listingDetail:amenities.centralHeating",
  RADIATORS: "listingDetail:amenities.radiators",
  BALANCED_FLUE_GAS_HEATER: "listingDetail:amenities.balancedFlueGasHeater",
  POLO_FIELD: "listingDetail:amenities.poloField",
  GOLF_COURSE: "listingDetail:amenities.golfCourse",
  MULTIPURPOSE_ROOM: "listingDetail:amenities.multipurposeRoom",
  PADEL_COURT: "listingDetail:amenities.padelCourt",
  CENTRAL_AIR_CONDITIONING: "listingDetail:amenities.centralAirConditioning",
  LIVING_ROOM: "listingDetail:amenities.livingRoom",
  LIVING_DINING_ROOM: "listingDetail:amenities.livingDiningRoom",
  COVERED_ENTERTAINING_AREA: "listingDetail:amenities.coveredEntertainingArea",
  APPROVED_FOR_PROFESSIONAL_USE: "listingDetail:amenities.approvedForProfessionalUse",
  STAFF_QUARTERS: "listingDetail:amenities.staffQuarters",
  WALK_IN_CLOSET: "listingDetail:amenities.walkInCloset",
  EN_SUITE_BEDROOM: "listingDetail:amenities.enSuiteBedroom",
  SOLARIUM: "listingDetail:amenities.solarium",
};

// stat.label doubles as the internal key used to look up its icon above, so
// it's kept in English as a stable identifier; this maps it to the
// translated text actually shown to the user.
const STAT_LABEL_KEYS: Record<string, string> = {
  Type: "listingDetail:stats.type",
  Price: "listingDetail:stats.price",
  Beds: "listingDetail:stats.beds",
  Baths: "listingDetail:stats.baths",
  Size: "listingDetail:stats.size",
  Parking: "listingDetail:stats.parking",
  "Lot Size": "listingDetail:stats.lotSize",
  "Covered m²": "listingDetail:stats.coveredM2",
  "Semi-covered m²": "listingDetail:stats.semiCoveredM2",
  "Lot Frontage": "listingDetail:stats.lotFrontage",
  "Lot Depth": "listingDetail:stats.lotDepth",
  "Built in": "listingDetail:stats.builtIn",
  Floors: "listingDetail:stats.floors",
  "Property ID": "listingDetail:stats.propertyId",
};

function buildStats(listing: PublicListingDto, t: TFunction) {
  const stats: { label: string; value: string; copy?: boolean; icon: React.ReactNode }[] = [];
  const push = (label: string, value: string, copy = false) =>
    stats.push({ label, value, copy, icon: statIcon(label) });

  push("Type", operationTypeLabel(t, listing.operationType));
  if (listing.salePrice !== null) push("Price", formatSalePrice(listing.salePrice, listing.saleCurrency));
  else if (listing.rentPrice !== null) push("Price", formatRentPrice(listing.rentPrice, listing.rentCurrency, t));
  if (listing.bedrooms !== null) push("Beds", String(listing.bedrooms));
  if (listing.bathrooms !== null) push("Baths", String(listing.bathrooms));
  if (listing.totalAreaM2 !== null) push("Size", `${listing.totalAreaM2.toLocaleString("en-US")} m²`);
  if (listing.parkingSpaces !== null) push("Parking", String(listing.parkingSpaces));
  if (listing.type === "LOT") {
    if (listing.lotFrontageM2 !== null)
      push("Lot Frontage", `${listing.lotFrontageM2.toLocaleString("en-US")} m²`);
    if (listing.lotDepthM2 !== null)
      push("Lot Depth", `${listing.lotDepthM2.toLocaleString("en-US")} m²`);
  } else {
    if (listing.coveredAreaM2 !== null)
      push("Covered m²", `${listing.coveredAreaM2.toLocaleString("en-US")} m²`);
    if (listing.semiCoveredAreaM2 !== null)
      push("Semi-covered m²", `${listing.semiCoveredAreaM2.toLocaleString("en-US")} m²`);
    if (listing.lotSizeM2 !== null)
      push("Lot Size", `${listing.lotSizeM2.toLocaleString("en-US")} m²`);
  }
  if (listing.yearBuilt !== null) push("Built in", String(listing.yearBuilt));
  if (listing.floors !== null)
    push(
      "Floors",
      listing.floors === 1
        ? t("listingDetail:stats.oneStory")
        : t("listingDetail:stats.storiesCount", { count: listing.floors }),
    );
  push("Property ID", listing.listingId, true);
  return stats;
}

// Generic check icon for amenities without a bespoke Figma icon.
function AmenityCheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#1E4F86" strokeWidth="1.5" />
      <path
        d="M8.5 12.2L11 14.7L15.5 9.8"
        stroke="#1E4F86"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// Recognizes youtube.com/watch, youtu.be, /embed/, and /shorts/ links so we
// can derive a thumbnail (img.youtube.com) and an embeddable player URL
// without storing anything beyond the raw link the agent pastes in.
function getYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return parsed.pathname.slice(1) || null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/embed/")[1] || null;
      if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/shorts/")[1] || null;
    }
    return null;
  } catch {
    return null;
  }
}

function VideoPreviewSection({ videoUrl, title }: { videoUrl: string | null; title: string }) {
  const { t } = useTranslation("listingDetail");
  const [isPlaying, setIsPlaying] = useState(false);
  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null;
  const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null;

  return (
    <div className="w-[calc(100%-32px)] sm:w-[calc(100%-64px)] lg:w-[calc(100%-128px)] max-w-[1312px] mx-auto py-8 sm:py-12 lg:py-16">
      <h2
        className="text-[#0d2138] mb-5 text-[22px] sm:text-[24px] leading-[32px]"
        style={{
          fontFamily: "Poppins, sans-serif",
          fontWeight: 500,
          letterSpacing: "-0.24px",
        }}
      >
        {t("sections.videoPreview")}
      </h2>

      <div className="relative rounded-[14px] sm:rounded-[20px] overflow-hidden h-[240px] sm:h-[360px] lg:h-[442px] bg-[#0d2138]">
        {!videoUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path
                d="M15 7h2a2 2 0 0 1 2 2v6a2 2 0 0 1-.4 1.2M17 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M21 8l-4 3v2l4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ fontFamily: "Montserrat, sans-serif" }} className="text-[14px] sm:text-[16px]">
              {t("video.previewNotAvailable")}
            </p>
          </div>
        ) : isPlaying ? (
          youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              title={t("video.playerTitle", { title })}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={videoUrl}
              className="absolute inset-0 h-full w-full object-cover"
              controls
              autoPlay
            />
          )
        ) : (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            aria-label={t("video.playAria", { title })}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1e4f86] to-[#0d2138]" />
            )}

            <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/25" />

            <span className="absolute left-1/2 top-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#FF0000] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-transform group-hover:scale-105 sm:size-20">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="white" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export function SingleListingPageContent({
  listing,
  agent,
}: {
  listing: PublicListingDto;
  agent: PublicListingAgent | null;
}) {
  const { t } = useTranslation(["listingDetail", "home"]);
  const [copied, setCopied] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { isSaved, toggleSave } = useSavedListings();
  const saved = isSaved(listing.listingId);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = typeof window === "undefined" ? "" : window.location.href;
  const shareText = `${listing.title} — ${listing.location}`;
  const openShare = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  // Cover first, then the rest in their stored order — this is the order the
  // lightbox pages through, so the thumbnails' indexes map straight into it.
  // If the flagged cover is undersized, prefer a safer photo for the hero
  // slot rather than upscaling it (see isHeroUnsafe) — the flagged cover
  // still stays first among the side thumbnails/lightbox order otherwise.
  const flaggedCover = listing.images.find((img) => img.isCover) ?? listing.images[0] ?? null;
  const mainImage =
    flaggedCover && isHeroUnsafe(flaggedCover)
      ? (listing.images.find((img) => !isHeroUnsafe(img)) ?? flaggedCover)
      : flaggedCover;
  const images = mainImage
    ? [mainImage, ...listing.images.filter((img) => img !== mainImage)]
    : listing.images;
  const sideImages = images.slice(1, 5);
  const hiddenCount = images.length - 5;

  const stats = buildStats(listing, t);
  const listingAmenities = listing.amenities.map((key) => ({
    key,
    label: t(AMENITY_LABEL_KEYS[key] ?? "", {
      defaultValue: AMENITY_OPTIONS.find((opt) => opt.key === key)?.label ?? key,
    }),
    icon: amenityIcons.find((item) => item.key === key)?.icon ?? <AmenityCheckIcon />,
  }));

  const badges = [
    operationTypeLabel(t, listing.operationType),
    propertyTypeLabel(listing.type, t),
    ...(listing.yearBuilt !== null ? [String(listing.yearBuilt)] : []),
  ];

  return (
    <div className="w-full bg-white">
      <LoginPromptModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      {/* Breadcrumb */}
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-64px)] lg:w-[calc(100%-128px)] max-w-[1312px] mx-auto pt-8 pb-[30px]">
        <p
          className="text-[#0d2138]"
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: "-0.24px",
            lineHeight: "28px",
          }}
        >
          {t("propertyDetails")}
        </p>
      </div>

      {/* Photo Gallery */}
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-64px)] lg:w-[calc(100%-128px)] max-w-[1312px] mx-auto">
        <div className="flex flex-col gap-4 lg:gap-6 items-start">
          {/* Main Image */}
          <div className="hover-shine relative w-full rounded-[16px] overflow-hidden h-[280px] sm:h-[400px] lg:h-[560px]">
            <button
              type="button"
              onClick={() => mainImage && setLightboxIndex(0)}
              disabled={!mainImage}
              aria-label={t("gallery.openGalleryAria")}
              className="group absolute inset-0 h-full w-full cursor-zoom-in disabled:cursor-default"
            >
              {mainImage && isHeroUnsafe(mainImage) ? (
                <>
                  <img
                    src={mainImage.url}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-50"
                  />
                  <img
                    src={mainImage.url}
                    alt={mainImage.altText ?? listing.title}
                    className="relative h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </>
              ) : (
                <img
                  src={mainImage?.url ?? fallbackImg}
                  alt={mainImage?.altText ?? listing.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              )}

              {/* Expand hint */}
              {mainImage ? (
                <span className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[12px] sm:text-[13px] text-white opacity-90 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t("gallery.viewPhotos")}
                </span>
              ) : null}
            </button>

            {/* Badges */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-wrap gap-1.5 pointer-events-none">
              {badges.map((tag) => (
                <span
                  key={tag}
                  className="bg-white/90 px-2.5 sm:px-3 py-1 rounded-[36px] text-[#0d2138] text-[11px] sm:text-[14px]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Side Images */}
          {sideImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full">
              {sideImages.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setLightboxIndex(i + 1)}
                  aria-label={t("gallery.openGalleryAtPhotoAria", { number: i + 2 })}
                  className="hover-shine group relative rounded-[16px] overflow-hidden h-[120px] sm:h-[150px] lg:h-[206px] cursor-pointer"
                >
                  <img
                    src={img.url}
                    alt={img.altText ?? t("gallery.photoAlt", { title: listing.title, number: i + 1 })}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />

                  {/* Last visible tile shows how many more photos exist and, when
                  clicked, opens the gallery at the first hidden photo. */}
                  {i === sideImages.length - 1 && hiddenCount > 0 ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(5);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/55 text-white transition-colors group-hover:bg-black/65"
                    >
                      <span
                        className="text-[14px] sm:text-[18px] lg:text-[20px] whitespace-nowrap"
                        style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500 }}
                      >
                        {t("gallery.moreCount", { count: hiddenCount })}
                      </span>
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Property Info Row */}
        <div className="mt-6 sm:mt-8 lg:mt-10 flex flex-col md:flex-row md:items-start md:justify-between gap-5 md:gap-8">
          {/* Title & Location */}
          <div className="flex flex-col gap-2 max-w-full md:max-w-[520px]">
            <h1
              className="text-[#232323] text-[22px] sm:text-[28px] lg:text-[36px] leading-[32px] sm:leading-[38px] lg:leading-[48px] line-clamp-2"
              style={{
                fontFamily: "Poppins, sans-serif",
                fontWeight: 500,
                letterSpacing: "-0.32px",
              }}
            >
              {listing.title}
            </h1>

            <div
              className="flex items-start sm:items-center gap-2 text-[rgba(0,0,0,0.62)] text-[13px] sm:text-[15px] lg:text-[16px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              <svg
                className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] shrink-0 mt-[2px] sm:mt-0"
                viewBox="0 0 18 18"
                fill="none"
              >
                <path
                  d={svgPaths.p23b22400}
                  stroke="black"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.7"
                  strokeWidth="1.125"
                />
                <path
                  d="M9 6.75V12.375"
                  stroke="black"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.7"
                  strokeWidth="1.125"
                />
                <path
                  d={svgPaths.p2e9ace80}
                  stroke="black"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.7"
                  strokeWidth="1.125"
                />
              </svg>

              <span className="leading-[20px]">
                {listing.fullAddress || listing.location}
              </span>
            </div>
          </div>

          {/* Prices */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 sm:gap-6 md:gap-2">
            {listing.salePrice !== null ? (
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#1e4f86]" />
                  <span
                    className="text-[#1e4f86] text-[14px] sm:text-[16px]"
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {t("home:hero.tabBuy")}
                  </span>
                </div>

                <span
                  className="text-[#1e4f86] text-[20px] sm:text-[22px] lg:text-[24px]"
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    letterSpacing: "-0.24px",
                  }}
                >
                  {formatSalePrice(listing.salePrice, listing.saleCurrency)}
                </span>
              </div>
            ) : null}

            {listing.rentPrice !== null ? (
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#4896b6]" />
                  <span
                    className="text-[#4896b6] text-[14px] sm:text-[16px]"
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {t("home:hero.tabRent")}
                  </span>
                </div>

                <span
                  className="text-[#4896b6] text-[20px] sm:text-[22px] lg:text-[24px]"
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                    letterSpacing: "-0.24px",
                  }}
                >
                  {formatRentPrice(listing.rentPrice, listing.rentCurrency, t)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
        {/* Share Bar */}
        <div className="mt-5 sm:mt-6 pb-6 border-b border-[#e5e7eb] flex flex-wrap items-center gap-3 sm:gap-4">
          <span
            className="text-[#2b3038] text-[14px] sm:text-[16px]"
            style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500 }}
          >
            {t("share.label")}
          </span>

          {/* Social Icons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Facebook */}
            <button
              onClick={() =>
                openShare(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                )
              }
              aria-label={t("share.facebookAria")}
              className="w-6 h-6 rounded-full bg-[#1877F2] flex items-center justify-center cursor-pointer overflow-hidden shrink-0"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 relative top-[2px]"
                fill="none"
              >
                <path
                  d="M13.6 22V13.4H16.5L17 10H13.6V7.8C13.6 6.8 13.9 6.1 15.3 6.1H17.1V3.1C16.8 3.1 15.7 3 14.5 3C11.9 3 10.1 4.6 10.1 7.5V10H7.2V13.4H10.1V22H13.6Z"
                  fill="white"
                />
              </svg>
            </button>

            {/* Twitter/X */}
            <button
              onClick={() =>
                openShare(
                  `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
                )
              }
              aria-label={t("share.xAria")}
              className="w-6 h-6 overflow-clip relative cursor-pointer shrink-0"
            >
              <svg viewBox="0 0 20 18" className="w-6 h-6">
                <path d={svgPaths.p7cd5f00} fill="#000000" />
              </svg>
            </button>

            {/* Instagram */}
            <button
              onClick={() => openShare("https://www.instagram.com/")}
              aria-label={t("share.instagramAria")}
              className="w-6 h-6 rounded-[6px] flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
              style={{
                background:
                  "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-[30px] h-[30px]"
                fill="none"
              >
                <rect
                  x="5"
                  y="5"
                  width="14"
                  height="14"
                  rx="4"
                  stroke="white"
                  strokeWidth="2"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3.2"
                  stroke="white"
                  strokeWidth="2"
                />
                <circle cx="16.6" cy="7.4" r="1.1" fill="white" />
              </svg>
            </button>

            {/* LinkedIn */}
            <button
              onClick={() =>
                openShare(
                  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                )
              }
              aria-label={t("share.linkedinAria")}
              className="w-6 h-6 overflow-clip relative cursor-pointer rounded-[3px] shrink-0"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="absolute inset-0 w-full h-full"
              >
                <path
                  d={svgPaths.p25763d00}
                  fill="#0B65C2"
                  clipRule="evenodd"
                  fillRule="evenodd"
                />
              </svg>

              <svg
                viewBox="0 0 14 14"
                fill="none"
                className="absolute inset-[20.83%] w-[58.34%] h-[58.34%]"
              >
                <path
                  d={svgPaths.p270e9700}
                  fill="white"
                  clipRule="evenodd"
                  fillRule="evenodd"
                />
              </svg>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() =>
                openShare(
                  `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
                )
              }
              aria-label={t("share.whatsappAria")}
              className="w-8 h-8 relative cursor-pointer shrink-0"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-[30px] h-[30px]"
                fill="white"
              >
                <path d="M19.1 4.9A9.8 9.8 0 0 0 3.7 16.7L2.4 21.5l4.9-1.3A9.8 9.8 0 0 0 19.1 4.9Zm-7.1 14a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3a8 8 0 1 1 6.7 3.6Zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.6.1c-.2.3-.7.8-.8 1-.2.2-.3.2-.6.1-.2-.1-1-.4-2-1.2-.7-.7-1.2-1.5-1.4-1.7-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5s-.6-1.5-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.2-.3-.3-.5-.4Z" />
              </svg>

              <svg
                viewBox="0 0 18.2089 18.1286"
                fill="none"
                className="absolute inset-[11.84%] w-[76.29%] h-[75.53%]"
              >
                <path d={svgPaths.p36a91e00} fill="url(#wa_grad)" />
                <defs>
                  <linearGradient
                    id="wa_grad"
                    x1="8.919"
                    x2="9.011"
                    y1="1.088"
                    y2="16.58"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#57D163" />
                    <stop offset="1" stopColor="#23B33A" />
                  </linearGradient>
                </defs>
              </svg>

              <svg
                viewBox="0 0 11.1241 10.271"
                fill="none"
                className="absolute w-[46.35%] h-[42.79%]"
                style={{ inset: "28.61% 26.65% 28.59% 27%" }}
              >
                <path
                  d={svgPaths.p3bc74772}
                  fill="white"
                  clipRule="evenodd"
                  fillRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[32px] border border-[#d1d5dc] text-[#2b3038] text-[13px] sm:text-[14px] hover:bg-gray-50 transition-colors shrink-0"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14.2581 14.2447"
              fill="none"
            >
              <path
                d={svgPaths.p3d13b600}
                stroke="#2B3038"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {copied ? t("share.copied") : t("share.copyLink")}
          </button>

          {/* Save button */}
          <button
            onClick={() => toggleSave(listing.listingId, () => setLoginOpen(true))}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-4xl border text-[13px] sm:text-[14px] transition-colors shrink-0 ${saved
              ? "border-[#e74c3c] text-[#e74c3c] bg-[#fff5f5] hover:bg-[#ffe8e8]"
              : "border-[#d1d5dc] text-[#2b3038] hover:bg-gray-50"
              }`}
            style={{ fontFamily: "Montserrat, sans-serif" }}
            aria-label={saved ? t("save.removeAria") : t("save.saveAria")}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill={saved ? "#e74c3c" : "none"}>
              <path
                d="M13.6 2.9a3.8 3.8 0 0 0-5.38 0L8 3.12l-.22-.22a3.8 3.8 0 0 0-5.38 5.38L8 13.87l5.6-5.59a3.8 3.8 0 0 0 0-5.38Z"
                stroke={saved ? "#e74c3c" : "#6A7282"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {saved ? t("save.saved") : t("save.save")}
          </button>
        </div>
      </div>

      {/* Description */}

      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-64px)] lg:w-[calc(100%-128px)] max-w-[1312px] mx-auto py-6 sm:py-8">
        <h2
          className="text-[#0d2138] mb-5 text-[22px] sm:text-[24px] leading-[32px]"
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 500,
            letterSpacing: "-0.24px",
          }}
        >
          {t("sections.description")}
        </h2>

        <p
          className="text-[#0d2138] text-[14px] sm:text-[15px] md:text-[16px] mb-4 leading-[22px] sm:leading-[24px] whitespace-pre-line"
          style={{
            fontFamily: "Montserrat, sans-serif",
            letterSpacing: "-0.16px",
          }}
        >
          {listing.description}
        </p>
      </div>

      {/* Property Details Stats heading */}
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-64px)] lg:w-[calc(100%-128px)] max-w-[1312px] mx-auto pt-3 sm:pt-4">
        <h2
          className="text-[#0d2138] mb-5 text-[22px] sm:text-[24px] leading-[32px]"
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 500,
            letterSpacing: "-0.24px",
          }}
        >
          {t("propertyDetails")}
        </h2>
      </div>
      {/* Property Details Stats */}
      <div className="bg-white">
        <div className="w-[calc(100%-32px)] sm:w-[calc(100%-64px)] lg:w-[calc(100%-128px)] max-w-[1312px] mx-auto pb-0">
          <div className="bg-[#fafcfe] border border-[#e9e9e9] rounded-[16px] overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
              {stats.map((stat, i) => {
                const isLastColLg = (i + 1) % 7 === 0 || i === stats.length - 1;
                const isLastRowLg = i >= 7 * Math.floor((stats.length - 1) / 7);

                const isLastColSm = (i + 1) % 3 === 0 || i === stats.length - 1;
                const isLastRowSm = i >= 3 * Math.floor((stats.length - 1) / 3);

                const isLastColXs = (i + 1) % 2 === 0 || i === stats.length - 1;
                const isLastRowXs = i >= 2 * Math.floor((stats.length - 1) / 2);

                return (
                  <div
                    key={stat.label}
                    className={`relative min-h-[117px] px-3 py-6 flex flex-col justify-center text-center 
                      ${isLastColLg ? "lg:border-r-0" : "lg:border-r lg:border-[#e5e7eb]"}
                      ${isLastRowLg ? "lg:border-b-0" : "lg:border-b lg:border-[#e5e7eb]"}
                      ${isLastColSm ? "sm:max-lg:border-r-0" : "sm:max-lg:border-r sm:max-lg:border-[#e5e7eb]"}
                      ${isLastRowSm ? "sm:max-lg:border-b-0" : "sm:max-lg:border-b sm:max-lg:border-[#e5e7eb]"}
                      ${isLastColXs ? "max-sm:border-r-0" : "max-sm:border-r max-sm:border-[#e5e7eb]"}
                      ${isLastRowXs ? "max-sm:border-b-0" : "max-sm:border-b max-sm:border-[#e5e7eb]"}
                    `}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center text-[#0f1f35] [&>svg]:h-5 [&>svg]:w-5">
                        {stat.icon}
                      </div>

                      <p
                        className="text-black text-[14px] leading-[16.25px] lg:max-w-[150px]"
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontWeight: 500,
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {t(STAT_LABEL_KEYS[stat.label] ?? stat.label)}
                      </p>

                      <p
                        className="flex items-center gap-1 text-[#6c6c6c] text-[12px] leading-[16.25px]"
                        style={{
                          fontFamily: "Montserrat, sans-serif",
                          fontWeight: 400,
                        }}
                      >
                        {stat.value}

                        {stat.copy && (
                          <button
                            type="button"
                            onClick={() =>
                              navigator.clipboard.writeText(stat.value)
                            }
                            className="inline-flex h-[12px] w-[12px] items-center justify-center text-[#0D2138]"
                            aria-label={t("stats.copyPropertyIdAria")}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="11"
                                height="11"
                                rx="1.5"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
                              <path
                                d="M5 15H4.5C3.67 15 3 14.33 3 13.5V4.5C3 3.67 3.67 3 4.5 3H13.5C14.33 3 15 3.67 15 4.5V5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Features & Amenities */}
      {listingAmenities.length > 0 ? (
        <div className="w-[calc(100%-32px)] sm:w-[calc(100%-64px)] lg:w-[calc(100%-128px)] max-w-[1312px] mx-auto py-8 sm:py-12 lg:py-[70px]">
          <h2
            className="text-[#0d2138] mb-5 text-[22px] sm:text-[24px] leading-[32px]"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              letterSpacing: "-0.24px",
            }}
          >
            {t("sections.featuresAmenities")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {listingAmenities.map((item) => (
              <div
                key={item.label}
                className="bg-white border border-[#e5e7eb] rounded-[10px] sm:rounded-[12px] flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-3 min-h-[55px]"
              >
                <div className="shrink-0 flex items-center justify-center [&>svg]:w-[18px] [&>svg]:h-[18px] sm:[&>svg]:w-[20px] sm:[&>svg]:h-[20px]  [&_[fill]:not([fill=none])]:fill-[#1E4F86]">
                  {item.icon}
                </div>

                <span
                  className="text-[#2b3038] text-[14px] leading-[21px]"
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 500,
                    letterSpacing: "-0.18px",
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Video Preview — always shown; falls back to "Preview Not Available"
          when the listing has no video set. */}
      <VideoPreviewSection videoUrl={listing.videoUrl} title={listing.title} />

      {/* On the Map — hidden until the listing has geocoded coordinates */}
      {listing.latitude !== null && listing.longitude !== null ? (
        <div className="w-[calc(100%-32px)] sm:w-[calc(100%-64px)] lg:w-[calc(100%-128px)] max-w-[1312px] mx-auto py-6 sm:py-8">
          <h2
            className="text-[#0d2138] mb-5 text-[22px] sm:text-[24px] leading-[32px]"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              letterSpacing: "-0.24px",
            }}
          >
            {t("sections.onTheMap")}
          </h2>

          <div className="relative rounded-[14px] sm:rounded-[20px] overflow-hidden h-[240px] sm:h-[360px] lg:h-[442px]">
            <PropertyLocationMap
              latitude={listing.latitude}
              longitude={listing.longitude}
              title={listing.title}
            />

            {/* Location Card */}
            <div className="absolute top-3 left-3 sm:top-5 sm:left-5 w-[290px] max-w-[calc(100%-24px)] rounded-[14px] bg-white px-4 py-3.5 shadow-sm">
              {/* Location Name */}
              <p
                className="mb-2 truncate text-[16px] leading-[22px] text-[#232323]"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 500,
                  letterSpacing: "-0.16px",
                }}
              >
                {listing.location}
              </p>

              {/* Full Address */}
              <p
                className="mb-3 truncate text-[14px] leading-[20px] text-[#6B6B6B]"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 400,
                  letterSpacing: "-0.14px",
                }}
              >
                {listing.fullAddress}
              </p>

              {/* Rating and Reviews */}
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span
                  className="text-[16px] font-medium text-[#232323]"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  5.0
                </span>

                <div className="flex items-center gap-[2px] text-[19px] leading-none text-[#F5A000]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index}>★</span>
                  ))}
                </div>

                <span
                  className="text-[14px] text-[#369BCB]"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {t("map.reviewsCount", { count: (6546).toLocaleString() })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Agent Contact Banner */}
      <div className="w-[calc(100%-38px)] max-w-[1196px] mx-auto py-8 sm:py-12 lg:py-16">
        <div className="bg-[#112b4a] rounded-[22px] sm:rounded-[28px] lg:rounded-[36px] relative overflow-hidden min-h-[auto] lg:min-h-[320px]">
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src={footerBgImg}
              alt=""
              className="w-full h-full object-cover opacity-10"
            />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-stretch gap-7 lg:gap-8 p-5 sm:p-8 lg:p-16">
            {agent ? (
              <>
                {/* Left: Agent */}
                <div className="flex flex-col items-start gap-4 sm:gap-5 lg:w-[280px]">
                  <div className="rounded-full overflow-hidden w-[64px] h-[64px] sm:w-[80px] sm:h-[80px] shrink-0">
                    <img
                      src={agent.avatarUrl ?? agentImg}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <p
                      className="text-white text-[20px] sm:text-[24px] mb-1 leading-[28px] sm:leading-[32px]"
                      style={{
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 500,
                        letterSpacing: "-0.24px",
                      }}
                    >
                      {agent.name}
                    </p>

                    <p
                      className="text-white text-[14px] sm:text-[16px] opacity-80"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      {t("agentCard.role")}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden lg:block w-px bg-[#2B3038] self-stretch" />

                {/* Mobile Divider */}
                <div className="block lg:hidden w-full  bg-white/15" />
              </>
            ) : null}

            {/* Middle: CTA text */}
            <div className="flex flex-col gap-3 sm:gap-4 flex-1">
              <h2
                className="text-white text-[26px] sm:text-[30px] lg:text-[36px] leading-[34px] sm:leading-[40px] lg:leading-[48px]"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 600,
                  letterSpacing: "-0.36px",
                }}
              >
                {t("agentCard.heading")}
              </h2>

              <p
                className="text-white text-[14px] sm:text-[16px] opacity-80 leading-[22px] sm:leading-[24px]"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  letterSpacing: "-0.16px",
                }}
              >
                {t("agentCard.ctaTextBefore")}{" "}
                {agent ? agent.name.split(" ")[0] : t("agentCard.ourTeam")}.
                <br className="hidden sm:block" />
                {t("agentCard.ctaTextAfter")}
              </p>
            </div>

            {/* Right: Buttons */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-4 lg:gap-5 w-full lg:w-[257px] justify-center">
              <button
                onClick={() => setTourModalOpen(true)}
                className="w-full rounded-[48px] px-6 sm:px-8 py-3.5 sm:py-4 text-white text-[14px] sm:text-[16px] transition-opacity hover:opacity-90"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  background: "linear-gradient(to bottom, #005ea4, #006fc2)",
                  border: "1px solid #0088ff",
                }}
              >
                {t("agentCard.scheduleVisit")}
              </button>

              <button
                className="w-full rounded-[48px] px-6 sm:px-8 py-3.5 sm:py-4 text-white text-[14px] sm:text-[16px] border border-[#b9c8d9] hover:bg-white/10 transition-colors"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {t("agentCard.sendInquiry")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer spacer */}
      <div className="h-8" />

      {/* Full-screen image gallery */}
      <ImageLightbox
        images={images}
        startIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        title={listing.title}
      />

      {/* Tour request modal */}
      {tourModalOpen && (
        <ScheduleTourModal
          propertyId={listing.id}
          propertyTitle={listing.title}
          onClose={() => setTourModalOpen(false)}
        />
      )}
    </div>
  );
}
