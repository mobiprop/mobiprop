"use client";

import { useState } from "react";

const faqImg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/about-14.png";

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
        <rect x="7.75" y="0" width="1.994" height="17" rx="1" fill="#0d2138" style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)", transformOrigin: "50% 50%", transition: "transform 0.2s" }}/>
        {/* Horizontal line */}
        <rect
          x="0"
          y="7.5"
          width="17"
          height="1.994"
          rx="1"
          fill="#0d2138"
          style={{ transform: open ? "rotate(50deg)" : "rotate(0deg)", transformOrigin: "50% 50%", transition: "transform 0.2s" }}
        />
      </svg>
    </div>
  );
}

export function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section className="bg-[#f8fafc] py-16 lg:py-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* Left column */}
          <div className="lg:w-[280px] flex-shrink-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
                <span
                  className="text-[16px] font-medium text-[#6a7282]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  FAQ
                </span>
              </div>
              <h2
                className="text-[34px] lg:text-[40px] font-semibold text-[#232323] leading-tight whitespace-pre-line"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {`Frequent\nQuestions`}
              </h2>
            </div>

            <div className="mt-8 lg:mt-12 flex flex-col gap-3">
              <div className="w-[140px] h-[110px] rounded-[10px] overflow-hidden">
                <img
                  src={faqImg}
                  alt="FAQ support"
                  className="w-full h-full object-cover"
                />
              </div>
              <p
                className="text-[14px] text-[#2b3038] max-w-[220px] leading-[20px]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Have more questions? Our team is happy to help.
              </p>
              <button
                className="w-fit px-6 py-2 rounded-full text-[14px] font-medium text-white"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  background: "linear-gradient(to bottom, #005ea4, #006fc2)",
                  border: "1px solid #0088ff",
                }}
              >
                Get in touch
              </button>
            </div>
          </div>

          {/* Right column - accordion */}
          <div className="flex-1 flex flex-col gap-8">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-[#d1d5dc] pb-7">
                <button
                  className="w-full flex items-center justify-between gap-4 text-left"
                  onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
                >
                  <span
                    className="text-[20px] lg:text-[24px] font-medium text-[#0d2138] leading-[28px]"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {faq.q}
                  </span>
                  <PlusIcon open={openIdx === i} />
                </button>
                {openIdx === i && (
                  <p
                    className="mt-4 text-[15px] lg:text-[16px] text-[#2b3038] leading-[24px]"
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
