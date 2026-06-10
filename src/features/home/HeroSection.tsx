"use client";

import { useState } from "react";
import svgPaths from "@/assets/svg-6s7nojygyu";

const heroImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/homehero.png";

function LocationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 11.6667 14.3333" fill="none">
      <path
        d={svgPaths.p1fff3000}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={svgPaths.p1a179d80}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14.3333 13" fill="none">
      <path
        d={svgPaths.p3c430c00}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 9 14.3333" fill="none">
      <path
        d={svgPaths.p16a08f00}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="8" viewBox="0 0 11 6" fill="none">
      <path
        d="M0.5 0.5L5.5 5.5L10.5 0.5"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<"buy" | "rent">("buy");

  return (
    <section className="relative w-full min-h-[760px] overflow-hidden sm:min-h-[820px] lg:min-h-[960px] xl:min-h-[950px]">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Luxury property"
          className="h-full w-full object-fill"
        />
        <div className="absolute inset-0 bg-[rgba(20,78,128,0.12)]" />
        <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.62)] to-[rgba(255,255,255,0.9)]" />
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-70px)] flex-col items-center px-4 pt-[70px] pb-6 sm:pt-[90px] lg:pt-[95px]">
  <div className="mx-auto max-w-[760px] text-center text-white">
    <h1
      className="mb-4 sm:mb-5 capitalize text-[32px] sm:text-[42px] md:text-[54px] lg:text-[60px] leading-[39px] sm:leading-[50px] md:leading-[64px] lg:leading-[70px]"
      style={{
        fontFamily: "Poppins, sans-serif",
        fontWeight: 500,
        letterSpacing: "0",
      }}
    >
      Your Gateway To
      <br />
      Prestige Properties
    </h1>

    <p
      className="mx-auto max-w-[620px] text-[14px] sm:text-[16px] lg:text-[17px] leading-[22px] sm:leading-[24px] opacity-95"
      style={{
        fontFamily: "Poppins, sans-serif",
      }}
    >
      Uncover a world of unique homes and unforgettable experiences.
      <br className="hidden sm:block" />
      Your perfect getaway awaits just a search away!
    </p>
  </div>

  <div className="mt-auto w-full max-w-[1370px] px-0 pb-4 sm:px-4 lg:pb-6">
    <div className="flex pl-0">
      <button
        onClick={() => setActiveTab("buy")}
        className={`h-[52px] sm:h-[56px] lg:h-[60px] w-[130px] sm:w-[145px] text-[14px] font-medium transition-all border-t border-l border-r rounded-tl-2xl ${
          activeTab === "buy"
            ? "bg-white text-[#00528f] border-[#e8e8e8]"
            : "bg-[rgba(0,0,0,0.58)] text-white border-[#d5d5d552]"
        }`}
        style={{
          fontFamily: "Montserrat, sans-serif",
          letterSpacing: "-0.01em",
        }}
      >
        Buy
      </button>

      <button
        onClick={() => setActiveTab("rent")}
        className={`h-[52px] sm:h-[56px] lg:h-[60px] w-[130px] sm:w-[145px] text-[14px] font-normal transition-all border-t border-r ${
          activeTab === "rent"
            ? "bg-white text-[#00528f] border-[#e8e8e8]"
            : "bg-[rgba(0,0,0,0.58)] text-white border-[#d5d5d552]"
        }`}
        style={{
          fontFamily: "Montserrat, sans-serif",
          letterSpacing: "-0.01em",
        }}
      >
        Rent
      </button>
    </div>

    <div className="rounded-b-[16px] rounded-tr-[16px] border border-[#e8e8e8] bg-white shadow-[0px_18px_45px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col items-stretch gap-4 p-4 sm:p-5 lg:flex-row lg:items-end lg:gap-5 lg:px-8 lg:py-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p
            className="text-[14px] font-medium text-[#0d2138]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Location
          </p>

          <div className="flex h-[50px] lg:h-[54px] items-center justify-between gap-3 rounded-[52px] border border-[#e2e5ea] bg-white px-4 lg:px-5">
            <div className="flex min-w-0 items-center gap-3 text-[#4a5565]">
              <LocationIcon />
              <span
                className="truncate text-[14px]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Lisbon, Portugal
              </span>
            </div>
            <ChevronDown />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p
            className="text-[14px] font-medium text-[#0d2138]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Property Type
          </p>

          <div className="flex h-[50px] lg:h-[54px] items-center justify-between gap-3 rounded-[52px] border border-[#e2e5ea] bg-white px-4 lg:px-5">
            <div className="flex min-w-0 items-center gap-3 text-[#4a5565]">
              <BuildingIcon />
              <span
                className="truncate text-[14px]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Apartment
              </span>
            </div>
            <ChevronDown />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p
            className="text-[14px] font-medium text-[#0d2138]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Price
          </p>

          <div className="flex h-[50px] lg:h-[54px] items-center justify-between gap-3 rounded-[52px] border border-[#e2e5ea] bg-white px-4 lg:px-5">
            <div className="flex min-w-0 items-center gap-3 text-[#4a5565]">
              <DollarIcon />
              <span
                className="truncate text-[14px]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                10,000 - 15,000
              </span>
            </div>
            <ChevronDown />
          </div>
        </div>

        <button
          className="relative h-[50px] lg:h-[54px] flex-shrink-0 overflow-hidden whitespace-nowrap rounded-[48px] px-8 text-[15px] lg:text-[16px] font-medium text-white transition-opacity hover:opacity-90 lg:w-[212px]"
          style={{
            fontFamily: "Poppins, sans-serif",
            background: "linear-gradient(to bottom, #005ea4, #006fc2)",
            border: "1px solid #0088ff",
          }}
        >
          <span
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "url('/assets/figma-temp/BlogPage/btn-img.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <span className="relative z-10">Search Properties</span>
        </button>
      </div>
    </div>
  </div>
</div>
    </section>
  );
}
