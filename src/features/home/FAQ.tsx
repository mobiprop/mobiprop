"use client";

import { useState } from "react";

const faqImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/about-14.png";

const faqs = [
  {
    q: "How does your buying process work?",
    a: "We understand your goals, budget, and preferred areas, then curate listings, arrange viewings, and guide you smoothly from offer to closing.",
  },
  {
    q: "Do you help with mortgage pre-approval?",
    a: "Yes, we work with trusted lending partners to help you get pre-approved quickly and confidently before beginning your home search.",
  },
  {
    q: "Can you coordinate inspections and appraisals?",
    a: "Absolutely. We coordinate all inspections and appraisals on your behalf to ensure a smooth and timely transaction.",
  },
  {
    q: "Do you assist with selling my current home?",
    a: "Yes. We provide full-service listing support including staging advice, photography, pricing strategy, and marketing to attract the right buyers.",
  },
  {
    q: "Are virtual tours available for out-of-state buyers?",
    a: "Yes, we offer high-quality virtual tours and live video walkthroughs to help out-of-state or international buyers make confident decisions remotely.",
  },
];

function PlusIcon({ open }: { open: boolean }) {
  return (
    <div className="w-[46px] h-[46px] bg-white rounded-full flex-shrink-0 flex items-center justify-center transition-transform">
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        {/* Vertical line */}
        <rect
          x="7.75"
          y="0"
          width="1.994"
          height="17"
          rx="1"
          fill="#0d2138"
          style={{
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transformOrigin: "50% 50%",
            transition: "transform 0.2s",
          }}
        />
        {/* Horizontal line */}
        <rect
          x="0"
          y="7.5"
          width="17"
          height="1.994"
          rx="1"
          fill="#0d2138"
          style={{
            transform: open ? "rotate(50deg)" : "rotate(0deg)",
            transformOrigin: "50% 50%",
            transition: "transform 0.2s",
          }}
        />
      </svg>
    </div>
  );
}

export function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section className="bg-[#f8fafc] py-12 sm:py-16 lg:py-20">
  <div className="w-[calc(100%-32px)] sm:w-[calc(100%-48px)] max-w-[1440px] mx-auto">
    <div className="flex flex-col lg:flex-row gap-10 lg:gap-[187px]">
      {/* Left column */}
      <div className="lg:w-[399px] lg:min-h-[492px] flex-shrink-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-[5px] h-[5px] rounded-full bg-[#4896b6]" />
            <span
              className="text-[12px] font-medium text-[#6a7282]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              FAQ
            </span>
          </div>

          <h2
            className="text-[28px] sm:text-[34px] lg:text-[38px] font-semibold text-[#232323] leading-[36px] sm:leading-[42px] lg:leading-[46px]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Frequent Questions
          </h2>
        </div>

        <div className="mt-8 lg:mt-0 flex flex-col gap-3">
          <div className="w-[120px] h-[86px] rounded-[10px] overflow-hidden">
            <img
              src={faqImg}
              alt="FAQ support"
              className="w-full h-full object-cover"
            />
          </div>

          <p
            className="text-[11px] sm:text-[12px] text-[#2b3038] max-w-[210px] leading-[16px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Have more questions? Our team is happy to help.
          </p>

          <button
            className="relative w-fit overflow-hidden rounded-full px-4 py-[7px] text-[11px] font-medium text-white transition-opacity hover:opacity-90"
            style={{
              fontFamily: "Montserrat, sans-serif",
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

            <span className="relative z-10">Get in touch</span>
          </button>
        </div>
      </div>

      {/* Right column */}
      <div className="flex-1 flex flex-col">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="border-b border-[#d1d5dc] py-5 first:pt-0"
          >
            <button
              className="w-full flex items-start justify-between gap-4 text-left"
              onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
            >
              <span
                className="text-[17px] sm:text-[18px] lg:text-[19px] font-medium text-[#0d2138] leading-[26px]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {faq.q}
              </span>

              <span className="flex-shrink-0">
                <PlusIcon open={openIdx === i} />
              </span>
            </button>

            {openIdx === i && (
              <p
                className="max-w-[720px] text-[12px] sm:text-[13px] lg:text-[14px] text-[#2b3038] leading-[20px]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {faq.a}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
  );
}
