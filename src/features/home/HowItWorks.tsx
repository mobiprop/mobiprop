"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.0005 14L11.1338 11.1333" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10.333 4.99996L11.8663 6.53329C11.991 6.65544 12.1585 6.72386 12.333 6.72386C12.5075 6.72386 12.6751 6.65544 12.7997 6.53329L14.1997 5.13329C14.3218 5.00867 14.3902 4.84113 14.3902 4.66663C14.3902 4.49212 14.3218 4.32458 14.1997 4.19996L12.6663 2.66663" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.9996 1.33337L7.59961 7.73337" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.99967 14C7.02472 14 8.66634 12.3583 8.66634 10.3333C8.66634 8.30825 7.02472 6.66663 4.99967 6.66663C2.97463 6.66663 1.33301 8.30825 1.33301 10.3333C1.33301 12.3583 2.97463 14 4.99967 14Z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.56667 5.74667C2.46936 5.30835 2.4843 4.85256 2.6101 4.42156C2.73591 3.99056 2.9685 3.5983 3.28631 3.28115C3.60413 2.964 3.99687 2.73223 4.42814 2.60733C4.8594 2.48243 5.31522 2.46844 5.75333 2.56667C5.99447 2.18953 6.32667 1.87917 6.7193 1.66419C7.11193 1.44921 7.55237 1.33652 8 1.33652C8.44763 1.33652 8.88807 1.44921 9.2807 1.66419C9.67333 1.87917 10.0055 2.18953 10.2467 2.56667C10.6854 2.46802 11.142 2.48194 11.574 2.60714C12.006 2.73235 12.3992 2.96476 12.7172 3.28277C13.0352 3.60078 13.2677 3.99405 13.3929 4.426C13.5181 4.85795 13.532 5.31455 13.4333 5.75333C13.8105 5.99447 14.1208 6.32667 14.3358 6.7193C14.5508 7.11193 14.6635 7.55236 14.6635 8C14.6635 8.44763 14.5508 8.88807 14.3358 9.2807C14.1208 9.67333 13.8105 10.0055 13.4333 10.2467C13.5316 10.6848 13.5176 11.1406 13.3927 11.5719C13.2678 12.0031 13.036 12.3959 12.7189 12.7137C12.4017 13.0315 12.0094 13.2641 11.5784 13.3899C11.1474 13.5157 10.6916 13.5306 10.2533 13.4333C10.0125 13.8119 9.68005 14.1236 9.28675 14.3395C8.89345 14.5555 8.45202 14.6687 8.00333 14.6687C7.55465 14.6687 7.11322 14.5555 6.71992 14.3395C6.32661 14.1236 5.99416 13.8119 5.75333 13.4333C5.31522 13.5316 4.8594 13.5176 4.42814 13.3927C3.99687 13.2678 3.60413 13.036 3.28631 12.7189C2.9685 12.4017 2.73591 12.0094 2.6101 11.5784C2.4843 11.1474 2.46936 10.6916 2.56667 10.2533C2.18664 10.0128 1.87361 9.68012 1.6567 9.28614C1.43979 8.89217 1.32604 8.44974 1.32604 8C1.32604 7.55026 1.43979 7.10783 1.6567 6.71386C1.87361 6.31988 2.18664 5.98717 2.56667 5.74667Z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 8L7.33333 9.33333L10 6.66667" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STEP_ICON_COMPONENTS = [SearchIcon, KeyIcon, CheckIcon];
const STEP_ICON_BG = [
  "linear-gradient(135deg, #005ea4 0%, #006fc2 100%)",
  "#2e99c6",
  "#6c6c6c",
];

export function HowItWorks() {
  const { t } = useTranslation("home");
  const steps = t("howItWorks.steps", { returnObjects: true }) as {
    label: string;
    title: string;
    description: string;
  }[];

  return (
    <section className="bg-white home-section">
      <div className="home-container home-process-grid">
        <div className="flex w-full flex-col gap-7 min-w-0">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <div
                className="h-5 w-0.5 rounded-full"
                style={{ background: "linear-gradient(96deg, #005ea4 0%, #006fc2 100%)" }}
              />
              <span
                className="bg-clip-text text-transparent text-[13px] sm:text-[14px] font-medium uppercase tracking-wide"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  backgroundImage: "linear-gradient(170deg, #005ea4 0%, #006fc2 100%)",
                }}
              >
                {t("howItWorks.badge")}
              </span>
            </div>
            <div className="flex flex-col gap-5">
              <h2
                className="text-[28px] sm:text-[34px] lg:text-[44px] font-medium text-[#00223a] leading-tight tracking-[-0.5px]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {t("howItWorks.title")}
              </h2>
              <p
                className="text-[14px] sm:text-[16px] text-[#4f4f4f] leading-relaxed max-w-[591px]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {t("howItWorks.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-7">
            {steps.map((step, i) => {
              const Icon = STEP_ICON_COMPONENTS[i];
              const isLast = i === steps.length - 1;
              return (
                <div key={step.label} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: STEP_ICON_BG[i] }}
                    >
                      <Icon />
                    </div>
                    {!isLast && <div className="mt-2 w-px flex-1 border-l border-dashed border-[#b0c9da]" />}
                  </div>
                  <div className="flex flex-col gap-2 pb-2">
                    <p
                      className="text-[13px] sm:text-[14px] text-[#2e99c6] tracking-[0.5px] font-medium"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      {step.label}
                    </p>
                    <p
                      className="text-[19px] sm:text-[20px] lg:text-[22px] font-medium text-[#232323]"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {step.title}
                    </p>
                    <p
                      className="text-[14px] sm:text-[16px] text-[#4f4f4f] leading-relaxed max-w-[536px]"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative h-[380px] sm:h-[480px] lg:h-full lg:min-h-[560px] w-full min-w-0 rounded-[32px] overflow-hidden">
          <Image
            src="/spots/how-it-works.webp"
            alt=""
            fill
            sizes="(min-width: 1024px) 617px, 100vw"
            className="object-cover"
          />
          <div className="absolute left-5 top-5 sm:left-7 sm:top-7 flex flex-col items-center gap-1 rounded-2xl bg-white px-5 py-4 shadow-[0px_12px_20px_rgba(0,80,137,0.14)]">
            <p className="text-[26px] sm:text-[30px] font-medium text-[#005089]" style={{ fontFamily: "Poppins, sans-serif" }}>
              {t("howItWorks.statValue")}
            </p>
            <p className="text-[13px] sm:text-[14px] text-[#4f4f4f] whitespace-nowrap" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {t("howItWorks.statLabel")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
