"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";

/* ─── assets ─── */
const heroBg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg2.webp";
const heroOverlay = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg.webp";
const consultationBg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/contactformbg.webp";

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

/* ─── icons ─── */
function MailIcon() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" className="shrink-0">
      <path
        d="M1.1665 1.83333H12.8332C13.4748 1.83333 13.9998 2.35833 13.9998 3V9.33333C13.9998 9.975 13.4748 10.5 12.8332 10.5H1.1665C0.524824 10.5 -0.000175476 9.975 -0.000175476 9.33333V3C-0.000175476 2.35833 0.524824 1.83333 1.1665 1.83333Z"
        stroke="#2b3038"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.9998 3L6.99984 6.75L-0.000175476 3"
        stroke="#2b3038"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path
        d="M13.0002 9.8201V11.5701C13.0009 11.7315 12.9678 11.8913 12.9031 12.0392C12.8385 12.187 12.7437 12.3196 12.6248 12.4284C12.5059 12.5371 12.3655 12.6196 12.2126 12.6704C12.0596 12.7213 11.8976 12.7393 11.7374 12.7234C9.83638 12.5205 8.01063 11.8687 6.41117 10.8234C4.92475 9.86688 3.65809 8.60022 2.70156 7.1138C1.65279 5.50742 1.00083 3.67319 0.801432 1.7638C0.785621 1.60394 0.803479 1.44225 0.854047 1.28952C0.904616 1.13678 0.986816 0.996425 1.09493 0.877626C1.20305 0.758827 1.33483 0.664073 1.48194 0.599202C1.62905 0.534331 1.78833 0.500699 1.94944 0.500759H3.69944C3.98015 0.497977 4.25213 0.597783 4.46466 0.780848C4.67719 0.963912 4.81591 1.21774 4.85527 1.4955C4.92872 2.05027 5.06527 2.59484 5.26205 3.1188C5.34013 3.32793 5.35655 3.5549 5.30934 3.77308C5.26212 3.99127 5.15324 4.19139 4.99563 4.35046L4.24644 5.09965C5.13469 6.64044 6.40965 7.91539 7.95044 8.80365L8.69963 8.05446C8.8587 7.89685 9.05882 7.78797 9.27701 7.74075C9.49519 7.69354 9.72216 7.70996 9.93129 7.78804C10.4552 7.98482 10.9998 8.12137 11.5546 8.19482C11.8354 8.23452 12.0917 8.37582 12.275 8.59196C12.4584 8.80811 12.5563 9.08437 12.5501 9.3681L13.0002 9.8201Z"
        stroke="#2b3038"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" className="shrink-0">
      <path
        d="M5.8335 7.58333C7.02012 7.58333 7.97933 6.62412 7.97933 5.4375C7.97933 4.25088 7.02012 3.29167 5.8335 3.29167C4.64688 3.29167 3.68767 4.25088 3.68767 5.4375C3.68767 6.62412 4.64688 7.58333 5.8335 7.58333Z"
        stroke="#2b3038"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.8335 0.583344C4.47906 0.583344 3.17986 1.12208 2.22342 2.07852C1.26699 3.03496 0.728249 4.33416 0.728249 5.68861C0.728249 7.84028 2.35783 10.2028 5.5835 13.4167C5.8335 13.4167 5.8335 13.4167 6.0835 13.1667C9.22492 9.95278 10.9385 7.73611 10.9385 5.68861C10.9385 4.33416 10.3997 3.03496 9.44329 2.07852C8.48685 1.12208 7.18765 0.583344 5.8335 0.583344Z"
        stroke="#2b3038"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── 1. Hero ─── */
function HeroBanner() {
  const { t } = useTranslation("privacy");
  return (
   <section className="relative h-[360px] lg:h-[408px] overflow-hidden border-b border-black/10">
  {/* Background image */}
  <div className="absolute inset-0 overflow-hidden">
    <img
      src={heroBg}
      alt=""
      className="absolute w-full h-[110%] -top-[10%] object-cover"
    />
  </div>

  {/* Main gradient */}
  <div
    className="absolute inset-0"
    style={{
      background:
        "linear-gradient(to bottom, rgba(167,189,221,0.97) 0%, rgba(255,255,255,0.77) 45%, white 63%)",
    }}
  />

  {/* Overlay image */}
  <div className="absolute inset-0 opacity-40 overflow-hidden pointer-events-none">
    <img
      src={heroOverlay}
      alt=""
      className="absolute inset-0 w-full h-full object-cover"
    />
  </div>

  {/* Bottom fade */}
  <div
    className="absolute inset-0"
    style={{
      background:
        "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #EDF6FF 100%)",
    }}
  />

  {/* Content */}
  <div className="relative z-10 h-full flex flex-col items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 text-center">
    {/* Tag */}
    <div className="flex items-center gap-2">
      <span className="w-[7px] h-[7px] rounded-full bg-[#4896b6] shrink-0" />

      <span
        className="text-[14px] sm:text-[16px] font-medium text-[#2b3038] leading-[21px] sm:leading-[24px] tracking-[-0.12px] sm:tracking-[-0.16px]"
        style={{ fontFamily: montserrat }}
      >
        {t("hero.tag")}
      </span>
    </div>

    <h1
      className="text-[28px] sm:text-[34px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.18] sm:leading-[1.25] lg:leading-[56px] tracking-[-0.3px] sm:tracking-[-0.44px] max-w-[340px] sm:max-w-[644px]"
      style={{ fontFamily: poppins }}
    >
      {t("hero.title")}
    </h1>

    <p
      className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[21px] sm:leading-[24px] tracking-[-0.12px] sm:tracking-[-0.16px]"
      style={{ fontFamily: montserrat }}
    >
      {t("hero.lastUpdated")}
    </p>
  </div>
</section>
  );
}

/* ─── 2. Content ─── */
function PrivacyContent() {
  const { t } = useTranslation("privacy");
  const fields = t("section1.fields", { returnObjects: true }) as string[];
  return (
    <div className="max-w-[1196px] mx-auto px-6 lg:px-10 py-[80px] flex flex-col gap-[48px]">

      {/* ── Intro section ── */}
    <div className="flex flex-col gap-[24px] sm:gap-[28px] lg:gap-[32px]">
  {/* Heading block */}
  <div className="flex flex-col gap-[12px] sm:gap-[14px] lg:gap-[16px] max-w-[759px]">
    {/* Breadcrumb */}
    <div className="flex items-center gap-[6px]">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="shrink-0"
      >
        <path
          d="M12.6667 8H3.33334M3.33334 8L8.00001 12.6667M3.33334 8L8.00001 3.33333"
          stroke="#6a7282"
          strokeWidth="1.33"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span
        className="text-[14px] sm:text-[15px] lg:text-[16px] text-[#6a7282] leading-[20px] sm:leading-[22px] lg:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.15px] lg:tracking-[-0.16px]"
        style={{ fontFamily: montserrat }}
      >
        {t("intro.breadcrumb")}
      </span>
    </div>

    <h2
      className="text-[24px] sm:text-[28px] lg:text-[40px] font-semibold text-[#0d2138] leading-[32px] sm:leading-[38px] lg:leading-[52px] tracking-[-0.24px] sm:tracking-[-0.28px] lg:tracking-[-0.4px]"
      style={{ fontFamily: poppins }}
    >
      {t("intro.heading")}
    </h2>
  </div>

  {/* Body */}
  <div
    className="flex flex-col gap-[18px] sm:gap-[20px] lg:gap-[24px] text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[23px] lg:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.15px] lg:tracking-[-0.16px]"
    style={{ fontFamily: montserrat }}
  >
    <p>{t("intro.body1")}</p>

    <ul className="list-disc ml-5 sm:ml-6 flex flex-col gap-1.5 sm:gap-1">
      <li>
        {t("intro.visitWebsitePre")}{" "}
        <span className="font-semibold text-[#4896b6] break-all">
          https://ulrichpropiedades.com
        </span>
        {t("intro.visitWebsitePost")}
      </li>

      <li>{t("intro.engageOtherWays")}</li>
    </ul>

    <p>
      {t("intro.body2Pre")} info@ulrichpropiedades.com{t("intro.body2Post")}
    </p>
  </div>
</div>

      {/* ── Summary of key points ── */}
     <div className="flex flex-col gap-[24px] sm:gap-[28px] lg:gap-[32px]">
  <h3
    className="text-[22px] sm:text-[25px] lg:text-[28px] font-semibold text-[#0d2138] leading-[30px] sm:leading-[33px] lg:leading-[36px] tracking-[-0.22px] sm:tracking-[-0.25px] lg:tracking-[-0.28px]"
    style={{ fontFamily: poppins }}
  >
    {t("summary.heading")}
  </h3>

  <div
    className="flex flex-col gap-[20px] sm:gap-[25px] lg:gap-[31px] text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[23px] lg:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.15px] lg:tracking-[-0.16px]"
    style={{ fontFamily: montserrat }}
  >
    <p>{t("summary.p1")}</p>

    <p>{t("summary.p2")}</p>

    <p>{t("summary.p3")}</p>

    <p>{t("summary.p4")}</p>

    <p>{t("summary.p5")}</p>

    <p>{t("summary.p6")}</p>

    <p>{t("summary.p7")}</p>

    <p>
      {t("summary.p8Pre")}{" "}
      <span className="font-semibold text-[#1e4f86]">{t("summary.clickHere")}</span>{" "}
      {t("summary.p8Post")}
    </p>

    <p>
      {t("summary.p9Pre")}{" "}
      <span className="font-semibold text-[#1e4f86] break-all">
        https://ulrichpropiedades.com/contact
      </span>
      {t("summary.p9Post")}
    </p>

    <p>
      {t("summary.p10Pre")}{" "}
      <span className="font-semibold text-[#1e4f86]">{t("summary.clickHere")}</span>{" "}
      {t("summary.p10Post")}
    </p>
  </div>
</div>

      {/* ── Section 1: What information do we collect? ── */}
      <div className="flex flex-col gap-[24px] sm:gap-[28px] lg:gap-[32px]">
  <ol
    className="list-decimal ml-[28px] sm:ml-[34px] lg:ml-[42px] text-[22px] sm:text-[25px] lg:text-[28px] font-semibold text-[#0d2138] leading-[30px] sm:leading-[33px] lg:leading-[36px] tracking-[-0.22px] sm:tracking-[-0.25px] lg:tracking-[-0.28px]"
    style={{ fontFamily: poppins }}
  >
    <li>{t("section1.heading")}</li>
  </ol>

  <div className="flex flex-col gap-[20px] sm:gap-[22px] lg:gap-[24px]">
    {/* Main body */}
    <div
      className="flex flex-col gap-[18px] sm:gap-[20px] lg:gap-[24px] text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[23px] lg:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.15px] lg:tracking-[-0.16px]"
      style={{ fontFamily: montserrat }}
    >
      <p>{t("section1.shortNote")}</p>

      <p>{t("section1.p1")}</p>

      <div>
        <p className="mb-2 sm:mb-1">{t("section1.providedByYouIntro")}</p>

        <ul className="list-disc ml-5 sm:ml-6 flex flex-col gap-1 sm:gap-0.5">
          {fields.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <p>{t("section1.sensitiveInfo")}</p>

      <p>{t("section1.socialLogin")}</p>

      <p>{t("section1.accuracyNote")}</p>
    </div>

    {/* Contact Information */}
    <div className="flex flex-col gap-[14px] sm:gap-[15px] lg:gap-[16px] max-w-[840px]">
      <h4
        className="text-[22px] sm:text-[25px] lg:text-[28px] font-semibold text-[#0d2138] leading-[30px] sm:leading-[33px] lg:leading-[36px] tracking-[-0.22px] sm:tracking-[-0.25px] lg:tracking-[-0.28px]"
        style={{ fontFamily: poppins }}
      >
        {t("section1.contactHeading")}
      </h4>

      <p
        className="text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[23px] lg:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.15px] lg:tracking-[-0.16px]"
        style={{ fontFamily: montserrat }}
      >
        {t("section1.contactIntro")}
      </p>

      <div className="flex flex-col gap-[10px] sm:gap-[12px]">
        {/* Email */}
        <div className="flex items-start sm:items-center gap-[10px] sm:gap-[12px]">
          <div className="flex items-center justify-center w-[30px] h-[30px] sm:w-[32px] sm:h-[32px] rounded-full bg-white shrink-0 shadow-sm">
            <MailIcon />
          </div>

          <span
            className="min-w-0 break-all text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[23px] lg:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.15px] lg:tracking-[-0.16px]"
            style={{ fontFamily: montserrat }}
          >
            info@ulrichpropiedades.com
          </span>
        </div>

        {/* Phone */}
        <div className="flex items-start sm:items-center gap-[10px] sm:gap-[12px]">
          <div className="flex items-center justify-center w-[30px] h-[30px] sm:w-[32px] sm:h-[32px] rounded-full bg-white shrink-0 shadow-sm">
            <PhoneIcon />
          </div>

          <span
            className="text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[23px] lg:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.15px] lg:tracking-[-0.16px]"
            style={{ fontFamily: montserrat }}
          >
            +54 9 11 6161 8646
          </span>
        </div>

        {/* Address */}
        <div className="flex items-start sm:items-center gap-[10px] sm:gap-[12px]">
          <div className="flex items-center justify-center w-[30px] h-[30px] sm:w-[32px] sm:h-[32px] rounded-full bg-white shrink-0 shadow-sm">
            <MapPinIcon />
          </div>

          <span
            className="min-w-0 break-words text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[23px] lg:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.15px] lg:tracking-[-0.16px]"
            style={{ fontFamily: montserrat }}
          >
            Tortugas Country Club, Buenos Aires, Argentina, 1667
          </span>
        </div>
      </div>
    </div>
  </div>
</div>
    </div>
  );
}

/* ─── 3. Consultation Banner ─── */
function ConsultationBanner() {
  const { t } = useTranslation("privacy");
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });

  return (
    <section className="relative h-[680px] lg:h-[784px] overflow-hidden">
      {/* bg image + overlay */}
      <img src={consultationBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-[rgba(10,25,53,0.35)]" />

      {/* form card */}
      <div className="relative z-10 h-full flex items-center justify-center px-6">
        <div className="bg-white rounded-[20px] p-[20px] w-full max-w-[539px] flex flex-col gap-[28px] overflow-hidden">
          <h3
            className="text-[28px] lg:text-[36px] font-medium text-[#0d2138] leading-[1.33] lg:leading-[48px] tracking-[-0.36px]"
            style={{ fontFamily: poppins }}
          >
            {t("consultation.heading")}
          </h3>

          <div className="flex flex-col gap-[12px]">
            {/* Full Name */}
            <div className="flex flex-col gap-[4px]">
              <label
                className="text-[14px] font-medium text-[#0d2138] leading-[20px] tracking-[-0.14px]"
                style={{ fontFamily: montserrat }}
              >
                {t("consultation.fullNameLabel")}
              </label>
              <input
                type="text"
                placeholder={t("consultation.fullNamePlaceholder")}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="border border-[#d1d5dc] rounded-[10px] p-[12px] text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px] outline-none focus:border-[#4896b6] transition-colors"
                style={{ fontFamily: montserrat }}
              />
            </div>
            {/* Email */}
            <div className="flex flex-col gap-[4px]">
              <label
                className="text-[14px] font-medium text-[#0d2138] leading-[20px] tracking-[-0.14px]"
                style={{ fontFamily: montserrat }}
              >
                {t("consultation.emailLabel")}
              </label>
              <input
                type="email"
                placeholder={t("consultation.emailPlaceholder")}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="border border-[#d1d5dc] rounded-[10px] p-[12px] text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px] outline-none focus:border-[#4896b6] transition-colors"
                style={{ fontFamily: montserrat }}
              />
            </div>
            {/* Topic */}
            <div className="flex flex-col gap-[4px]">
              <label
                className="text-[14px] font-medium text-[#0d2138] leading-[20px] tracking-[-0.14px]"
                style={{ fontFamily: montserrat }}
              >
                {t("consultation.topicLabel")}
              </label>
              <input
                type="text"
                placeholder={t("consultation.topicPlaceholder")}
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                className="border border-[#d1d5dc] rounded-[10px] p-[12px] text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.14px] outline-none focus:border-[#4896b6] transition-colors"
                style={{ fontFamily: montserrat }}
              />
            </div>
            {/* Messages */}
            <div className="flex flex-col gap-[4px]">
              <label
                className="text-[14px] font-medium text-[#0d2138] leading-[20px] tracking-[-0.14px]"
                style={{ fontFamily: montserrat }}
              >
                {t("consultation.messageLabel")}
              </label>
              <textarea
                placeholder={t("consultation.messagePlaceholder")}
                rows={4}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="border border-[#d1d5dc] rounded-[10px] p-[12px] text-[14px] text-[#99a1af] leading-[20px] tracking-[-0.14px] outline-none focus:border-[#4896b6] transition-colors resize-none"
                style={{ fontFamily: montserrat }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            className="w-full h-[46px] rounded-[48px] flex items-center justify-center gap-[12px] text-[16px] font-medium text-white leading-[24px] tracking-[-0.16px]"
            style={{
              fontFamily: montserrat,
              background: "linear-gradient(to bottom, #005ea4, #006fc2)",
              border: "1px solid #0088ff",
            }}
          >
            {t("consultation.submitButton")}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
              <path
                d="M4.16666 10H15.8333M15.8333 10L10 4.16667M15.8333 10L10 15.8333"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── main export ─── */
export function PrivacyPolicyContent() {
  return (
    <>
      <HeroBanner />
      <PrivacyContent />
      <ConsultationBanner />
    </>
  );
}
