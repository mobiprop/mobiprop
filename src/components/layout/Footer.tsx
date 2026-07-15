"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import svgPaths from "@/assets/svg-6s7nojygyu";

const footerBg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/footerbackground.webp";

const navLinks = [
  { key: "home", href: "/" },
  { key: "listings", href: "/listings" },
  { key: "about", href: "/about" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contact" },
  { key: "faq", href: "/faq" },
  { key: "privacyPolicy", href: "/privacy-policy" },
  { key: "termsConditions", href: "/terms-conditions" },
] as const;

function MailIcon() {
  return (
    <svg
      width="16"
      height="14"
      viewBox="0 0 14.3334 11.6667"
      fill="none"
      className="shrink-0"
    >
      <path
        d={svgPaths.p3d448680}
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 14.38 14.4401"
      fill="none"
      className="shrink-0"
    >
      <path
        d={svgPaths.p3a452d00}
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      width="14"
      height="16"
      viewBox="0 0 11.6667 14.3333"
      fill="none"
      className="shrink-0 mt-[3px]"
    >
      <path
        d={svgPaths.p1fff3000}
        stroke="#EDF5F8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={svgPaths.p1a179d80}
        stroke="#EDF5F8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Section heading with bottom border — exactly as Figma: pb-[8px] pt-[4px] px-[4px] */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-[rgba(255,255,255,0.2)] pb-[8px] pt-[4px] px-[4px] w-full">
      <p
        className="text-[18px] font-medium text-white leading-[26px] tracking-[-0.18px] whitespace-nowrap"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {children}
      </p>
    </div>
  );
}

export function Footer() {
  const { t } = useTranslation(["footer", "navigation"]);

  return (
    <footer className="relative bg-[#0d2138] overflow-hidden">
      {/* Background building image — extends above footer per Figma (top:-113px, h:902px) */}
      <div className="absolute inset-x-0 top-[-113px] h-[902px] pointer-events-none">
        <img
          src={footerBg}
          alt=""
          className="w-full h-full object-center object-top opacity-100"
        />
      </div>

      <div className="relative z-10 w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto pt-[56px] sm:pt-[72px] lg:pt-[92px] pb-[32px] sm:pb-[40px]">
  {/* Top content row */}
  <div className="flex flex-col lg:flex-row gap-10 sm:gap-12 lg:gap-[80px] xl:gap-[120px] pb-10 sm:pb-[56px] border-b border-[rgba(255,255,255,0.16)]">
    {/* Newsletter */}
    <div className="shrink-0 w-full lg:w-[460px]">
      <p
        className="text-[24px] sm:text-[28px] font-medium text-white leading-[32px] sm:leading-[36px] tracking-[-0.28px] mb-5 sm:mb-6 max-w-[412px]"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {t("newsletterHeadline")}
      </p>

      <div className="flex flex-col gap-[10px]">
        <p
          className="text-[14px] sm:text-[16px] text-white leading-[22px] sm:leading-[24px] tracking-[-0.16px]"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {t("newsletterSubtext")}
        </p>

        <div className="relative bg-[#f5f7fa] min-h-[56px] rounded-[100px] w-full">
          <input
            type="email"
            placeholder={t("emailPlaceholder")}
            className="h-[56px] w-full bg-transparent pl-5 sm:pl-6 pr-[122px] sm:pr-[150px] text-[14px] sm:text-[16px] text-[#717784] outline-none rounded-[100px] tracking-[-0.16px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          />

          <button
            className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[44px] w-[112px] sm:w-[131px] overflow-hidden rounded-[100px] text-[14px] sm:text-[16px] font-medium text-white flex items-center justify-center tracking-[-0.01em]"
            style={{
              fontFamily: "Montserrat, sans-serif",
              background: "linear-gradient(to bottom, #005ea4, #006fc2)",
              border: "1.011px solid #0088ff",
              boxShadow: "0px 0px 0px 4px #e0e9f2",
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

            <span className="relative z-10">{t("subscribe")}</span>
          </button>
        </div>
      </div>
    </div>

    {/* Right: Navigation + Office */}
    <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 lg:gap-[85px] flex-1 lg:justify-end">
      {/* Navigation */}
      <div className="flex flex-col gap-4 sm:gap-[24px] lg:w-[221px]">
        <SectionHeading>{t("navigationHeading")}</SectionHeading>

        <div
          className="flex flex-col gap-3 sm:gap-[16px] opacity-80"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {navLinks.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="text-[14px] sm:text-[16px] text-white leading-[22px] sm:leading-[24px] tracking-[-0.16px] hover:opacity-100 transition-opacity whitespace-nowrap"
            >
              {t(key, { ns: "navigation" })}
            </Link>
          ))}
        </div>
      </div>

      {/* Visit Our Office */}
      <div className="flex flex-col gap-6 sm:gap-[28px] lg:w-[305px]">
        {/* Address */}
        <div className="flex flex-col gap-4 sm:gap-[24px]">
          <SectionHeading>{t("officeHeading")}</SectionHeading>

          <div className="flex gap-[12px] items-start opacity-80">
            <span className="flex-shrink-0 mt-1">
              <LocationIcon />
            </span>

            <p
              className="text-[14px] sm:text-[16px] text-white leading-[22px] sm:leading-[24px] tracking-[-0.16px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("officeAddressLine1")}
              <br />
              {t("officeAddressLine2")}
            </p>
          </div>
        </div>

        {/* Email + Phone */}
        <div className="flex flex-col gap-4 sm:gap-[24px]">
          <SectionHeading>{t("contactHeading")}</SectionHeading>

          <div className="flex flex-col gap-[12px] opacity-80">
            <div className="flex gap-[12px] items-center">
              <span className="flex-shrink-0">
                <MailIcon />
              </span>

              <p
                className="text-[14px] sm:text-[16px] text-white leading-[22px] sm:leading-[24px] tracking-[-0.16px] break-all"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                info@ulrichpropiedades.com
              </p>
            </div>

            <div className="flex gap-[12px] items-center">
              <span className="flex-shrink-0">
                <PhoneIcon />
              </span>

              <p
                className="text-[14px] sm:text-[16px] text-white leading-[22px] sm:leading-[24px] tracking-[-0.16px]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                +54 9 11 6161 8646
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Copyright */}
  <div className="pt-5 sm:pt-6">
    <p
      className="text-[14px] sm:text-[16px] text-white leading-[22px] sm:leading-[24px] tracking-[-0.16px]"
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      {t("copyright")}
    </p>
  </div>
</div>
    </footer>
  );
}
