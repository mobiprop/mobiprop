"use client";

import { useTranslation } from "react-i18next";

export function BlogHeader() {
  const { t } = useTranslation("home");

  return (
    <div className="flex flex-col items-center gap-5 mb-10 lg:mb-12">
      <div className="flex items-center gap-3 w-full max-w-[380px]">
        <div className="h-px flex-1 bg-[#e2e5ea]" />
        <span
          className="text-[13px] sm:text-[14px] text-[#3373a1] whitespace-nowrap uppercase tracking-wide"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {t("blog.badge")}
        </span>
        <div className="h-px flex-1 bg-[#e2e5ea]" />
      </div>

      <div className="text-center max-w-[434px]">
        <h2
          className="text-[28px] sm:text-[34px] lg:text-[44px] font-medium text-[#00223a] leading-tight tracking-[-0.5px]"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {t("blog.title")}
        </h2>
        <p
          className="mt-3.5 text-[14px] sm:text-[16px] text-[#4f4f4f]"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {t("blog.subtitle")}
        </p>
      </div>
    </div>
  );
}
