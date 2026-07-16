"use client";

import { useTranslation } from "react-i18next";
import svgPaths from "@/assets/svg-6s7nojygyu";

const testimonialPerson =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/testimonial-placeholder.webp";

function QuoteIcon() {
  return (
    <svg width="72" height="60" viewBox="0 0 81.2621 67.125" fill="none">
      <g clipPath="url(#clip0_testimonial)">
        <path d={svgPaths.p39af8780} fill="#6A7282" opacity="0.1" />
      </g>
      <defs>
        <clipPath id="clip0_testimonial">
          <rect width="81.2621" height="67.125" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function Testimonial() {
  const { t } = useTranslation("home");
  // Only one real client testimonial exists in the Figma design so far —
  // shown as a single static quote until more are provided.
  const testimonial = {
    quote: t("testimonial.quote"),
    name: t("testimonial.name"),
    role: t("testimonial.role"),
    image: testimonialPerson,
  };

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto">
        <div className="relative overflow-hidden flex flex-col lg:flex-row gap-8 sm:gap-10 lg:gap-[120px] xl:gap-[200px] justify-between">
          {/* Background Logo Watermark - 3 Images */}
          <div
            className="home-img pointer-events-none absolute left-[35%] top-[58%] -translate-x-1/2 -translate-y-1/2
            w-[469px] h-[317.9668884277344px] opacity-[0.04] rotate-0 z-0 flex flex-col items-center"
          >
            <img
              src="/assets/figma-temp/BlogPage/Group-1.png"
              alt="Ulrich"
              className="w-full h-auto mb-3"
            />

            <img
              src="/assets/figma-temp/BlogPage/Group.png"
              alt="Ulrich House"
              className="w-full h-auto -mt-2 mb-3"
            />

            <img
              src="/assets/figma-temp/BlogPage/Group-2.png"
              alt="Propiedades"
              className="w-full h-auto -mt-1"
            />
          </div>

          {/* Left side - text */}
          <div className="relative z-10 lg:w-[327px] flex-shrink-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
                <span
                  className="text-[16px] sm:text-[18px] font-medium text-[#6a7282]"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {t("testimonial.badge")}
                </span>
              </div>

              <p
                className="text-[15px] sm:text-[18px] text-[#6a7282] leading-[24px] sm:leading-[26px]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {t("testimonial.subtitle")}
              </p>
            </div>
          </div>

          {/* Right side - quote */}
          <div className="relative z-10 flex-1 max-w-[831px]">
            <div className="flex flex-col gap-4 sm:gap-5 min-h-[190px]">
              <QuoteIcon />

              <blockquote
                className="text-[20px] sm:text-[24px] lg:text-[28px] font-medium text-[#232323] leading-[30px] sm:leading-[34px] lg:leading-[36px]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {testimonial.quote}
              </blockquote>
            </div>

            {/* Author */}
            <div className="flex items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
              <div className="w-[64px] h-[58px] sm:w-[80px] sm:h-[70px] rounded-[14px] sm:rounded-[16px] overflow-hidden flex-shrink-0">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <p
                  className="text-[18px] sm:text-[20px] font-medium text-[#0d2138] leading-[28px] sm:leading-[32px]"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {testimonial.name}
                </p>

                <p
                  className="text-[13px] sm:text-[14px] text-[#2b3038]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  {testimonial.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
