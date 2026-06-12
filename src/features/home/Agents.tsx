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
    <div className="flex flex-col gap-4">
      {/* Photo */}
      <div className="relative h-[300px] lg:h-[372px] rounded-[20px] overflow-hidden">
        <img
          src={agent.photo}
          alt={agent.name}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </div>

      {/* Info */}
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-[20px] lg:text-[24px] font-medium text-[#0d2138] leading-[28px]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {agent.name}
          </p>

          <p
            className="text-[14px] text-[#2b3038] mt-1 max-w-[160px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {agent.role}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {[<InstagramIcon />, <LinkedinIcon />, <XIcon />].map((Icon, i) => (
            <button
              key={i}
              type="button"
              className="bg-white border border-[#d1d5dc] rounded-[8px] p-2 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              {Icon}
            </button>
          ))}
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

    appendDots: (dots: React.ReactNode) => (
      <div>
        <ul className="flex justify-center items-center gap-1.5 mt-6 sm:mt-8">
          {dots}
        </ul>
      </div>
    ),

    customPaging: () => (
      <div className="agent-custom-dot w-2 h-2 bg-[#6a7282] opacity-25 rounded-full transition-all duration-300 cursor-pointer" />
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
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          speed: 1000,
        },
      },
    ],
  };

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 mb-8 sm:mb-10 lg:mb-12">
          <div className="flex items-center gap-2">
            <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
            <span
              className="text-[14px] sm:text-[16px] font-medium text-[#6a7282]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Agents
            </span>
          </div>

          <h2
            className="text-[26px] sm:text-[34px] lg:text-[44px] font-semibold text-[#232323] text-center leading-[36px] sm:leading-[42px] lg:leading-tight max-w-[500px]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Meet The Experts Who Make It Happen.
          </h2>
        </div>

        {/* Slick Slider */}
        <div className="agents-slider -mx-2 sm:-mx-3 cursor-pointer">
          <Slider {...settings}>
            {agents.map((agent, index) => (
              <div
                key={`${agent.name}-${index}`}
                className="px-2 sm:px-3 cursor-pointer"
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