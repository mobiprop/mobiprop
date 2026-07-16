"use client";

import { useTranslation } from "react-i18next";
import svgPaths from "@/assets/svg-6s7nojygyu";

const personImg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/whyexpert.webp";

const STAT_VALUES = ["84%", "$5M+", "3 in 5", "95%"];
const STAT_ICONS = [
  <svg key="0" width="32" height="32" viewBox="0 0 34.1918 34.1731" fill="none">
    <path d={svgPaths.p2cb34680} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
  </svg>,
  <svg key="1" width="32" height="32" viewBox="0 0 25 39.6667" fill="none">
    <path d={svgPaths.p3ec057c0} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
  </svg>,
  <svg key="2" width="32" height="32" viewBox="0 0 39.6667 39.6667" fill="none">
    <path d={svgPaths.p1a11c480} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
  </svg>,
  <svg key="3" width="32" height="32" viewBox="0 0 39.4325 36.0007" fill="none">
    <path d={svgPaths.p1fbdbc80} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
  </svg>,
];

export function WhyUs() {
  const { t } = useTranslation("home");
  const stats = (t("whyUs.stats", { returnObjects: true }) as { label: string; desc: string }[]).map(
    (s, i) => ({ ...s, value: STAT_VALUES[i], icon: STAT_ICONS[i] }),
  );

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto">
  {/* Section Header */}
  <div className="flex flex-col items-center gap-3 sm:gap-4 mb-8 sm:mb-10 lg:mb-12">
    <div className="flex items-center gap-2">
      <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
      <span
        className="text-[14px] sm:text-[16px] font-medium text-[#6a7282]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        {t("whyUs.badge")}
      </span>
    </div>

    <div className="text-center">
      <h2
        className="text-[28px] sm:text-[34px] lg:text-[44px] font-semibold text-[#232323] leading-[36px] sm:leading-[42px] lg:leading-tight"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {t("whyUs.title")}
      </h2>

      <p
        className="mt-2 sm:mt-3 text-[14px] sm:text-[16px] text-[#2b3038] max-w-[460px] mx-auto leading-[22px] sm:leading-[24px]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        {t("whyUs.subtitle")}
      </p>
    </div>
  </div>

  {/* Content row */}
  <div className="flex flex-col lg:flex-row gap-5 sm:gap-6">
    {/* Left - Dark card with person */}
    <div className="relative bg-[#111112] rounded-[20px] overflow-hidden w-full lg:w-[591px] flex-shrink-0 min-h-[420px] sm:min-h-[520px] lg:min-h-[688px]">
      <img
        src={personImg}
        alt="Agent"
        className="w-full h-full object-cover object-top absolute inset-0"
      />

      {/* Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(179.963deg, rgba(146,146,146,0) 49.928%, rgba(68,68,68,0.42) 73.946%, rgba(0,0,0,0.6) 95.036%)",
        }}
      />

      {/* Top badge */}
      <div className="absolute top-5 left-5 sm:top-6 sm:left-6 right-5 flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-[7px] h-[7px] rounded-full p-[1px] bg-gradient-to-b from-[rgba(0,136,255,0.3)] to-[rgba(119,192,255,0.3)]">
            <div className="w-full h-full rounded-full bg-white" />
          </div>

          <span
            className="text-white text-[14px] sm:text-[16px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {t("whyUs.cardBadge")}
          </span>
        </div>

        <p
          className="text-white text-[22px] sm:text-[26px] lg:text-[28px] font-medium leading-[30px] sm:leading-[34px] lg:leading-[36px] max-w-[360px]"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {t("whyUs.cardHeading")}
        </p>
      </div>

      {/* Bottom text */}
      <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6">
        <p
          className="text-white text-[14px] sm:text-[16px] leading-[22px] sm:leading-[24px] opacity-90 max-w-[472px]"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {t("whyUs.cardText")}
        </p>
      </div>
    </div>

    {/* Right - Stats grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 flex-1">
      {stats.map((stat) => (
        <div
          key={stat.value}
          className="bg-[#f8fafc] rounded-[20px] p-5 sm:p-6 flex flex-col justify-between gap-8 min-h-[190px] sm:min-h-[220px] lg:min-h-[310px]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p
                className="text-[22px] sm:text-[24px] lg:text-[28px] font-medium text-[#0d2138] leading-[30px] sm:leading-[34px] lg:leading-[36px]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {stat.label}
              </p>
            </div>

            <div className="flex-shrink-0 scale-90 sm:scale-100 origin-top-right">
              {stat.icon}
            </div>
          </div>

          <p
            className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[24px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {stat.desc}
          </p>
        </div>
      ))}
    </div>
  </div>
</div>
    </section>
  );
}
