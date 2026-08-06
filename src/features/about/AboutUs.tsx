"use client";

import { useTranslation } from "react-i18next";
import { Reveal, RevealItem } from "@/components/common/Reveal";
import { SplitHeading } from "@/components/common/SplitHeading";

const heroBg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg2.webp";
const clouds =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/224a1a87c6d1fc7b05e65142626032911210d860.webp";
const teamImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/ourstory-2026.webp";
const expertiseImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/expertise-2026.webp";
const aboutImg1 =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/team-2026.webp";
const aboutImg2 =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/about-13.webp";
const ExpertiseMassageIcon =
  "/assets/figma-temp/BlogPage/Expertise-massage.svg";
const galleryRows = [
  [
    "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/gallery-1-2026.webp",
    "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/gallery-2-2026.webp",
    "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/gallery-3-2026.webp",
  ],
  [
    "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/gallery-4-2026.webp",
    "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/gallery-5-2026.webp",
    "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/gallery-6-2026.webp",
  ],
  [
    "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/gallery-7-2026.webp",
    "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/gallery-8-2026.webp",
    "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/gallery-9-2026.webp",
  ],
];

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

const STAT_VALUES = ["100%", "360°", "24/7"];

/* ─── section tag (dot + label) ─── */
function SectionTag({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[7px] h-[7px] rounded-full bg-[#4896b6] shrink-0" />
      <span
        className="text-[16px] font-medium text-[#6a7282] tracking-[-0.16px] leading-[24px]"
        style={{ fontFamily: montserrat }}
      >
        {label}
      </span>
    </div>
  );
}

function CardIcon() {
  return (
    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-[12px] sm:rounded-[14px] bg-[#f3f4f6] flex items-center justify-center shrink-0">
      <img
        src={ExpertiseMassageIcon}
        alt=""
        className="w-[20px] h-[20px] sm:w-[26px] sm:h-[26px] object-contain"
      />
    </div>
  );
}

export function AboutUsContent() {
  const { t } = useTranslation("about");

  const expertiseCards = t("expertise.cards", { returnObjects: true }) as {
    title: string;
    desc: string;
  }[];

  const stats = (
    t("aboutSection.stats", { returnObjects: true }) as {
      label: string;
      desc: string;
    }[]
  ).map((s, i) => ({ ...s, value: STAT_VALUES[i] }));

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative h-[360px] lg:h-[408px] overflow-hidden border-b border-black/10">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={heroBg}
            alt=""
            className="absolute w-full h-[110%] -top-[10%] object-cover"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(167,189,221,0.97) 0%, rgba(255,255,255,0.77) 45%, white 63%)",
          }}
        />
        <div className="absolute inset-0 opacity-40 overflow-hidden pointer-events-none">
          <img
            src={clouds}
            alt=""
            className="absolute w-full h-full object-cover"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #EDF6FF 100%)",
          }}
        />
        <Reveal
          as="div"
          amount={0.6}
          className="relative h-full flex flex-col items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 text-center"
        >
          <SectionTag label={t("hero.badge")} />

          <SplitHeading
            as="h1"
            text={t("hero.title")}
            className="text-[28px] sm:text-[34px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.18] sm:leading-[1.25] lg:leading-[56px] tracking-[-0.3px] sm:tracking-[-0.44px] max-w-[340px] sm:max-w-[644px]"
            style={{ fontFamily: poppins }}
            amount={0.6}
          />

          <p
            className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[21px] sm:leading-[24px] tracking-[-0.12px] sm:tracking-[-0.16px] max-w-[320px] sm:max-w-[560px]"
            style={{ fontFamily: montserrat }}
          >
            {t("hero.subtitle")}
          </p>
        </Reveal>
      </section>

      {/* ── Our Story ── */}
      <section className="bg-white">
        <div className="w-[calc(100%-28px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto py-12 sm:py-16 lg:py-20 flex flex-col items-center gap-7 sm:gap-10 lg:gap-12">
          <Reveal className="flex flex-col items-center gap-4 sm:gap-5 text-center" amount={0.5}>
            <SectionTag label={t("ourStory.badge")} />

            <SplitHeading
              as="h2"
              text={t("ourStory.title")}
              className="text-[23px] sm:text-[30px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.18] sm:leading-[1.2] lg:leading-[56px] tracking-[-0.28px] sm:tracking-[-0.44px] max-w-[340px] sm:max-w-[629px]"
              style={{ fontFamily: poppins }}
            />

            <p
              className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.16px] max-w-[820px]"
              style={{ fontFamily: montserrat }}
            >
              {t("ourStory.paragraph")}
            </p>
          </Reveal>

          <Reveal
            className="w-full rounded-[16px] sm:rounded-[20px] overflow-hidden h-[220px] sm:h-[300px] lg:h-[656px]"
            scale={1.1}
            duration={1}
            amount={0.3}
          >
            <img
              src={teamImg}
              alt="Our team"
              className="w-full h-full object-cover"
            />
          </Reveal>
        </div>
      </section>

      {/* ── Our Gallery ── */}
      <section className="bg-white">
        <div className="w-[calc(100%-32px)] sm:w-[calc(100%-48px)] max-w-[1440px] mx-auto py-10 sm:py-14 lg:py-20 flex flex-col gap-8 lg:gap-12">
          <Reveal className="flex flex-col gap-2 max-w-[631px]" amount={0.5}>
            <SectionTag label={t("gallery.badge")} />

            <SplitHeading
              as="h2"
              text={t("gallery.title")}
              className="text-[26px] sm:text-[32px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.25] lg:leading-[56px] tracking-[-0.3px] lg:tracking-[-0.44px]"
              style={{ fontFamily: poppins }}
            />

            <p
              className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.16px] max-w-[501px]"
              style={{ fontFamily: montserrat }}
            >
              {t("gallery.subtitle")}
            </p>
          </Reveal>

          {/* image grid with top/bottom fade */}
          <div className="relative">
            <div className="flex flex-col gap-4 sm:gap-6">
              {galleryRows.map((row, r) => (
                <Reveal
                  key={r}
                  as="div"
                  stagger={0.12}
                  amount={0.15}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                >
                  {row.map((src, c) => (
                    <RevealItem
                      key={`${r}-${c}`}
                      className="hover-shine h-[220px] sm:h-[280px] lg:h-[420px] rounded-[16px] sm:rounded-[20px] overflow-hidden"
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </RevealItem>
                  ))}
                </Reveal>
              ))}
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-[70px] sm:h-[100px] lg:h-[120px] bg-gradient-to-b from-white to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70px] sm:h-[100px] lg:h-[120px] bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Our Expertise ── */}
      <section className="bg-white">
        <div className="w-[calc(100%-32px)] sm:w-[calc(100%-48px)] max-w-[1440px] mx-auto py-10 sm:py-14 lg:py-20 flex flex-col lg:flex-row gap-8 lg:gap-6 items-start">
          {/* Left: heading + subtext + image */}
          <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10 lg:w-1/2">
            <Reveal className="flex flex-col gap-2" amount={0.5}>
              <SectionTag label={t("expertise.badge")} />

              <SplitHeading
                as="h2"
                text={t("expertise.title")}
                className="text-[26px] sm:text-[32px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.25] lg:leading-[56px] tracking-[-0.3px] lg:tracking-[-0.44px] max-w-[540px]"
                style={{ fontFamily: poppins }}
              />

              <p
                className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[25.6px] max-w-[597px]"
                style={{ fontFamily: montserrat }}
              >
                {t("expertise.subtitle")}
              </p>
            </Reveal>

            <Reveal
              className="rounded-[16px] overflow-hidden h-[220px] sm:h-[300px] lg:h-[406px] w-full"
              scale={1.1}
              duration={1}
              amount={0.3}
            >
              <img
                src={expertiseImg}
                alt="Our expertise"
                className="w-full h-full object-cover"
              />
            </Reveal>
          </div>

          {/* Right: cards */}
          <Reveal
            className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-4 sm:gap-5 lg:w-1/2 w-full"
            stagger={0.15}
            amount={0.2}
          >
            {expertiseCards.map((card) => (
              <RevealItem
                key={card.title}
                className="bg-white border border-[#d1d5dc] rounded-[16px] p-5 sm:p-6 lg:p-[30px] flex flex-col gap-3 sm:gap-4"
              >
                <CardIcon />

                <h3
                  className="text-[20px] sm:text-[22px] lg:text-[28px] font-semibold text-[#0d2138] leading-[1.25] lg:leading-[36px] tracking-[-0.22px] lg:tracking-[-0.28px]"
                  style={{ fontFamily: poppins }}
                >
                  {card.title}
                </h3>

                <p
                  className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.16px]"
                  style={{ fontFamily: montserrat }}
                >
                  {card.desc}
                </p>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── About Ulrich + Stats ── */}
      <section className="bg-white">
        <div className="w-[calc(100%-32px)] sm:w-[calc(100%-48px)] max-w-[1440px] mx-auto py-10 sm:py-14 lg:py-20 flex flex-col gap-8 lg:gap-12">
          {/* Text block */}
          <Reveal className="flex flex-col gap-3 sm:gap-4 max-w-[1196px]" amount={0.4}>
            <SectionTag label={t("aboutSection.badge")} />

            <div className="flex flex-col gap-5 sm:gap-6">
              <SplitHeading
                as="h2"
                text={t("aboutSection.heading")}
                className="text-[26px] sm:text-[30px] lg:text-[36px] font-semibold text-[#0d2138] leading-[1.25] lg:leading-[48px] tracking-[-0.3px] lg:tracking-[-0.36px] max-w-[761px]"
                style={{ fontFamily: poppins }}
              />

              <div className="flex flex-col gap-4 sm:gap-6">
                <p
                  className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.16px]"
                  style={{ fontFamily: montserrat }}
                >
                  {t("aboutSection.paragraph1")}
                </p>

                <p
                  className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.16px]"
                  style={{ fontFamily: montserrat }}
                >
                  {t("aboutSection.paragraph2")}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Images + stats */}
          <div className="flex flex-col gap-6 sm:gap-8">
            {/* two images */}
            <Reveal className="grid grid-cols-2 gap-4 sm:gap-6" stagger={0.15} amount={0.2}>
              <RevealItem className="hover-shine h-[180px] sm:h-[240px] lg:h-[291px] rounded-[14px] sm:rounded-[16px] overflow-hidden">
                <img
                  src={aboutImg1}
                  alt="Our story"
                  className="w-full h-full object-cover"
                />
              </RevealItem>

              <RevealItem className="hover-shine h-[180px] sm:h-[240px] lg:h-[291px] rounded-[14px] sm:rounded-[12px] overflow-hidden">
                <img
                  src={aboutImg2}
                  alt="Our story"
                  className="w-full h-full object-cover"
                />
              </RevealItem>
            </Reveal>

            {/* stats with dividers */}
            <Reveal
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-0"
              stagger={0.15}
              amount={0.3}
            >
              {stats.map((s, i) => (
                <RevealItem
                  key={s.label}
                  className={`flex flex-col gap-3 sm:gap-4 ${
                    i > 0 ? "sm:pl-6 lg:pl-10" : "sm:pr-6 lg:pr-10"
                  }`}
                >
                  <div
                    className="text-[24px] sm:text-[38px] lg:text-[44px] font-medium text-[#0d2138] leading-[1.15] lg:leading-[56px]"
                    style={{ fontFamily: poppins }}
                  >
                    {s.value}
                  </div>

                  <div className="flex flex-col gap-2 sm:gap-3">
                    <div
                      className="text-[16px] sm:text-[18px] font-semibold text-[#2b3038] leading-[24px] sm:leading-[26px] tracking-[-0.16px] sm:tracking-[-0.18px]"
                      style={{ fontFamily: poppins }}
                    >
                      {s.label}
                    </div>

                    <p
                      className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.16px]"
                      style={{ fontFamily: montserrat }}
                    >
                      {s.desc}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
