"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

const bgImg = "/hero/cta-footer-bg.webp";

export function ConsultationBanner() {
  const { t } = useTranslation("home");

  return (
    <section className="relative w-full h-[400px] sm:h-[440px] lg:h-[483px] overflow-hidden">
      <img src={bgImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,34,58,0.46) 0%, rgba(0,34,58,0.8) 53%, rgba(0,34,58,0.41) 100%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="flex w-full max-w-[866px] flex-col items-center gap-5">
          <div className="flex items-center gap-3 w-full max-w-[866px]">
            <div className="h-px flex-1 bg-white/30" />
            <span
              className="text-[13px] sm:text-[14px] font-medium text-white whitespace-nowrap"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("cta.badge")}
            </span>
            <div className="h-px flex-1 bg-white/30" />
          </div>

          <div className="max-w-[622px]">
            <h2
              className="text-[32px] sm:text-[38px] lg:text-[44px] font-normal text-white leading-tight tracking-[-1px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {t("cta.title")}
            </h2>
            <p
              className="mt-3.5 leading-[26px] text-[14px] sm:text-[16px] text-[#fbfbfb]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("cta.subtitle")}
            </p>
          </div>
        </div>

        <Link
          href="/contact"
          className="flex h-12 items-center justify-center rounded-[13px] px-7 text-[16px] font-medium text-white"
          style={{
            fontFamily: "Montserrat, sans-serif",
            background: "linear-gradient(163deg, #005ea4 0%, #006fc2 100%)",
          }}
        >
          {t("getInTouch", { ns: "common" })}
        </Link>
      </div>
    </section>
  );
}
