"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Slider from "react-slick";

import type { PublicTeamMember } from "@/features/home/getPublicTeam";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Fallback silhouette shown when a team member has no avatar uploaded yet.
const agentPlaceholder =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/team-placeholder.webp";

function LinkedinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M18.5195 0H1.47656C0.660156 0 0 0.644531 0 1.44141V18.5547C0 19.3516 0.660156 20 1.47656 20H18.5195C19.3359 20 20 19.3516 20 18.5586V1.44141C20 0.644531 19.3359 0 18.5195 0ZM5.93359 17.043H2.96484V7.49609H5.93359V17.043ZM4.44922 6.19531C3.49609 6.19531 2.72656 5.42578 2.72656 4.47656C2.72656 3.52734 3.49609 2.75781 4.44922 2.75781C5.39844 2.75781 6.16797 3.52734 6.16797 4.47656C6.16797 5.42187 5.39844 6.19531 4.44922 6.19531ZM17.043 17.043H14.0781V12.4023C14.0781 11.2969 14.0586 9.87109 12.5352 9.87109C10.9922 9.87109 10.7578 11.0781 10.7578 12.3242V17.043H7.79688V7.49609H10.6406V8.80078H10.6797C11.0742 8.05078 12.043 7.25781 13.4844 7.25781C16.4883 7.25781 17.043 9.23438 17.043 11.8047V17.043V17.043Z"
        fill="#005089"
      />
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
    <div className="flex w-full min-w-0 flex-col items-center gap-6 rounded-2xl border border-[#f4f9ff] bg-[#f0f6fa] px-3 py-6">
      <div className="relative size-[164px] shrink-0 overflow-hidden rounded-full">
        <img
          src={agent.photo}
          alt={agent.name}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-col items-center gap-3 px-1 text-center">
        <div className="flex flex-col items-center gap-1">
          <p
            className="text-[22px] font-medium leading-tight text-[#00223a] lg:text-[24px] tracking-[-0.12px]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {agent.name}
          </p>
          <p
            className="text-[16px] text-[#4f4f4f] lg:text-[18px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {agent.role}
          </p>
        </div>

        <button type="button" aria-label={`${agent.name} on LinkedIn`}>
          <LinkedinIcon />
        </button>
      </div>
    </div>
  );
}

export function Agents({
  members = [],
}: {
  members?: PublicTeamMember[];
}) {
  const { t, i18n } = useTranslation("home");
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

  // Admin-selected team (Agents page → "Equipo del Sitio Web"). Falls back to
  // the hardcoded home.json list when nobody is selected yet, so the section
  // never renders empty on the live site.
  const isSpanish = i18n.language?.startsWith("es") ?? false;

  const agents: Agent[] =
    members.length > 0
      ? members.map((member) => ({
          name: member.name,
          role: isSpanish ? member.titleEs : member.titleEn,
          photo: member.photo ?? agentPlaceholder,
        }))
      : (
          t("agents.team", {
            returnObjects: true,
          }) as { name: string; role: string; photo?: string }[]
        ).map((member) => ({ ...member, photo: member.photo ?? agentPlaceholder }));

  const effectiveSlidesToShow = Math.max(1, Math.min(slidesToShow, agents.length));
  const canLoop = agents.length > effectiveSlidesToShow;

  const settings = {
    dots: true,
    arrows: slidesToShow === 1 && canLoop,
    prevArrow: <AgentArrow direction="previous" />,
    nextArrow: <AgentArrow direction="next" />,
    infinite: canLoop,
    speed: 900,
    cssEase: "ease-in-out",
    slidesToShow: effectiveSlidesToShow,
    slidesToScroll: 1,
    autoplay: canLoop,
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
      <div className="mx-auto w-[calc(100%_-_32px)] min-w-0 max-w-[1920px] sm:w-[calc(100%_-_35px)]">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-5 sm:mb-10 lg:mb-12">
          <div className="flex items-center gap-3 w-full max-w-[380px]">
            <div className="h-px flex-1 bg-[#e2e5ea]" />
            <span
              className="text-[13px] sm:text-[14px] text-[#3373a1] whitespace-nowrap"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("agents.badge")}
            </span>
            <div className="h-px flex-1 bg-[#e2e5ea]" />
          </div>

          <div className="text-center max-w-[434px]">
            <h2
              className="text-[28px] sm:text-[34px] lg:text-[44px] font-medium text-[#00223a] leading-tight tracking-[-0.5px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {t("agents.title")}
            </h2>
            <p
              className="mt-3.5 text-[14px] sm:text-[16px] text-[#4f4f4f]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {t("agents.subtitle")}
            </p>
          </div>
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