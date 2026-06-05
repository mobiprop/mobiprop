"use client";

import { useState } from "react";
import Link from "next/link";
import svgPaths from "@/assets/svg-6s7nojygyu";

const img1 = "/assets/figma-temp/HomePageFinal/86a765c8069553ebf60e60f32ad44c8911a8dc43.png";
const img2 = "/assets/figma-temp/HomePageFinal/f186df3ffecd1693fc361700e857c2ed57a551fd.png";
const img3 = "/assets/figma-temp/HomePageFinal/5093201b514c15b859f33d9514c53dff534ca77b.png";

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d={svgPaths.p2a65c600} stroke="#6A7282" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MarkerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 11.6667 14.3333" fill="none">
      <path d={svgPaths.p1fff3000} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p1a179d80} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AreaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M16.25 7.5H12.5V3.75" stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M3.75 12.5H7.5V16.25" stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M12.5 16.25V12.5H16.25" stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M7.5 3.75V7.5H3.75" stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d={svgPaths.p48eb680} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M1.875 16.25V3.75" stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M1.875 13.125H19.375V16.25" stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M8.75 6.25H1.875" stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
    </svg>
  );
}

function BathIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M5.625 15V16.875" stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d="M14.375 15V16.875" stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d={svgPaths.p376e01f0} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d={svgPaths.p3f8783b0} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
      <path d={svgPaths.p35ecd900} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
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
    <Link href={`/listings/${property.id}`} className="flex flex-col gap-5 group">
      {/* Image */}
      <div className="relative h-[260px] lg:h-[296px] rounded-[16px] overflow-hidden">
        <img
          src={property.img}
          alt={property.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-1">
          <span
            className="bg-white opacity-90 px-3 py-1 rounded-[36px] text-[13px] text-[#0d2138]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {property.type}
          </span>
          <span
            className="bg-white opacity-90 px-3 py-1 rounded-[36px] text-[13px] text-[#0d2138]"
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
          className="absolute top-4 right-4 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-sm"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill={liked ? "#e74c3c" : "none"}>
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
      <div className="flex flex-col gap-[10px]">
        {/* Name + Price row */}
        <div className="flex items-start justify-between pb-[10px] border-b border-[#e5e7eb]">
          <div className="flex flex-col gap-[2px]">
            <span
              className="text-[18px] lg:text-[20px] font-medium text-[#0d2138] leading-[32px] truncate max-w-[220px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {property.name}
            </span>
            <div className="flex items-center gap-1 text-[#0d2138]">
              <MarkerIcon />
              <span
                className="text-[13px] truncate max-w-[180px]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {property.location}
              </span>
            </div>
          </div>
          <span
            className="text-[17px] font-semibold text-[#2b3038] text-right whitespace-nowrap ml-2"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {property.price}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 flex-wrap">
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
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16">
        {/* Header */}
        <div className="flex flex-col items-center gap-6 mb-10">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
            <span
              className="text-[16px] font-medium text-[#6a7282] tracking-[-0.01em]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Properties
            </span>
          </div>

          {/* Title */}
          <div className="text-center">
            <h2
              className="text-[32px] lg:text-[44px] font-semibold text-[#0d2138] leading-tight tracking-[-0.01em]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Featured Luxury Listings
            </h2>
            <p
              className="mt-3 text-[15px] lg:text-[16px] text-[#2b3038] tracking-[-0.01em]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Handpicked exclusive properties that redefine luxury living
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            {["For Sale", "For Rent"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-7 py-2 rounded-[36px] text-[15px] font-medium transition-all ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
