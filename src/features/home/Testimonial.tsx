"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import svgPaths from "@/assets/svg-6s7nojygyu";

const testimonialPerson =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/jay.webp";

const testimonials = [
  {
    quote:
      "From day one, they understood the vision we had — creating a space that felt modern, functional, and timeless. Their approach reshaped how our building stands in the community.",
    name: "Jay Prakash",
    role: "Homeowner, Surrey, UK",
    image: testimonialPerson,
  },
  {
    quote:
      "From day one, they understood the vision we had — creating a space that felt modern, functional, and timeless. Their approach reshaped how our building stands in the community.",
    name: "Amit Sharma",
    role: "Property Owner, London, UK",
    image: testimonialPerson,
  },
  {
    quote:
      "From day one, they understood the vision we had — creating a space that felt modern, functional, and timeless. Their approach reshaped how our building stands in the community.",
    name: "Sarah Wilson",
    role: "Homeowner, Manchester, UK",
    image: testimonialPerson,
  },
];

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
  const [activeIndex, setActiveIndex] = useState(0);

  const currentTestimonial = testimonials[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setActiveIndex((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1
    );
  };

  const SliderButtons = () => (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous testimonial"
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-[13px] bg-[#d1d5dc] hover:bg-[#1e4f86] group flex items-center justify-center transition-all duration-300"
      >
        <svg
          width="22"
          height="18"
          viewBox="0 0 18.0006 15.0008"
          fill="none"
        >
          <path
            d={svgPaths.p33185f40}
            className="fill-[#2B3038] group-hover:fill-white transition-all duration-300"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Next testimonial"
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-[13px] bg-[#d1d5dc] hover:bg-[#1e4f86] group flex items-center justify-center rotate-180 transition-all duration-300"
      >
        <svg
          width="22"
          height="18"
          viewBox="0 0 18.0006 15.0008"
          fill="none"
        >
          <path
            d={svgPaths.p33185f40}
            className="fill-[#2B3038] group-hover:fill-white transition-all duration-300"
          />
        </svg>
      </button>
    </div>
  );

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

            {/* Desktop buttons only */}
            <div className="hidden lg:block">
              <SliderButtons />
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
                {currentTestimonial.quote}
              </blockquote>
            </div>

            {/* Author */}
            <div className="flex items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
              <div className="w-[64px] h-[58px] sm:w-[80px] sm:h-[70px] rounded-[14px] sm:rounded-[16px] overflow-hidden flex-shrink-0">
                <img
                  src={currentTestimonial.image}
                  alt={currentTestimonial.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <p
                  className="text-[18px] sm:text-[20px] font-medium text-[#0d2138] leading-[28px] sm:leading-[32px]"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {currentTestimonial.name}
                </p>

                <p
                  className="text-[13px] sm:text-[14px] text-[#2b3038]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  {currentTestimonial.role}
                </p>
              </div>
            </div>

            {/* Mobile buttons below quote/author */}
            <div className="flex lg:hidden mt-6">
              <SliderButtons />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}