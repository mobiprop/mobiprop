"use client";

import { useState } from "react";
import svgPaths from "./singleListingSvgPaths";

const mainImg = "/assets/figma-temp/SingleListingPage/3df686bce4ab0cb035b83bfa5037349820a9349e.png";
const sideImg1 = "/assets/figma-temp/SingleListingPage/9f2ca971b9775dad42514c85278182bc7ce0a318.png";
const sideImg2 = "/assets/figma-temp/SingleListingPage/44a83d93b39fd47ab18e78115b9a8369ceb4b262.png";
const sideImg3 = "/assets/figma-temp/SingleListingPage/f5ff9d7c17bd4dfa82a5ddd8d8b4aa6a4c01102b.png";
const agentImg = "/assets/figma-temp/SingleListingPage/27500dba5ce30da45a1f6b62e331ffea53fb2b67.png";
const videoImg = "/assets/figma-temp/SingleListingPage/75a235ee9f6179ffa3579856ff5a393341c34587.png";
const mapImg = "/assets/figma-temp/SingleListingPage/3a8b8a7d2dac090ff0ac2aaf5760732acab67c7f.png";
const footerBgImg = "/assets/figma-temp/SingleListingPage/3fba757107af3080a480784b8edf8f9a8a4c4646.png";

const amenities = [
  {
    label: "Parking",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d={svgPaths.p1d98b900} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p36e7a000} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M9 17H15" stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p29835400} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Garden",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d={svgPaths.p360d1bb0} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M7.0002 16V22" stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M13.0002 19V22" stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p15de6d20} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Pool",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d={svgPaths.p23954e80} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p7d13a80} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p1597c000} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Gym",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d={svgPaths.p16cc3700} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p2165cae0} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p37d02340} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Balcony",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M18 9L12 3L6 9" stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M12 3V17" stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M4.9998 21H18.9998" stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Elevator",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14.4 14.4L9.6 9.6" stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p3f75e300} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M21.5 21.5L20.1 20.1" stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p39715080} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p3f4a1500} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Security",
    icon: (
      <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
        <path d={svgPaths.p2b59380} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Furnished",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d={svgPaths.p10c26880} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.pbc36600} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M4.0002 18V20" stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M19.9998 18V20" stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d="M12 4.00005V13" stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Pet Friendly",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d={svgPaths.p3835b200} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p2f030500} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.p2c5da200} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <path d={svgPaths.pfabe780} stroke="#1E4F86" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    ),
  },
];

const stats = [
  {
    label: "Type",
    value: "For Sale",
    icon: (
      <svg width="29" height="29" viewBox="0 0 28.6872 28.6872" fill="none">
        <path d={svgPaths.p29733200} fill="#0D2138" />
      </svg>
    ),
  },
  {
    label: "Price",
    value: "$12,500,000",
    icon: (
      <svg width="32" height="22" viewBox="0 0 31.8697 21.2554" fill="none">
        <path d={svgPaths.p1fddb00} fill="#0D2138" />
      </svg>
    ),
  },
  {
    label: "Beds",
    value: "5",
    icon: (
      <svg width="32" height="24" viewBox="0 0 31.875 23.375" fill="none">
        <path d={svgPaths.p28ac6600} fill="#0D2138" />
      </svg>
    ),
  },
  {
    label: "Baths",
    value: "6",
    icon: (
      <svg width="32" height="27" viewBox="0 0 31.875 26.5625" fill="none">
        <path d={svgPaths.p10ba5600} fill="#0D2138" />
      </svg>
    ),
  },
  {
    label: "Size",
    value: "8,100 sq ft",
    icon: (
      <svg width="28" height="24" viewBox="0 0 27.625 23.375" fill="none">
        <path d={svgPaths.pf50f000} fill="#0D2138" />
      </svg>
    ),
  },
  {
    label: "Parking",
    value: "3",
    icon: (
      <svg width="32" height="25" viewBox="0 0 31.875 24.4375" fill="none">
        <path d={svgPaths.pb4bb800} fill="#0D2138" />
      </svg>
    ),
  },
  {
    label: "Lot Size",
    value: "1.1 acres",
    icon: (
      <svg width="24" height="24" viewBox="0 0 23.375 23.375" fill="none">
        <path d={svgPaths.p252b0100} fill="#0D2138" />
      </svg>
    ),
  },
  {
    label: "Built in",
    value: "2021",
    icon: (
      <svg width="26" height="28" viewBox="0 0 25.5 27.625" fill="none">
        <path d={svgPaths.p1ca2bf00} fill="#0D2138" />
      </svg>
    ),
  },
  {
    label: "Floors",
    value: "2 stories",
    icon: (
      <svg width="24" height="28" viewBox="0 0 23.375 27.625" fill="none">
        <path d={svgPaths.p34680200} fill="#0D2138" />
      </svg>
    ),
  },
  {
    label: "Property ID",
    value: "PHF-3128-RN",
    icon: (
      <svg width="28" height="24" viewBox="0 0 27.625 23.375" fill="none">
        <path d={svgPaths.p1ec08e00} fill="#0D2138" />
      </svg>
    ),
  },
];

export function SingleListingPageContent() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-white">
      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-5">
        <p
          className="text-[#0d2138]"
          style={{ fontFamily: "Poppins, sans-serif", fontSize: 24, fontWeight: 500, letterSpacing: "-0.24px", lineHeight: "28px" }}
        >
          Property details
        </p>
      </div>

      {/* Photo Gallery */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pb-8">
        <div className="flex gap-6 items-start">
          {/* Main Image */}
          <div className="relative flex-1 rounded-[20px] overflow-hidden" style={{ height: 536 }}>
            <img src={mainImg} alt="Coastal Modern Residence" className="w-full h-full object-cover" />
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-1">
              {["For Rent", "Apartment", "2026"].map((tag) => (
                <span
                  key={tag}
                  className="bg-white bg-opacity-90 px-3 py-1 rounded-[36px] text-[#0d2138] text-[14px]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Side Images */}
          <div className="flex flex-col gap-4 w-[342px] shrink-0">
            <div className="rounded-[12px] overflow-hidden h-[168px]">
              <img src={sideImg1} alt="Property view 1" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-[12px] overflow-hidden h-[168px]">
              <img src={sideImg2} alt="Property view 2" className="w-full h-full object-cover" />
            </div>
            <div className="relative rounded-[12px] overflow-hidden h-[168px]">
              <img src={sideImg3} alt="Property view 3" className="w-full h-full object-cover" />
              <div className="absolute bottom-3 right-3 bg-white rounded-[50px] px-4 py-2 flex items-center gap-1">
                <span className="text-[#232323] text-[14px]" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500 }}>
                  Show all images  (4)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Property Info Row */}
        <div className="mt-10 flex items-start justify-between">
          {/* Title & Location */}
          <div className="flex flex-col gap-1">
            <h1
              className="text-[#232323]"
              style={{ fontFamily: "Poppins, sans-serif", fontSize: 32, fontWeight: 500, letterSpacing: "-0.32px", lineHeight: "44px" }}
            >
              Coastal Modern Residence
            </h1>
            <div className="flex items-center gap-2 text-[rgba(0,0,0,0.62)] text-[16px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d={svgPaths.p23b22400} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" strokeWidth="1.125" />
                <path d="M9 6.75V12.375" stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" strokeWidth="1.125" />
                <path d={svgPaths.p2e9ace80} stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.7" strokeWidth="1.125" />
              </svg>
              <span>Bayshore Gardens, Tampa, FL</span>
            </div>
          </div>

          {/* Prices */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#1e4f86]" />
                <span className="text-[#1e4f86] text-[16px]" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}>Sale</span>
              </div>
              <span className="text-[#1e4f86] text-[24px]" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, letterSpacing: "-0.24px" }}>
                $749,000
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#4896b6]" />
                <span className="text-[#4896b6] text-[16px]" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}>Rent</span>
              </div>
              <span className="text-[#4896b6] text-[24px]" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, letterSpacing: "-0.24px" }}>
                $548,000
              </span>
            </div>
          </div>
        </div>

        {/* Share Bar */}
        <div className="mt-6 pb-6 border-b border-[#e5e7eb] flex items-center gap-4">
          <span className="text-[#2b3038] text-[16px]" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500 }}>Share:</span>
          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {/* Facebook */}
            <div className="w-6 h-6 overflow-clip relative cursor-pointer">
              <svg viewBox="0 0 20 19.9268" fill="none" className="absolute inset-0 w-full h-full">
                <path d={svgPaths.p5001e80} fill="#0866FF" />
              </svg>
            </div>
            {/* Twitter/X */}
            <div className="w-6 h-6 overflow-clip relative cursor-pointer">
              <svg viewBox="0 0 20 18" fill="none" className="absolute inset-0 w-full h-full">
                <path d={svgPaths.p7cd5f00} fill="black" />
              </svg>
            </div>
            {/* Instagram */}
            <div className="w-6 h-6 rounded-[4px] cursor-pointer overflow-clip relative"
              style={{ background: "radial-gradient(circle at 30% 110%, #ffcc00, #ff4500 40%, #ff0066 70%, #820bff 100%)" }}>
              <svg viewBox="0 0 16 16" fill="none" className="absolute inset-[12.5%] w-[75%] h-[75%]">
                <path d={svgPaths.p208a2600} fill="white" />
              </svg>
            </div>
            {/* LinkedIn */}
            <div className="w-6 h-6 overflow-clip relative cursor-pointer rounded-[3px]">
              <svg viewBox="0 0 20 20" fill="none" className="absolute inset-0 w-full h-full">
                <path d={svgPaths.p25763d00} fill="#0B65C2" clipRule="evenodd" fillRule="evenodd" />
              </svg>
              <svg viewBox="0 0 14 14" fill="none" className="absolute inset-[20.83%] w-[58.34%] h-[58.34%]">
                <path d={svgPaths.p270e9700} fill="white" clipRule="evenodd" fillRule="evenodd" />
              </svg>
            </div>
            {/* WhatsApp */}
            <div className="w-6 h-6 relative cursor-pointer">
              <svg viewBox="0 0 22 22" fill="none" className="absolute inset-[4.17%] w-[91.66%] h-[91.66%]">
                <path d={svgPaths.p9487800} fill="white" />
              </svg>
              <svg viewBox="0 0 18.2089 18.1286" fill="none" className="absolute inset-[11.84%] w-[76.29%] h-[75.53%]">
                <path d={svgPaths.p36a91e00} fill="url(#wa_grad)" />
                <defs>
                  <linearGradient id="wa_grad" x1="8.919" x2="9.011" y1="1.088" y2="16.58" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#57D163" />
                    <stop offset="1" stopColor="#23B33A" />
                  </linearGradient>
                </defs>
              </svg>
              <svg viewBox="0 0 11.1241 10.271" fill="none" className="absolute w-[46.35%] h-[42.79%]" style={{ inset: "28.61% 26.65% 28.59% 27%" }}>
                <path d={svgPaths.p3bc74772} fill="white" clipRule="evenodd" fillRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[32px] border border-[#d1d5dc] text-[#2b3038] text-[14px] hover:bg-gray-50 transition-colors"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            <svg width="14" height="14" viewBox="0 0 14.2581 14.2447" fill="none">
              <path d={svgPaths.p3d13b600} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8">
        <h2 className="text-[#0d2138] mb-6" style={{ fontFamily: "Poppins, sans-serif", fontSize: 24, fontWeight: 500, letterSpacing: "-0.24px", lineHeight: "28px" }}>
          Description
        </h2>
        <p className="text-[#0d2138] text-[16px] mb-4" style={{ fontFamily: "Montserrat, sans-serif", lineHeight: "24px", letterSpacing: "-0.16px" }}>
          A bright coastal-inspired home offering modern interiors, spacious living areas, and elegant finishes throughout. Ideal for buyers seeking comfort, style, and a well-located property close to Tampa's best amenities and attractions.
        </p>
        <div className="flex items-start gap-4 mt-4">
          <div className="w-px bg-[#d4d4d4] self-stretch" style={{ minHeight: 60 }} />
          <p className="text-[#2b3038] text-[16px] italic" style={{ fontFamily: "Inter, sans-serif", lineHeight: "28.8px", letterSpacing: "-0.48px" }}>
            This Beverly Hills villa redefines <strong>modern elegance and exclusivity</strong>. Featuring expansive interiors, outdoor entertainment areas, and breathtaking city views, it is "crafted for those who seek the ultimate luxury lifestyle in Los Angeles."
          </p>
        </div>
      </div>

      {/* Property Details Stats */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8">
        <h2 className="text-[#0d2138] mb-6" style={{ fontFamily: "Poppins, sans-serif", fontSize: 24, fontWeight: 500, letterSpacing: "-0.24px", lineHeight: "28px" }}>
          Property details
        </h2>
        <div className="bg-[#f8fafc] rounded-[20px] p-8">
          <div className="flex flex-wrap gap-y-8 gap-x-4">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-0">
                <div className="flex flex-col items-center gap-3 min-w-[80px] px-4">
                  <div className="flex items-center justify-center h-8">{stat.icon}</div>
                  <div className="text-center">
                    <p className="text-[#2b3038] text-[16px]" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, letterSpacing: "-0.18px" }}>{stat.label}</p>
                    <p className="text-[#2b3038] opacity-70 text-[15px]" style={{ fontFamily: "Montserrat, sans-serif" }}>{stat.value}</p>
                  </div>
                </div>
                {i < stats.length - 1 && (
                  <div className="w-px bg-[#e5e7eb] h-[95px] hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features & Amenities */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8">
        <h2 className="text-[#0d2138] mb-6" style={{ fontFamily: "Poppins, sans-serif", fontSize: 24, fontWeight: 500, letterSpacing: "-0.24px", lineHeight: "28px" }}>
          Features & Amenities
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {amenities.map((item) => (
            <div
              key={item.label}
              className="bg-white border border-[#e5e7eb] rounded-[12px] flex items-center gap-3 px-5 py-3 h-[50px]"
            >
              {item.icon}
              <span className="text-[#2b3038] text-[18px]" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, letterSpacing: "-0.18px" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Video Preview */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8">
        <h2 className="text-[#0d2138] mb-6" style={{ fontFamily: "Poppins, sans-serif", fontSize: 24, fontWeight: 500, letterSpacing: "-0.24px", lineHeight: "28px" }}>
          Video Preview
        </h2>
        <div className="relative rounded-[20px] overflow-hidden bg-[#bfbfbf]" style={{ height: 566 }}>
          <img src={videoImg} alt="Video preview" className="w-full h-full object-cover" />
          {/* YouTube Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{ width: 127, height: 127 }}>
              <svg viewBox="0 0 111.425 79.5892" fill="none" className="absolute" style={{ inset: "18.75% 6.25%", width: "87.5%", height: "62.5%" }}>
                <path d={svgPaths.p3b152600} fill="#FC0D1B" />
              </svg>
              <svg viewBox="0 0 31.8357 31.8357" fill="none" className="absolute" style={{ inset: "37.5% 34.38% 37.5% 40.62%", width: "25.62%", height: "25%" }}>
                <path d={svgPaths.p277c6500} fill="white" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* On the Map */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8">
        <h2 className="text-[#0d2138] mb-6" style={{ fontFamily: "Poppins, sans-serif", fontSize: 24, fontWeight: 500, letterSpacing: "-0.24px", lineHeight: "28px" }}>
          On the Map
        </h2>
        <div className="relative rounded-[20px] overflow-hidden" style={{ height: 536 }}>
          <img src={mapImg} alt="Map" className="w-full h-full object-cover rounded-[20px]" />
          {/* Location Card */}
          <div className="absolute top-5 left-5 bg-white rounded-[10px] p-3 w-[213px]">
            <p className="text-[#232323] text-[14px] mb-1" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500, letterSpacing: "-0.14px" }}>Buenos Aires, Argentina</p>
            <p className="text-[#5f5f5f] text-[12px] mb-2" style={{ fontFamily: "Poppins, sans-serif", letterSpacing: "-0.12px" }}>Av. Santa Fe 1234, BA, Argentina</p>
            <div className="flex items-center gap-1">
              <span className="text-[#232323] text-[14px]" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500 }}>5.0</span>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 13.3351 12.6675" fill="none">
                  <path d={svgPaths.p3684cf00} fill="#F5A405" />
                </svg>
              ))}
              <span className="text-[#4896b6] text-[12px] ml-1" style={{ fontFamily: "Poppins, sans-serif" }}>6,546</span>
            </div>
          </div>
          {/* Map Controls */}
          <div className="absolute right-6 bottom-6 flex flex-col gap-3">
            <button className="bg-white rounded-full shadow-lg p-3 flex items-center justify-center">
              <svg width="17" height="17" viewBox="0 0 16.9302 16.9302" fill="none">
                <path d={svgPaths.p3d32ae80} stroke="#232323" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.81395" />
              </svg>
            </button>
            <div className="bg-white rounded-full shadow-lg flex flex-col items-center">
              <button className="p-3 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12.3953 12.3953" fill="none">
                  <path d={svgPaths.p305e76c0} stroke="#232323" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.81395" />
                </svg>
              </button>
              <div className="w-10 h-px bg-white" />
              <button className="p-3 flex items-center justify-center">
                <svg width="12" height="2" viewBox="0 0 12.3953 1.81395" fill="none">
                  <path d="M0.906977 0.906977H11.4884" stroke="#232323" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.81395" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Contact Banner */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8">
        <div className="bg-[#112b4a] rounded-[36px] relative overflow-hidden" style={{ minHeight: 320 }}>
          {/* Background image */}
          <div className="absolute inset-0">
            <img src={footerBgImg} alt="" className="w-full h-full object-cover opacity-10" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-stretch gap-8 p-10 lg:p-16">
            {/* Left: Agent */}
            <div className="flex flex-col items-start gap-5 lg:w-[280px]">
              <div className="rounded-full overflow-hidden" style={{ width: 80, height: 80 }}>
                <img src={agentImg} alt="Emily Carter" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-white text-[24px] mb-1" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500, letterSpacing: "-0.24px" }}>Emily Carter</p>
                <p className="text-white text-[16px] opacity-80" style={{ fontFamily: "Montserrat, sans-serif" }}>Listing Agent</p>
              </div>
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="22" height="22" viewBox="0 0 18.9649 18.2953" fill="none">
                    <path d={svgPaths.p236f5cd0} fill="#FFB86A" />
                  </svg>
                ))}
                <span className="text-[#f8fafc] text-[16px] ml-1" style={{ fontFamily: "Montserrat, sans-serif" }}>5 stars</span>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px bg-[#2B3038] self-stretch" />

            {/* Middle: CTA text */}
            <div className="flex flex-col gap-4 flex-1">
              <h2 className="text-white" style={{ fontFamily: "Poppins, sans-serif", fontSize: 36, fontWeight: 600, letterSpacing: "-0.36px", lineHeight: "48px" }}>
                Ready to see this property
              </h2>
              <p className="text-white text-[16px] opacity-80" style={{ fontFamily: "Montserrat, sans-serif", lineHeight: "24px", letterSpacing: "-0.16px" }}>
                Book a Private tour or send a message directly to Emily.<br />
                No commitment needed
              </p>
            </div>

            {/* Right: Buttons */}
            <div className="flex flex-col gap-5 lg:w-[257px] justify-center">
              <button
                className="rounded-[48px] px-8 py-4 text-white text-[16px] transition-opacity hover:opacity-90"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  background: "linear-gradient(to bottom, #005ea4, #006fc2)",
                  border: "1px solid #0088ff",
                }}
              >
                Schedule a Visit
              </button>
              <button
                className="rounded-[48px] px-8 py-4 text-white text-[16px] border border-[#b9c8d9] hover:bg-white/10 transition-colors"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Send Inquiry
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer spacer */}
      <div className="h-8" />
    </div>
  );
}
