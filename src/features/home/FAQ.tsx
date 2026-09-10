"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Reveal, RevealItem } from "@/components/common/Reveal";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="37" height="37" viewBox="0 0 37 37" fill="none" className="shrink-0">
      <circle
        cx="18.5"
        cy="18.5"
        r="18"
        stroke={open ? "#005089" : "#6c6c6c"}
        opacity={open ? 1 : 0.3}
      />
      <path
        d="M18.5 22.7929L12.6464 16.9393C12.2559 16.5488 12.2559 15.9157 12.6464 15.5251C13.0369 15.1346 13.6701 15.1346 14.0607 15.5251L18.5 19.9645L22.9393 15.5251C23.3299 15.1346 23.963 15.1346 24.3536 15.5251C24.7441 15.9157 24.7441 16.5488 24.3536 16.9393L18.5 22.7929Z"
        fill={open ? "#005089" : "#6c6c6c"}
        style={{
          transform: open ? "rotate(180deg)" : undefined,
          transformOrigin: "18.5px 18.5px",
        }}
      />
    </svg>
  );
}

type FaqEntry = { id: string; categoryId: string; question: string; answer: string };

export function FAQ() {
  const [openIdx, setOpenIdx] = useState(0);
  const { t } = useTranslation(["home", "faq", "common"]);
  const allFaqs = t("faqs", { ns: "faq", returnObjects: true }) as FaqEntry[];
  const faqs = allFaqs.filter((f) => f.categoryId === "generalInformation");

  return (
    <section className="bg-[#f0f6fa] home-section">
      <div className="home-container flex flex-col lg:flex-row gap-10 lg:gap-16">
        {/* Left column */}
        <div className="flex flex-col gap-5 lg:w-[35%] lg:shrink-0">
          <div className="flex flex-col gap-4">
            <h2
              className="text-[28px] sm:text-[34px] lg:text-[40px] font-medium text-[#00223a] leading-[1.3] tracking-[-0.4px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {t("faq.title", { ns: "home" })}
            </h2>
            <p
              className="text-[16px] sm:text-[18px] text-[#4f4f4f] leading-[1.6]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("faq.blurb", { ns: "home" })}
            </p>
          </div>

          <Link
            href="/contact"
            className="w-fit rounded-[13px] px-7 py-4 text-[16px] font-medium text-white"
            style={{
              fontFamily: "Montserrat, sans-serif",
              background: "linear-gradient(162deg, #005ea4 0%, #006fc2 100%)",
            }}
          >
            {t("getInTouch", { ns: "common" })}
          </Link>
        </div>

        {/* Right column */}
        <Reveal className="min-w-0 flex-1 flex flex-col gap-4" stagger={0.08} amount={0.1}>
          {faqs.map((faq, i) => {
            const open = openIdx === i;
            return (
              <RevealItem
                key={faq.id}
                className={`rounded-2xl bg-white px-5 py-6 sm:px-7 ${open ? "shadow-[0px_8px_24px_rgba(0,80,137,0.08)]" : ""}`}
              >
                <button
                  className="w-full flex items-center justify-between gap-4 text-left"
                  onClick={() => setOpenIdx(open ? -1 : i)}
                  type="button"
                  id={`home-faq-question-${faq.id}`}
                  aria-controls={`home-faq-answer-${faq.id}`}
                  aria-expanded={open}
                >
                  <span
                    className="text-[17px] sm:text-[19px] lg:text-[22px] font-medium text-[#00223a] leading-[1.4]"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {faq.question}
                  </span>
                  <ChevronIcon open={open} />
                </button>

                {open && (
                  <p
                    id={`home-faq-answer-${faq.id}`}
                    role="region"
                    aria-labelledby={`home-faq-question-${faq.id}`}
                    className="mt-4 max-w-[637px] text-[14px] sm:text-[16px] lg:text-[18px] text-[#4f4f4f] leading-[1.5]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    {faq.answer}
                  </p>
                )}
              </RevealItem>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
