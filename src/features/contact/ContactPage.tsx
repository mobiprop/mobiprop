"use client";

import { useState } from "react";
import { FAQ } from "@/features/home/FAQ";

/* ─── assets ─── */
const heroBg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg2.webp";
const heroOverlay = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg.webp";
const mapImg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/ContactPage/map.webp";
const consultationBg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/contactformbg.webp";
const iconPhone = "/assets/figma-temp/UserProfile/phone.svg";
const iconEmail = "/assets/figma-temp/UserProfile/email.svg";
const iconAddress = "/assets/figma-temp/UserProfile/location.svg";

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

/* ─── shared dot tag ─── */
function SectionTag({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[7px] h-[7px] rounded-full bg-[#4896b6] shrink-0" />
      <span
        className="text-[16px] font-medium leading-[24px] tracking-[-0.16px]"
        style={{ fontFamily: montserrat, color: muted ? "#6a7282" : "#2b3038" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── 1. Hero ─── */
function HeroBanner() {
  return (
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
      src={heroOverlay}
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

  <div className="relative h-full flex flex-col items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 text-center">
    <SectionTag label="Contact Us" />

    <h1
      className="text-[28px] sm:text-[34px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.18] sm:leading-[1.25] lg:leading-[56px] tracking-[-0.3px] sm:tracking-[-0.44px] max-w-[340px] sm:max-w-[644px]"
      style={{ fontFamily: poppins }}
    >
      Get in Touch with Us
    </h1>

    <p
      className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[21px] sm:leading-[24px] tracking-[-0.12px] sm:tracking-[-0.16px] max-w-[320px] sm:max-w-[560px]"
      style={{ fontFamily: montserrat }}
    >
      Whether you&apos;re ready to buy, sell, or have questions about the
      market, the Ulrich team is here to guide you.
    </p>
  </div>
</section>
  );
}

/* ─── 2. Contact Card ─── */
function ContactCard() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });
  const [agreed, setAgreed] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const inputCls =
    "w-full h-[58px] bg-[#f8fafc] border border-[#e5e7eb] rounded-[14px] px-5 text-[16px] text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";

  return (
    <div className="w-[calc(100%-32px)] sm:w-[calc(100%-48px)] max-w-[1360px] mx-auto">
  <div className="bg-white rounded-[18px] sm:rounded-[20px] lg:rounded-[24px] shadow-[0px_10px_35px_-5px_#1B2D5412] overflow-hidden">
    <div className="flex flex-col lg:flex-row">
      {/* Left: Contact information */}
      <div className="w-full shrink-0 px-5 py-7 sm:p-8 md:px-10 md:py-10 lg:pl-[60px] lg:pt-[50px] lg:pb-[60px] lg:pr-8 lg:w-[532px]">
        <h2
          className="text-[24px] sm:text-[26px] lg:text-[28px] font-semibold text-[#101828] leading-[32px] sm:leading-[34px] lg:leading-[36px] tracking-[-0.28px] mb-2 sm:mb-3"
          style={{ fontFamily: poppins }}
        >
          Connect with Us:
        </h2>

        <p
          className="text-[14px] sm:text-[15px] lg:text-[16px] text-[#4a5565] leading-[21px] sm:leading-[23px] lg:leading-[24px] tracking-[-0.16px] mb-7 sm:mb-8 lg:mb-10 max-w-[420px]"
          style={{ fontFamily: montserrat }}
        >
          We&apos;re here to assist with buying or selling your home. Send us
          a message today.
        </p>

        <div className="flex flex-col gap-6 sm:gap-7 lg:gap-8">
          {[
            {
              icon: iconPhone,
              label: "Phone Number",
              value: "+1 (555) 123-4567",
            },
            {
              icon: iconEmail,
              label: "Email Address",
              value: "contact@ulrich.com",
            },
            {
              icon: iconAddress,
              label: "Address",
              value: "120 Brickell Avenue, Suite 450, Miami, FL",
            },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-start gap-3 sm:gap-4">
              <div className="w-[44px] h-[44px] sm:w-[48px] sm:h-[48px] bg-[#f3f4f6] rounded-[12px] sm:rounded-[14px] flex items-center justify-center shrink-0">
                <img
                  src={icon}
                  alt=""
                  className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]"
                />
              </div>

              <div className="min-w-0 pt-0.5">
                <p
                  className="text-[16px] sm:text-[17px] lg:text-[18px] font-medium text-[#101828] leading-[23px] sm:leading-[25px] lg:leading-[26px] tracking-[-0.18px]"
                  style={{ fontFamily: poppins }}
                >
                  {label}
                </p>

                <p
                  className="text-[14px] sm:text-[15px] lg:text-[16px] text-[#4a5565] leading-[21px] sm:leading-[23px] lg:leading-[24px] tracking-[-0.16px] break-words"
                  style={{ fontFamily: montserrat }}
                >
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile/tablet divider */}
      <div className="h-px bg-[#e5e7eb] mx-5 sm:mx-8 lg:hidden" />

      {/* Right: Contact form */}
      <div className="flex-1 min-w-0 px-5 py-7 sm:p-8 md:px-10 md:py-10 lg:pt-[48px] lg:pr-[60px] lg:pb-[60px] lg:pl-0">
        <div className="flex flex-col gap-4 sm:gap-[18px]">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full Name*"
            className={inputCls}
            style={{ fontFamily: poppins }}
          />

          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email Address*"
            className={inputCls}
            style={{ fontFamily: poppins }}
          />

          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone Number*"
            className={inputCls}
            style={{ fontFamily: poppins }}
          />

          <div className="relative">
            <select
              name="service"
              value={form.service}
              onChange={handleChange}
              className={`${inputCls} appearance-none pr-12 cursor-pointer`}
              style={{ fontFamily: poppins }}
            >
              <option value="" disabled>
                Service Interested In
              </option>
              <option value="buying">Buying</option>
              <option value="selling">Selling</option>
              <option value="consultation">Consultation</option>
              <option value="other">Other</option>
            </select>

            <svg
              className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#6a7282]"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Your Message"
            rows={5}
            className="w-full min-h-[130px] sm:min-h-[145px] bg-[#f8fafc] border border-[#e5e7eb] rounded-[12px] sm:rounded-[14px] px-4 sm:px-5 py-3.5 sm:py-4 text-[14px] sm:text-[16px] text-[#101828] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors resize-none"
            style={{ fontFamily: poppins }}
          />
        </div>

        {/* Checkbox and button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-5 gap-5 sm:gap-4">
          <label className="flex items-start sm:items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setAgreed(!agreed)}
              aria-pressed={agreed}
              className="w-[20px] h-[20px] mt-0.5 sm:mt-0 border border-[#d2d2d2] rounded-[2px] shrink-0 flex items-center justify-center transition-colors"
              style={{ background: agreed ? "#1e4f86" : "white" }}
            >
              {agreed && (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path
                    d="M1 5L4.5 8.5L11 1.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            <span
              className="text-[13px] sm:text-[14px] font-medium text-[#4a5565] leading-[20px]"
              style={{ fontFamily: poppins }}
            >
              I accept the terms and conditions
            </span>
          </label>

          <button
            type="button"
            className="w-full sm:w-auto h-[48px] px-8 bg-[#1e4f86] text-white text-[15px] sm:text-[16px] font-medium rounded-[12px] sm:rounded-[14px] hover:bg-[#1a4475] transition-colors whitespace-nowrap"
            style={{ fontFamily: poppins }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}

/* ─── 3. Location / Map ─── */
function LocationSection() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[60px] pt-[50px] sm:pt-[60px] lg:pt-[80px] pb-[50px] sm:pb-[60px] lg:pb-[80px]">
  {/* Heading */}
  <div className="flex flex-col items-center gap-3 sm:gap-4 mb-8 sm:mb-10 lg:mb-12 text-center max-w-[570px] mx-auto">
    <div className="flex flex-col items-center gap-2">
      <SectionTag label="Location" muted />

      <h2
        className="text-[26px] sm:text-[34px] lg:text-[44px] font-semibold text-[#0d2138] leading-[36px] sm:leading-[44px] lg:leading-[56px] tracking-[-0.3px] sm:tracking-[-0.44px]"
        style={{ fontFamily: poppins }}
      >
        Let&apos;s Talk About Your Real Estate Needs
      </h2>
    </div>

    <p
      className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[21px] sm:leading-[24px] tracking-[-0.12px] sm:tracking-[-0.16px] max-w-[520px]"
      style={{ fontFamily: montserrat }}
    >
      Whether you&apos;re ready to buy, sell, or have questions about the
      market, the Goeboek team is here to guide you.
    </p>
  </div>

  {/* Map */}
  <div className="relative h-[360px] sm:h-[460px] lg:h-[609px] rounded-[16px] sm:rounded-[20px] overflow-hidden">
    <img
      src={mapImg}
      alt="Office location map"
      className="absolute inset-0 w-full h-full object-cover"
    />

    {/* Location card */}
    <div className="absolute top-3 left-3 right-3 sm:top-5 sm:left-5 sm:right-auto bg-white rounded-[12px] shadow-[0_10px_7.5px_rgba(0,0,0,0.1),0_4px_3px_rgba(0,0,0,0.1)] w-auto sm:w-[288px] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <p
          className="text-[15px] sm:text-[16px] font-medium text-[#101828] leading-[22px] sm:leading-[24px] tracking-[-0.16px]"
          style={{ fontFamily: montserrat }}
        >
          Ulrich Estate
        </p>

        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            aria-label="Get directions"
            className="w-[30px] h-[30px] sm:w-[32px] sm:h-[32px] bg-[#f3f4f6] rounded-[8px] sm:rounded-[9px] flex items-center justify-center hover:bg-[#e5e7eb] transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4a5565"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4-4 4M3 12h18"
              />
            </svg>
          </button>

          <button
            type="button"
            aria-label="View location"
            className="w-[30px] h-[30px] sm:w-[32px] sm:h-[32px] bg-[#f3f4f6] rounded-[8px] sm:rounded-[9px] flex items-center justify-center hover:bg-[#e5e7eb] transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4a5565"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      <p
        className="text-[13px] sm:text-[14px] text-[#4a5565] leading-[19px] sm:leading-[20px] tracking-[-0.14px] mb-3"
        style={{ fontFamily: montserrat }}
      >
        Rozengracht 207, 1016 LZ
        <br />
        Amsterdam, Netherlands
      </p>

      <div className="flex items-center gap-1.5">
        <span
          className="text-[14px] sm:text-[16px] text-[#101828] leading-[22px] sm:leading-[24px]"
          style={{ fontFamily: montserrat }}
        >
          4.5
        </span>

        <svg
          className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]"
          viewBox="0 0 24 24"
          fill="#f59e0b"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>

        <span
          className="text-[14px] sm:text-[16px] text-[#155dfc] leading-[22px] sm:leading-[24px]"
          style={{ fontFamily: montserrat }}
        >
          (36)
        </span>
      </div>
    </div>
  </div>
</section>
  );
}

/* ─── 5. Consultation Banner (contact-page specific bg) ─── */
function ConsultationBannerSection() {
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  return (
   <section className="relative w-full py-12 sm:py-16 lg:py-20 overflow-hidden">
  <div className="absolute inset-0">
    <img
      src={consultationBg}
      alt=""
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-[rgba(10,25,53,0.35)]" />
  </div>

  <div className="relative z-10 w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto flex justify-center">
    <div className="bg-white rounded-[18px] sm:rounded-[20px] p-5 sm:p-8 lg:p-10 w-full max-w-[540px] shadow-xl">
      <h2
        className="text-[26px] sm:text-[30px] lg:text-[36px] font-medium text-[#0d2138] leading-[34px] sm:leading-[38px] lg:leading-tight mb-5 sm:mb-7"
        style={{ fontFamily: poppins }}
      >
        Schedule a free consultation
      </h2>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[14px] font-medium text-[#0d2138]"
            style={{ fontFamily: montserrat }}
          >
            Full Name
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="eg. Albert Jones"
            className="w-full border border-[#d1d5dc] rounded-[10px] px-3 py-3 text-[14px] text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
            style={{ fontFamily: montserrat }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="text-[14px] font-medium text-[#0d2138]"
            style={{ fontFamily: montserrat }}
          >
            Email address
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="albert@email.com"
            className="w-full border border-[#d1d5dc] rounded-[10px] px-3 py-3 text-[14px] text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
            style={{ fontFamily: montserrat }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="text-[14px] font-medium text-[#0d2138]"
            style={{ fontFamily: montserrat }}
          >
            Topic
          </label>
          <input
            name="topic"
            value={form.topic}
            onChange={handleChange}
            placeholder="Consultation"
            className="w-full border border-[#d1d5dc] rounded-[10px] px-3 py-3 text-[14px] text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
            style={{ fontFamily: montserrat }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="text-[14px] font-medium text-[#0d2138]"
            style={{ fontFamily: montserrat }}
          >
            Messages
          </label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Enter a message"
            rows={4}
            className="w-full border border-[#d1d5dc] rounded-[10px] px-3 py-3 text-[14px] text-[#99a1af] outline-none focus:border-[#1e4f86] transition-colors resize-none"
            style={{ fontFamily: montserrat }}
          />
        </div>
      </div>

      <button
        type="button"
        className="relative mt-5 sm:mt-6 w-full overflow-hidden flex items-center justify-center gap-3 py-[14px] rounded-[48px] text-white text-[14px] sm:text-[15px] font-medium hover:opacity-90 transition-opacity tracking-[-0.01em]"
        style={{
          fontFamily: montserrat,
          background: "linear-gradient(to bottom, #005ea4, #006fc2)",
          border: "1px solid #0088ff",
        }}
      >
        <span
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "url('/assets/figma-temp/BlogPage/btn-img.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <span className="relative z-10 flex items-center justify-center gap-3">
          Book a Free consultation
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path
              d="M1 7h16M10 1l6 6-6 6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    </div>
  </div>
</section>
  );
}

/* ─── main export ─── */
export function ContactPageContent() {
  return (
    <>
      <HeroBanner />

      {/* Contact card — 80px gap below hero per Figma */}
      <div className="bg-white pt-[60px] lg:pt-[80px] pb-[60px]  lg:px-[60px]">
        <ContactCard />
      </div>

      {/* Map / Location */}
      <LocationSection />

      {/* FAQ — reused from home (identical content) */}
      <FAQ />

      {/* Consultation Banner */}
      <ConsultationBannerSection />
    </>
  );
}
