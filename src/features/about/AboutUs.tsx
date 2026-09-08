"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Reveal, RevealItem } from "@/components/common/Reveal";

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

const heroImages = [
  "/about/hero-1.webp",
  "/about/hero-2.webp",
  "/about/hero-3.webp",
  "/about/hero-4.webp",
  "/about/hero-5.webp",
];

const galleryImages = [
  "/about/gallery-1.webp",
  "/about/gallery-2.webp",
  "/about/gallery-3.webp",
  "/about/gallery-4.webp",
  "/about/gallery-5.webp",
];

function SectionBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 bg-[#f0f6fa] border border-[#ccdeef] rounded-full px-3 py-1.5 w-fit">
      <span
        className="size-1.5 rounded-full shrink-0"
        style={{ background: "linear-gradient(135deg, #005ea4 0%, #006fc2 100%)" }}
      />
      <span
        className="text-[12px] font-medium text-[#232323] uppercase tracking-[1.2px]"
        style={{ fontFamily: poppins }}
      >
        {label}
      </span>
    </div>
  );
}

function GradientBadgeLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-5 w-0.5 rounded-full shrink-0" style={{ background: "linear-gradient(96deg, #005ea4 0%, #006fc2 100%)" }} />
      <span
        className="bg-clip-text text-transparent text-[14px] font-medium uppercase tracking-wide"
        style={{ fontFamily: montserrat, backgroundImage: "linear-gradient(170deg, #005ea4 0%, #006fc2 100%)" }}
      >
        {label}
      </span>
    </div>
  );
}

function ExpertiseIcon({ path }: { path: string }) {
  return (
    <div className="flex size-14 items-center justify-center rounded-xl border-[1.25px] border-[#e1edf5] bg-[#f0f6fa]">
      <svg width="30" height="30" viewBox="0 0 30.5455 30.5455" fill="none">
        <path d={path} stroke="#005089" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const EXPERTISE_ICON_PATHS = [
  "M3.81836 12.0908L15.2729 3.81812L26.7274 12.0908V25.4545C26.7274 25.792 26.5934 26.1158 26.3547 26.3544C26.116 26.5931 25.7923 26.7272 25.4547 26.7272H5.09109C4.75354 26.7272 4.42982 26.5931 4.19113 26.3544C3.95245 26.1158 3.81836 25.792 3.81836 25.4545V12.0908Z M11.4553 26.7273V15.2727H19.0916V26.7273",
  "M11.4553 14L15.2734 17.8182L28.0007 5.09091 M26.7274 15.2727V24.1818C26.7274 24.8568 26.4593 25.5043 25.9819 25.9817C25.5045 26.459 24.8571 26.7272 24.182 26.7272H6.36381C5.68872 26.7272 5.04127 26.459 4.56391 25.9817C4.08654 25.5043 3.81836 24.8568 3.81836 24.1818V6.36357C3.81836 5.68847 4.08654 5.04103 4.56391 4.56366C5.04127 4.0863 5.68872 3.81812 6.36381 3.81812H20.3638",
  "M26.5252 5.86733C25.8752 5.21697 25.1033 4.70106 24.2538 4.34908C23.4043 3.99709 22.4938 3.81592 21.5743 3.81592C20.6548 3.81592 19.7442 3.99709 18.8948 4.34908C18.0453 4.70106 17.2734 5.21697 16.6234 5.86733L15.2743 7.21642L13.9252 5.86733C12.6121 4.55427 10.8313 3.8166 8.9743 3.8166C7.11735 3.8166 5.33645 4.55427 4.02339 5.86733C2.71033 7.1804 1.97266 8.96129 1.97266 10.8182C1.97266 12.6752 2.71033 14.4561 4.02339 15.7692L5.37248 17.1182L15.2743 27.0201L25.1761 17.1182L26.5252 15.7692C27.1756 15.1191 27.6915 14.3473 28.0435 13.4978C28.3955 12.6483 28.5766 11.7378 28.5766 10.8182C28.5766 9.89871 28.3955 8.98819 28.0435 8.1387C27.6915 7.28921 27.1756 6.51739 26.5252 5.86733Z",
];

export function AboutIntro() {
  const { t } = useTranslation("about");
  const stats = t("stats", { returnObjects: true }) as { value: string; label: string; desc: string }[];
  const cards = t("expertise.cards", { returnObjects: true }) as { title: string; desc: string }[];

  return (
    <>
      {/* Hero */}
      <section className="bg-white pt-12 sm:pt-16 lg:pt-20 pb-10 sm:pb-14 lg:pb-16">
        <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1312px] mx-auto flex flex-col items-center gap-10 sm:gap-14">
          <Reveal as="div" amount={0.6} className="flex flex-col items-center gap-3 text-center">
            <SectionBadge label={t("hero.badge")} />
            <h1
              className="text-[34px] sm:text-[42px] lg:text-[52px] font-medium text-[#101010] leading-[1.15] tracking-[-1px] max-w-[300px] sm:max-w-[560px] lg:max-w-[820px]"
              style={{ fontFamily: poppins }}
            >
              {t("hero.title")}
            </h1>
            <p
              className="text-[15px] sm:text-[17px] lg:text-[18px] text-[#4f4f4f] leading-relaxed max-w-[320px] sm:max-w-[560px] lg:max-w-[693px]"
              style={{ fontFamily: montserrat }}
            >
              {t("hero.subtitle")}
            </p>
          </Reveal>

          {/* Mobile/tablet: simple fixed-height 2-up grid, no stretch tricks needed. */}
          <Reveal className="grid grid-cols-2 gap-4 sm:gap-5 w-full lg:hidden" stagger={0.1} amount={0.2}>
            {[heroImages[1], heroImages[4], heroImages[2], heroImages[3]].map((src, i) => (
              <RevealItem
                key={src}
                className={`rounded-2xl overflow-hidden h-[180px] sm:h-[240px] ${i >= 2 ? "hidden sm:block" : ""}`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </RevealItem>
            ))}
          </Reveal>

          {/* Desktop: flex row so the fixed row height stretches its children reliably
              (CSS Grid's implicit auto-row sizing doesn't stretch percentage-height
              children the same way flex does). */}
          <Reveal className="hidden lg:flex lg:flex-row gap-6 w-full h-[500px]" stagger={0.1} amount={0.2}>
            <RevealItem className="flex-1 rounded-xl overflow-hidden h-full">
              <img src={heroImages[0]} alt="" className="h-full w-full object-cover" />
            </RevealItem>
            <div className="flex flex-col gap-6 flex-1 h-full">
              <RevealItem className="rounded-2xl overflow-hidden flex-1 min-h-0">
                <img src={heroImages[1]} alt="" className="h-full w-full object-cover" />
              </RevealItem>
              <RevealItem className="rounded-2xl overflow-hidden flex-1 min-h-0">
                <img src={heroImages[2]} alt="" className="h-full w-full object-cover" />
              </RevealItem>
            </div>
            <div className="flex flex-col gap-6 flex-1 h-full">
              <RevealItem className="rounded-xl overflow-hidden flex-1 min-h-0">
                <img src={heroImages[3]} alt="" className="h-full w-full object-cover" />
              </RevealItem>
              <RevealItem className="rounded-2xl overflow-hidden flex-1 min-h-0">
                <img src={heroImages[4]} alt="" className="h-full w-full object-cover" />
              </RevealItem>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Story */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1312px] mx-auto flex flex-col items-center gap-10 sm:gap-14">
          <Reveal className="flex items-center gap-3 w-full max-w-[500px]" amount={0.5}>
            <div className="h-px flex-1 bg-[#b0c9da]/60" />
            <span className="text-[13px] sm:text-[14px] text-[#3373a1] whitespace-nowrap" style={{ fontFamily: montserrat }}>
              {t("story.sectionLabel")}
            </span>
            <div className="h-px flex-1 bg-[#b0c9da]/60" />
          </Reveal>
          <h2
            className="text-[28px] sm:text-[36px] lg:text-[44px] font-medium text-[#00223a] text-center tracking-[-1px] leading-tight"
            style={{ fontFamily: poppins }}
          >
            {t("story.heading")}
          </h2>

          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-11 w-full">
            <Reveal className="flex flex-col gap-6 w-full lg:max-w-[373px] lg:shrink-0" amount={0.3}>
              <div className="flex flex-col gap-5 text-[#4f4f4f]" style={{ fontFamily: montserrat }}>
                <p className="text-[16px] leading-relaxed">{t("story.paragraph1")}</p>
                <p className="text-[16px] leading-relaxed">{t("story.paragraph2")}</p>
              </div>
              <Link
                href="/contact"
                className="w-fit rounded-xl px-6 py-4 text-[16px] font-medium text-white"
                style={{ fontFamily: poppins, background: "linear-gradient(161deg, #005ea4 0%, #006fc2 100%)" }}
              >
                {t("story.cta")}
              </Link>
            </Reveal>

            <Reveal className="relative h-[300px] sm:h-[420px] lg:h-[569px] w-full lg:w-[474px] shrink-0 rounded-[32px] overflow-hidden" scale={1.08} amount={0.2}>
              <img src="/about/story.webp" alt="" className="h-full w-full object-cover" />
            </Reveal>

            <Reveal className="flex flex-col gap-8 sm:gap-10 w-full lg:max-w-[379px]" stagger={0.12} amount={0.2}>
              {(["vision", "mission", "commitment"] as const).map((key) => (
                <RevealItem key={key} className="flex flex-col gap-3">
                  <p className="text-[20px] sm:text-[22px] font-medium text-[#232323] tracking-[-0.11px]" style={{ fontFamily: poppins }}>
                    {t(`story.${key}.title`)}
                  </p>
                  <p className="text-[15px] sm:text-[16px] text-[#4f4f4f] leading-relaxed" style={{ fontFamily: montserrat }}>
                    {t(`story.${key}.desc`)}
                  </p>
                </RevealItem>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#f0f6fa]">
        <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1312px] mx-auto">
          <Reveal
            className="grid grid-cols-2 lg:grid-cols-4 gap-y-10"
            stagger={0.1}
            amount={0.3}
          >
            {stats.map((s, i) => (
              <RevealItem
                key={s.label}
                className={`flex flex-col items-center gap-1.5 text-center px-6 py-10 sm:py-14 ${
                  i < stats.length - 1 ? "lg:border-r border-[#e9e9e9]" : ""
                }`}
              >
                <p className="text-[30px] sm:text-[38px] font-semibold text-[#005089]" style={{ fontFamily: poppins }}>
                  {s.value}
                </p>
                <p className="text-[15px] sm:text-[16px] text-[#232323]" style={{ fontFamily: montserrat }}>
                  {s.label}
                </p>
                <p className="text-[13px] sm:text-[14px] text-[#4f4f4f]" style={{ fontFamily: montserrat }}>
                  {s.desc}
                </p>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Expertise */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1312px] mx-auto flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-8">
          <Reveal className="flex flex-col gap-8 sm:gap-10 lg:gap-12 w-full lg:max-w-[613px]" amount={0.3}>
            <div className="flex flex-col gap-3">
              <GradientBadgeLabel label={t("expertise.badge")} />
              <div className="flex flex-col gap-4">
                <h2
                  className="text-[28px] sm:text-[34px] lg:text-[40px] font-medium text-[#182226] tracking-[-1px] leading-tight"
                  style={{ fontFamily: poppins }}
                >
                  {t("expertise.title")}
                </h2>
                <p className="text-[16px] sm:text-[18px] text-[#4f4f4f] leading-relaxed" style={{ fontFamily: montserrat }}>
                  {t("expertise.subtitle")}
                </p>
              </div>
            </div>
            <div className="h-[260px] sm:h-[380px] lg:h-[544px] w-full rounded-2xl overflow-hidden">
              <img src="/about/expertise.webp" alt="" className="h-full w-full object-cover" />
            </div>
          </Reveal>

          <Reveal className="flex flex-col gap-5 w-full lg:max-w-[667px]" stagger={0.12} amount={0.2}>
            {cards.map((card, i) => (
              <RevealItem
                key={card.title}
                className="flex flex-col gap-4 rounded-2xl border border-[#e9e9e9] bg-white p-6 sm:p-7"
              >
                <ExpertiseIcon path={EXPERTISE_ICON_PATHS[i]} />
                <p className="text-[22px] sm:text-[24px] font-medium text-[#0d2138] tracking-[-0.12px]" style={{ fontFamily: poppins }}>
                  {card.title}
                </p>
                <p className="text-[15px] sm:text-[16px] text-[#4f4f4f] leading-relaxed" style={{ fontFamily: montserrat }}>
                  {card.desc}
                </p>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </section>
    </>
  );
}

export function AboutGallery() {
  const { t } = useTranslation("about");

  return (
    <section className="bg-white py-12 sm:py-16 lg:py-20">
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1312px] mx-auto flex flex-col items-center gap-8 sm:gap-10 lg:gap-12">
        <Reveal className="flex flex-col items-center gap-4 text-center" amount={0.4}>
          <div className="flex items-center gap-3 w-full max-w-[456px]">
            <div className="h-px flex-1 bg-[#b0c9da]/60" />
            <span className="text-[13px] sm:text-[14px] text-[#5486b9] whitespace-nowrap" style={{ fontFamily: montserrat }}>
              {t("gallery.badge")}
            </span>
            <div className="h-px flex-1 bg-[#b0c9da]/60" />
          </div>
          <h2
            className="text-[28px] sm:text-[36px] lg:text-[44px] font-medium text-[#00223a] tracking-[-1px] leading-tight max-w-[700px]"
            style={{ fontFamily: poppins }}
          >
            {t("gallery.title")}
          </h2>
          <p className="text-[15px] sm:text-[17px] lg:text-[18px] text-[#3e4447] max-w-[539px]" style={{ fontFamily: montserrat }}>
            {t("gallery.subtitle")}
          </p>
        </Reveal>

        <Reveal className="grid grid-cols-2 lg:grid-cols-[1fr_0.8fr] gap-4 sm:gap-5 w-full" stagger={0.1} amount={0.15}>
          <RevealItem className="col-span-2 lg:col-span-1 h-[280px] sm:h-[420px] lg:h-[614px] rounded-2xl overflow-hidden">
            <img src={galleryImages[0]} alt="" className="h-full w-full object-cover" />
          </RevealItem>
          <div className="col-span-2 lg:col-span-1 flex flex-col gap-4 sm:gap-5">
            <div className="h-[160px] sm:h-[220px] rounded-2xl overflow-hidden">
              <img src={galleryImages[1]} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              <div className="h-[220px] sm:h-[380px] rounded-2xl overflow-hidden">
                <img src={galleryImages[2]} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col gap-4 sm:gap-5">
                <div className="h-[102px] sm:h-[180px] rounded-2xl overflow-hidden">
                  <img src={galleryImages[3]} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="h-[102px] sm:h-[180px] rounded-2xl overflow-hidden">
                  <img src={galleryImages[4]} alt="" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
