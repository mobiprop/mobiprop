"use client";

import { useState } from "react";
import svgPaths from "@/assets/svg-6s7nojygyu";

const heroImg = "/assets/figma-temp/HomePageFinal/b16aec12c6fc13cb05f740947b6c50018c37afae.png";

function LocationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 11.6667 14.3333" fill="none">
      <path d={svgPaths.p1fff3000} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p1a179d80} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14.3333 13" fill="none">
      <path d={svgPaths.p3c430c00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 9 14.3333" fill="none">
      <path d={svgPaths.p16a08f00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="8" viewBox="0 0 11 6" fill="none">
      <path d="M0.5 0.5L5.5 5.5L10.5 0.5" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<"buy" | "rent">("buy");

  return (
    <section className="relative w-full min-h-[600px] lg:min-h-[700px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Luxury property"
          className="w-full h-full object-cover object-bottom"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(250,250,250,0.8)]" />
        <div className="absolute inset-0 bg-[rgba(10,25,53,0.25)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[600px] lg:min-h-[700px] px-4 py-20">
        {/* Title */}
        <div className="text-center text-white max-w-[640px] mb-10">
          <h1
            className="capitalize leading-tight mb-5"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              fontSize: "clamp(36px, 5vw, 64px)",
              letterSpacing: "-0.02em",
            }}
          >
            Your gateway to prestige properties
          </h1>
          <p
            className="leading-[24px] opacity-90"
            style={{ fontFamily: "Poppins, sans-serif", fontSize: "clamp(14px, 2vw, 18px)" }}
          >
            Uncover a world of unique homes and unforgettable experiences.
            <br className="hidden sm:block" />
            Your perfect getaway awaits just a search away!
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full max-w-[1100px] px-4">
          {/* Tabs */}
          <div className="flex">
            <button
              onClick={() => setActiveTab("buy")}
              className={`px-10 py-[14px] text-[14px] font-medium rounded-tl-[12px] transition-all ${
                activeTab === "buy"
                  ? "bg-white text-[#00528f] border border-[#f2f2f2] border-b-0"
                  : "bg-[rgba(0,0,0,0.4)] text-white"
              }`}
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Buy
            </button>
            <button
              onClick={() => setActiveTab("rent")}
              className={`px-10 py-[14px] text-[14px] font-normal transition-all ${
                activeTab === "rent"
                  ? "bg-white text-[#00528f] border border-[#f2f2f2] border-b-0"
                  : "bg-[rgba(0,0,0,0.4)] text-white"
              }`}
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Rent
            </button>
          </div>

          {/* Search Panel */}
          <div className="bg-white rounded-bl-[16px] rounded-br-[16px] rounded-tr-[16px] shadow-[0px_4px_32px_0px_rgba(0,0,0,0.04)] border border-[#e5e7eb]">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4 p-6 lg:p-8">
              {/* Location */}
              <div className="flex flex-col gap-3 flex-1">
                <p
                  className="text-[14px] font-medium text-[#0d2138]"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Location
                </p>
                <div className="flex items-center justify-between border border-[#e5e7eb] rounded-[52px] px-4 py-[14px] bg-white gap-3">
                  <div className="flex items-center gap-3 text-[#4a5565]">
                    <LocationIcon />
                    <span
                      className="text-[14px]"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Lisbon, Portugal
                    </span>
                  </div>
                  <ChevronDown />
                </div>
              </div>

              {/* Property Type */}
              <div className="flex flex-col gap-3 flex-1">
                <p
                  className="text-[14px] font-medium text-[#0d2138]"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Property Type
                </p>
                <div className="flex items-center justify-between border border-[#e5e5e5] rounded-[52px] px-4 py-[14px] bg-white gap-3">
                  <div className="flex items-center gap-3 text-[#4a5565]">
                    <BuildingIcon />
                    <span
                      className="text-[14px]"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Apartment
                    </span>
                  </div>
                  <ChevronDown />
                </div>
              </div>

              {/* Price */}
              <div className="flex flex-col gap-3 flex-1">
                <p
                  className="text-[14px] font-medium text-[#0d2138]"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Price
                </p>
                <div className="flex items-center justify-between border border-[#e5e5e5] rounded-[52px] px-4 py-[14px] bg-white gap-3">
                  <div className="flex items-center gap-3 text-[#4a5565]">
                    <DollarIcon />
                    <span
                      className="text-[14px]"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      10,000 - 15,000
                    </span>
                  </div>
                  <ChevronDown />
                </div>
              </div>

              {/* Search Button */}
              <button
                className="flex-shrink-0 px-7 py-[14px] rounded-[48px] text-white text-[16px] font-medium transition-opacity hover:opacity-90"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  background: "linear-gradient(to bottom, #005ea4, #006fc2)",
                  border: "1px solid #0088ff",
                }}
              >
                Search Properties
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
