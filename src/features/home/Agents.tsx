"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import svgPaths from "@/assets/svg-6s7nojygyu";
import Slider from "react-slick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Fallback silhouette shown when a team member has no avatar uploaded yet.
const agentPlaceholder =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/team-placeholder.webp";

// Names must match the `agents.team[].name` entries in src/i18n/locales/*/home.json
// and the corresponding Profile.fullName in the DB, so the About page can look up
// each member's real avatarUrl and pass it in here.
export const TEAM_MEMBER_NAMES = [
  "Rodolfo Ulrich",
  "Carola Buscaglia",
  "Matías Ulrich",
] as const;

function InstagramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16.25 16.25" fill="none">
      <path d={svgPaths.p24f75100} fill="#232323" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16.25 16.25" fill="none">
      <path d={svgPaths.p27b2a380} fill="#232323" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="15" viewBox="0 0 13.7548 15.0095" fill="none">
      <path d={svgPaths.p478ee00} fill="#232323" />
    </svg>
  );
}

type Agent = {
  name: string;
  role: string;
  photo: string;
};

function AgentArrow({
  direction,
  onClick,
}: {
  direction: "previous" | "next";
  onClick?: () => void;
}) {
  const isPrevious = direction === "previous";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${isPrevious ? "Previous" : "Next"} team member`}
      className={`absolute top-[150px] z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#d1d5dc] bg-white text-[#0d2138] shadow-md transition active:scale-95 ${
        isPrevious ? "left-3" : "right-3"
      }`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d={isPrevious ? "M15 18L9 12L15 6" : "M9 18L15 12L9 6"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {/* Photo */}
      <div className="relative h-[300px] w-full overflow-hidden rounded-[20px] lg:h-[372px]">
        <img
          src={agent.photo}
          alt={agent.name}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>

      {/* Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[20px] font-medium leading-[28px] text-[#0d2138] lg:text-[24px]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {agent.name}
          </p>

          <p
            className="mt-1 max-w-[160px] text-[14px] text-[#2b3038]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {agent.role}
          </p>
        </div>

        <div className="flex flex-shrink-0 gap-2">
          {[<InstagramIcon />, <LinkedinIcon />, <XIcon />].map(
            (icon, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Social profile ${index + 1}`}
                className="flex items-center justify-center rounded-[8px] border border-[#d1d5dc] bg-white p-2 transition-colors hover:bg-gray-50"
              >
                {icon}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export function Agents({
  avatarsByName = {},
}: {
  avatarsByName?: Record<string, string>;
}) {
  const { t } = useTranslation("home");
  const [slidesToShow, setSlidesToShow] = useState(3);

  useEffect(() => {
    const updateSlides = () => {
      const width = Math.min(window.innerWidth, window.screen.width);

      if (width < 768) {
        setSlidesToShow(1);
      } else if (width < 1024) {
        setSlidesToShow(2);
      } else {
        setSlidesToShow(3);
      }
    };

    updateSlides();

    window.addEventListener("resize", updateSlides);
    window.addEventListener("orientationchange", updateSlides);

    return () => {
      window.removeEventListener("resize", updateSlides);
      window.removeEventListener("orientationchange", updateSlides);
    };
  }, []);

  const agents: Agent[] = (
    t("agents.team", {
      returnObjects: true,
    }) as { name: string; role: string }[]
  ).map((member) => ({
    ...member,
    photo: avatarsByName[member.name] ?? agentPlaceholder,
  }));

  const settings = {
    dots: true,
    arrows: slidesToShow === 1,
    prevArrow: <AgentArrow direction="previous" />,
    nextArrow: <AgentArrow direction="next" />,
    infinite: true,
    speed: 900,
    cssEase: "ease-in-out",
    slidesToShow,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    swipeToSlide: true,
    adaptiveHeight: false,
    variableWidth: false,
    centerMode: false,

    appendDots: (dots: ReactNode) => (
      <div>
        <ul className="mt-6 flex items-center justify-center gap-1.5 sm:mt-8">
          {dots}
        </ul>
      </div>
    ),

    customPaging: () => (
      <div className="agent-custom-dot h-2 w-2 cursor-pointer rounded-full bg-[#6a7282] opacity-25 transition-all duration-300" />
    ),
  };

  return (
    <section className="overflow-hidden bg-white py-16 lg:py-20">
      <div className="mx-auto w-[calc(100%_-_32px)] min-w-0 max-w-[1440px] sm:w-[calc(100%_-_35px)]">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 sm:mb-10 sm:gap-4 lg:mb-12">
          <div className="flex items-center gap-2">
            <div className="h-[7px] w-[7px] rounded-full bg-[#4896b6]" />

            <span
              className="text-[14px] font-medium text-[#6a7282] sm:text-[16px]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("agents.badge")}
            </span>
          </div>

          <h2
            className="max-w-[500px] text-center text-[26px] font-semibold leading-[36px] text-[#232323] sm:text-[34px] sm:leading-[42px] lg:text-[44px] lg:leading-tight"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t("agents.title")}
          </h2>
        </div>

        {/* Slick Slider */}
        <div className="agents-slider -mx-2 min-w-0 cursor-pointer sm:-mx-3">
          <Slider key={`agents-slider-${slidesToShow}`} {...settings}>
            {agents.map((agent, index) => (
              <div
                key={`${agent.name}-${index}`}
                className="min-w-0 cursor-pointer px-2 sm:px-3"
              >
                <AgentCard agent={agent} />
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </section>
  );
}