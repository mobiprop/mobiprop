"use client";

import svgPaths from "@/assets/svg-6s7nojygyu";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const agent1 =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/about-15.png";
const agent2 =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/about-16.png";
const agent3 =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/about-17.png";

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

const agents = [
  {
    name: "Albert Flores",
    role: "Property Consultant Orlando, Tampa",
    photo: agent1,
  },
  {
    name: "Marvin McKinney",
    role: "Property Consultant Orlando, Tampa",
    photo: agent2,
  },
  {
    name: "Theresa Webb",
    role: "Property Consultant Orlando, Tampa",
    photo: agent3,
  },
  {
    name: "Albert Flores",
    role: "Property Consultant Orlando, Tampa",
    photo: agent1,
  },
  {
    name: "Marvin McKinney",
    role: "Property Consultant Orlando, Tampa",
    photo: agent2,
  },
  {
    name: "Theresa Webb",
    role: "Property Consultant Orlando, Tampa",
    photo: agent3,
  },
];

function AgentCard({ agent }: { agent: (typeof agents)[0] }) {
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

export function Agents() {
  const settings = {
    dots: true,
    arrows: false,
    infinite: true,
    speed: 900,
    cssEase: "ease-in-out",
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
    swipeToSlide: true,
    adaptiveHeight: false,
    variableWidth: false,
    centerMode: false,

    appendDots: (dots: React.ReactNode) => (
      <div>
        <ul className="mt-6 flex items-center justify-center gap-1.5 sm:mt-8">
          {dots}
        </ul>
      </div>
    ),

    customPaging: () => (
      <div className="agent-custom-dot h-2 w-2 cursor-pointer rounded-full bg-[#6a7282] opacity-25 transition-all duration-300" />
    ),

    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          speed: 1000,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          speed: 1000,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          speed: 1000,
          variableWidth: false,
          centerMode: false,
        },
      },
    ],
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
              Agents
            </span>
          </div>

          <h2
            className="max-w-[500px] text-center text-[26px] font-semibold leading-[36px] text-[#232323] sm:text-[34px] sm:leading-[42px] lg:text-[44px] lg:leading-tight"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Meet The Experts Who Make It Happen.
          </h2>
        </div>

        {/* Slick Slider */}
        <div className="agents-slider -mx-2 min-w-0 cursor-pointer sm:-mx-3">
          <Slider {...settings}>
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