"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Reveal, RevealItem } from "@/components/common/Reveal";
import { SplitHeading } from "@/components/common/SplitHeading";

function PlusIcon({ open }: { open: boolean }) {
  return (
    <div className="w-[30px] h-[30px] sm:w-[46px] sm:h-[46px] bg-white rounded-full flex-shrink-0 flex items-center justify-center transition-transform">
      <svg
  className="w-[12px] h-[12px] sm:w-[17px] sm:h-[17px]"
  viewBox="0 0 17 17"
  fill="none"
>
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

type FaqEntry = { id: string; categoryId: string; question: string; answer: string };

export function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);
  const { t } = useTranslation(["home", "faq", "common"]);
  const allFaqs = t("faqs", { ns: "faq", returnObjects: true }) as FaqEntry[];
  const faqs = allFaqs.filter((f) => f.categoryId === "generalInformation");

  return (
    <section className="bg-[#f8fafc] py-12 sm:py-16 lg:py-20">
  <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto">
    <div className="flex flex-col lg:flex-row gap-10 lg:gap-[88px]">
      {/* Left column */}
      <Reveal as="div" direction="left" amount={0.4} className="lg:w-[399px] lg:min-h-[492px] flex !flex-col lg:flex-row gap-10 lg:gap-[187px]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-[5px] h-[5px] rounded-full bg-[#4896b6]" />
            <span
              className="text-[16px] font-medium text-[#6a7282]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("faq.badge", { ns: "home" })}
            </span>
          </div>

          <SplitHeading
            as="h2"
            text={t("faq.title", { ns: "home" })}
            className="text-[26px] sm:text-[34px] lg:text-[40px] font-semibold text-[#232323] leading-[36px] sm:leading-[42px] lg:leading-[46px]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          />
        </div>

        <div className="mt-8 lg:mt-0 flex flex-col gap-3">
          <p
            className="text-[11px] sm:text-[14px] text-[#2b3038] max-w-[236px] leading-[16px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {t("faq.blurb", { ns: "home" })}
          </p>

          <Link
            href="/contact"
            className="relative w-fit overflow-hidden rounded-full px-4 py-[7px] text-[14px] font-medium text-white transition-opacity hover:opacity-90"
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

            <span className="relative z-10">{t("getInTouch", { ns: "common" })}</span>
          </Link>
        </div>
      </Reveal>

      {/* Right column */}
      <Reveal className="flex-1 flex flex-col" direction="right" stagger={0.08} amount={0.1}>
        {faqs.map((faq, i) => (
          <RevealItem
            key={faq.id}
            className="border-b border-[#d1d5dc] py-5 first:pt-0"
          >
            <button
              className="w-full flex items-start justify-between gap-4 text-left"
              onClick={() => setOpenIdx(openIdx === i ? -1 : i)}
            >
              <span
                className="text-[17px] sm:text-[18px] lg:text-[24px] font-medium text-[#0d2138] leading-[26px]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {faq.question}
              </span>

              <span className="flex-shrink-0">
                <PlusIcon open={openIdx === i} />
              </span>
            </button>

            {openIdx === i && (
              <p
                className="max-w-[803.67px] mt-[10px] text-[12px] sm:text-[13px] lg:text-[16px] text-[#2b3038] leading-[18px] sm:leading-[22px] lg:leading-[24px]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {faq.answer}
              </p>
            )}
          </RevealItem>
        ))}
      </Reveal>
    </div>
  </div>
</section>
  );
}
