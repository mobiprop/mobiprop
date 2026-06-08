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
    <section className="relative w-full min-h-[760px] overflow-hidden sm:min-h-[820px] lg:min-h-[960px] xl:min-h-[1064px]">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Luxury property"
          className="h-full w-full object-fill"
        />
        <div className="absolute inset-0 bg-[rgba(20,78,128,0.12)]" />
        <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-b from-transparent via-[rgba(255,255,255,0.62)] to-[rgba(255,255,255,0.9)]" />
      </div>

      <div className="relative z-10 flex min-h-[760px] flex-col items-center px-4 pt-[128px] pb-10 sm:min-h-[820px] sm:pt-[150px] lg:min-h-[960px] lg:pt-[174px] xl:min-h-[1064px]">
        <div className="mx-auto max-w-[760px] text-center text-white">
          <h1
            className="mb-7 capitalize leading-[74px]"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 500,
              fontSize: "clamp(42px, 4.15vw, 64px)",
              letterSpacing: "0",
            }}
          >
            Your Gateway To
            <br />
            Prestige Properties
          </h1>
          <p
            className="leading-[1.45] opacity-95"
            style={{ fontFamily: "Poppins, sans-serif", fontSize: "clamp(16px, 1.1vw, 18px)" }}
          >
            Uncover a world of unique homes and unforgettable experiences.
            <br className="hidden sm:block" />
            Your perfect getaway awaits just a search away!
          </p>
        </div>

        <div className="mt-auto w-full max-w-[1370px] px-0 pb-6 sm:px-4 lg:pb-9">
          <div className="flex pl-0 sm:pl-0">
            <button
              onClick={() => setActiveTab("buy")}
              className={`h-[60px] w-[145px] text-[14px] font-medium transition-all ${
                activeTab === "buy"
                  ? "bg-white text-[#00528f]"
                  : "bg-[rgba(0,0,0,0.58)] text-white"
              }`}
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Buy
            </button>
            <button
              onClick={() => setActiveTab("rent")}
              className={`h-[60px] w-[145px] text-[14px] font-normal transition-all ${
                activeTab === "rent"
                  ? "bg-white text-[#00528f]"
                  : "bg-[rgba(0,0,0,0.58)] text-white"
              }`}
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Rent
            </button>
          </div>

          <div className="rounded-b-[16px] rounded-tr-[16px] border border-[#e8e8e8] bg-white shadow-[0px_18px_45px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col items-stretch gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:gap-6 lg:px-[42px] lg:py-[40px]">
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <p
                  className="text-[14px] font-medium text-[#0d2138]"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Location
                </p>
                <div className="flex h-[54px] items-center justify-between gap-3 rounded-[52px] border border-[#e2e5ea] bg-white px-5">
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

              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <p
                  className="text-[14px] font-medium text-[#0d2138]"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Property Type
                </p>
                <div className="flex h-[54px] items-center justify-between gap-3 rounded-[52px] border border-[#e2e5ea] bg-white px-5">
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

              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <p
                  className="text-[14px] font-medium text-[#0d2138]"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Price
                </p>
                <div className="flex h-[54px] items-center justify-between gap-3 rounded-[52px] border border-[#e2e5ea] bg-white px-5">
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

              <button
                className="h-[54px] flex-shrink-0 whitespace-nowrap rounded-[48px] px-8 text-[16px] font-medium text-white transition-opacity hover:opacity-90 lg:w-[212px]"
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
