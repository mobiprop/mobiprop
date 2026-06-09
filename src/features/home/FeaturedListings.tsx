"use client";

import { useState } from "react";
import Link from "next/link";
import svgPaths from "@/assets/svg-6s7nojygyu";

const img1 =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/featurelisting1.png";
const img2 =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/featurelisting2.png";
const img3 =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/featurelisting3.png";

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d={svgPaths.p2a65c600}
        stroke="#6A7282"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MarkerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 11.6667 14.3333" fill="none">
      <path
        d={svgPaths.p1fff3000}
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={svgPaths.p1a179d80}
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path
        d="M16.25 7.5H12.5V3.75"
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path
        d="M3.75 12.5H7.5V16.25"
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path
        d="M12.5 16.25V12.5H16.25"
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path
        d="M7.5 3.75V7.5H3.75"
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path
        d={svgPaths.p48eb680}
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path
        d="M1.875 16.25V3.75"
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path
        d="M1.875 13.125H19.375V16.25"
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path
        d="M8.75 6.25H1.875"
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function BathIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path
        d="M5.625 15V16.875"
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path
        d="M14.375 15V16.875"
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path
        d={svgPaths.p376e01f0}
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path
        d={svgPaths.p3f8783b0}
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path
        d={svgPaths.p35ecd900}
        stroke="#2B3038"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

const properties = [
  {
    id: 1,
    img: img1,
    type: "Sale",
    category: "Apartment",
    name: "Coastal Modern Residence",
    location: "Bayshore Gardens, Tampa, FL",
    price: "$8,500,000",
    area: "680 sq.ft",
    beds: "3 Bed",
    baths: "2.5 Bath",
  },
  {
    id: 2,
    img: img2,
    type: "Sale",
    category: "Apartment",
    name: "Coastal Modern Residence",
    location: "Bayshore Gardens, Tampa, FL",
    price: "$8,500,000",
    area: "680 sq.ft",
    beds: "3 Bed",
    baths: "2.5 Bath",
  },
  {
    id: 3,
    img: img3,
    type: "Sale",
    category: "Apartment",
    name: "Coastal Modern Residence",
    location: "Bayshore Gardens, Tampa, FL",
    price: "$8,500,000",
    area: "680 sq.ft",
    beds: "3 Bed",
    baths: "2.5 Bath",
  },
  {
    id: 4,
    img: img1,
    type: "Sale",
    category: "Apartment",
    name: "Coastal Modern Residence",
    location: "Bayshore Gardens, Tampa, FL",
    price: "$8,500,000",
    area: "680 sq.ft",
    beds: "3 Bed",
    baths: "2.5 Bath",
  },
  {
    id: 5,
    img: img2,
    type: "Sale",
    category: "Apartment",
    name: "Coastal Modern Residence",
    location: "Bayshore Gardens, Tampa, FL",
    price: "$8,500,000",
    area: "680 sq.ft",
    beds: "3 Bed",
    baths: "2.5 Bath",
  },
  {
    id: 6,
    img: img3,
    type: "Sale",
    category: "Apartment",
    name: "Coastal Modern Residence",
    location: "Bayshore Gardens, Tampa, FL",
    price: "$8,500,000",
    area: "680 sq.ft",
    beds: "3 Bed",
    baths: "2.5 Bath",
  },
];

function PropertyCard({ property }: { property: (typeof properties)[0] }) {
  const [liked, setLiked] = useState(false);

  return (
    <Link
      href={`/listings/${property.id}`}
      className="flex w-full min-w-0 flex-col gap-4 sm:gap-5 group"
    >
      {/* Image */}
      <div className="relative h-[230px] sm:h-[250px] lg:h-[296px] w-full rounded-[16px] overflow-hidden">
        <img
          src={property.img}
          alt={property.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-wrap gap-1.5 max-w-[calc(100%-72px)]">
          <span
            className="bg-white/90 px-3 py-1 rounded-[36px] text-[12px] sm:text-[14px] text-[#0d2138]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {property.type}
          </span>

          <span
            className="bg-white/90 px-3 py-1 rounded-[36px] text-[12px] sm:text-[14px] text-[#0d2138]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {property.category}
          </span>
        </div>

        {/* Heart */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLiked(!liked);
          }}
          aria-label={liked ? "Remove from favorites" : "Add to favorites"}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill={liked ? "#e74c3c" : "none"}
          >
            <path
              d={svgPaths.p2a65c600}
              stroke={liked ? "#e74c3c" : "#6A7282"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-col gap-[10px]">
        {/* Name + Price row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-[10px] border-b border-[#e5e7eb]">
          <div className="flex min-w-0 flex-col gap-[2px]">
            <span
              className="text-[18px] lg:text-[20px] font-medium text-[#0d2138] leading-[28px] sm:leading-[32px] truncate"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {property.name}
            </span>

            <div className="flex min-w-0 items-center gap-1 text-[#0d2138]">
              <MarkerIcon />
              <span
                className="text-[14px] truncate"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {property.location}
              </span>
            </div>
          </div>

          <span
            className="text-[17px] sm:text-[18px] font-semibold text-[#2b3038] sm:text-right whitespace-nowrap"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {property.price}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <AreaIcon />
            <span
              className="text-[13px] text-[#2b3038]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {property.area}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <BedIcon />
            <span
              className="text-[13px] text-[#2b3038]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {property.beds}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <BathIcon />
            <span
              className="text-[13px] text-[#2b3038]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {property.baths}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function FeaturedListings() {
  const [activeFilter, setActiveFilter] = useState("For Sale");

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-48px)] max-w-[1440px] mx-auto">
  {/* Header */}
  <div className="flex flex-col items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
    {/* Badge */}
    <div className="flex items-center gap-2">
      <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
      <span
        className="text-[14px] sm:text-[16px] font-medium text-[#6a7282] tracking-[-0.01em]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        Properties
      </span>
    </div>

    {/* Title */}
    <div className="text-center">
      <h2
        className="text-[28px] sm:text-[34px] lg:text-[44px] font-semibold text-[#0d2138] leading-[36px] sm:leading-[42px] lg:leading-tight tracking-[-0.01em]"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        Featured Luxury Listings
      </h2>

      <p
        className="mt-2 sm:mt-3 text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[24px] tracking-[-0.01em] max-w-[520px] mx-auto"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        Handpicked exclusive properties that redefine luxury living
      </p>
    </div>

    {/* Filter Buttons */}
    <div className="flex items-center justify-center gap-2 mt-1 sm:mt-0">
      {["For Sale", "For Rent"].map((f) => (
        <button
          key={f}
          onClick={() => setActiveFilter(f)}
          className={`px-5 sm:px-7 py-2 rounded-[36px] text-[14px] sm:text-[16px] font-medium transition-all tracking-[-0.01em] ${
            activeFilter === f
              ? "bg-[#1e4f86] text-white"
              : "bg-white border border-[#e5e7eb] text-[#2b3038] hover:bg-gray-50"
          }`}
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {f}
        </button>
      ))}
    </div>
  </div>

  {/* Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7 lg:gap-8">
    {properties.map((p) => (
      <PropertyCard key={p.id} property={p} />
    ))}
  </div>
</div>
    </section>
  );
}
