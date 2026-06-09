"use client";

import { useState } from "react";
import svgPaths from "@/assets/svg-6s7nojygyu";

const img1 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/matrilande.png";
const img2 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/mayling.png";
const img3 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/aryes.png";
const img4 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/pilar.png";
const img5 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/vihana.png";

function ArrowUpRight({ color = "#0D2138" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 22.5352 22.5352" fill="none">
      <path d={svgPaths.p34775480} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.87793" />
      <path d={svgPaths.pc406604} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.87793" />
    </svg>
  );
}

const tabs = ["All", "Gated Communities", "Condominiums", "Office Buildings", "Mixed Use"];

const spots = [
  { id: 1, img: img1, name: "Martindale", type: "Country Club", featured: true },
  { id: 2, img: img2, name: "Mayling", type: "Country Club", featured: false },
  { id: 3, img: img3, name: "Ayres de Pilar", type: "Barrio Privado", featured: false },
  { id: 4, img: img4, name: "Bouquet Pilar", type: "Condominio", featured: false },
  { id: 5, img: img5, name: "Vilahaus", type: "Condominio", featured: false },
];

export function FeaturedSpots() {
  const [activeTab, setActiveTab] = useState("Condominiums");

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="w-[calc(100%-48px)] max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="flex items-center gap-2">
            <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
            <span
              className="text-[14px] sm:text-[16px] font-medium text-[#6a7282]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Location
            </span>
          </div>
          <div className="text-center">
            <h2
              className="text-[28px] sm:text-[34px] lg:text-[44px] font-semibold text-[#0d2138] leading-tight"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Featured Spots
            </h2>
            <p
              className="mt-3 text-[14px] sm:text-[16px] text-[#2b3038] max-w-[460px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Explore the cities our clients love for their comfort and market strength
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-[6px] rounded-[60px] text-[14px] transition-all ${
                  activeTab === tab
                    ? "bg-[#1e4f86] text-white font-medium"
                    : "bg-white border border-[#f3f4f6] text-[#2b3038]"
                }`}
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Top row: 2 large cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {spots.slice(0, 2).map((spot, i) => (
            <div key={spot.id} className="flex flex-col gap-5">
              <div className="h-[300px] lg:h-[400px] rounded-[24px] overflow-hidden bg-[#f3f4f6]">
                <img src={spot.img} alt={spot.name} className="w-full h-full object-cover" />
              </div>
             <div className="flex items-start justify-between gap-3">
  <div className="min-w-0">
    <p
      className="text-[20px] sm:text-[22px] lg:text-[24px] font-medium text-[#0d2138] leading-[24px] sm:leading-[26px] lg:leading-[28px]"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      {spot.name}
    </p>

    <p
      className="mt-1 text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038]"
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      {spot.type}
    </p>
  </div>

  <button
    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 border border-[#d1d5dc] ${
      i === 0 ? "bg-[#1e4f86]" : "bg-[#f8fafc]"
    }`}
  >
    <ArrowUpRight color={i === 0 ? "white" : "#0D2138"} />
  </button>
</div>
            </div>
          ))}
        </div>

        {/* Bottom row: 3 smaller cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {spots.slice(2).map((spot) => (
            <div key={spot.id} className="flex flex-col gap-5">
              <div className="h-[240px] rounded-[20px] overflow-hidden bg-[#f3f4f6]">
                <img src={spot.img} alt={spot.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className="text-[20px] sm:text-[22px] lg:text-[24px] font-medium  text-[#0d2138] leading-[28px]"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {spot.name}
                  </p>
                  <p
                    className="text-[16px] text-[#2b3038]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    {spot.type}
                  </p>
                </div>
                <button className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-[#f8fafc] border border-[#d1d5dc]">
                  <ArrowUpRight />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
