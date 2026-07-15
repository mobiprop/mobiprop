"use client";

import { useTranslation } from "react-i18next";

export function BlogHeader() {
  const { t } = useTranslation("home");

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 mb-8 sm:mb-10 lg:mb-12">
      <div className="flex items-center gap-2">
        <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
        <span
          className="text-[14px] sm:text-[16px] font-medium text-[#6a7282]"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {t("blog.badge")}
        </span>
      </div>

      <h2
        className="text-[28px] sm:text-[34px] lg:text-[44px] font-semibold text-[#0d2138] text-center leading-[36px] sm:leading-[42px] lg:leading-tight max-w-[500px]"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {t("blog.title")}
      </h2>
    </div>
  );
}
