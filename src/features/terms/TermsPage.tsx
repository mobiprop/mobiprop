"use client";

import { useState } from "react";
import Link from "next/link";

/* ─── assets ─── */
const heroBg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg2.webp";
const heroOverlay =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg.webp";
const consultationBg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/contactformbg.webp";

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

/* ─── content data ─── */
const sections = [
  {
    heading: "1. Acceptance of terms",
    intro:
      "By accessing Realist's website, submitting property information, contacting our agents, or using any tools (such as home valuations or neighborhood guides), you confirm that:",
    list: {
      type: "ol" as const,
      items: [
        "You are at least 18 years old.",
        "You agree to comply with these Terms and Conditions.",
        "You are using the website for lawful purposes only.",
      ],
    },
    outro: "If you do not meet these conditions, you may not use our services.",
  },
  {
    heading: "2. Services we provide",
    intro: "Realist offers property-related resources including:",
    list: {
      type: "ul" as const,
      items: [
        "Residential and commercial property listings",
        "Home valuation tools",
        "Neighborhood information",
        "Agent profiles and contact services",
        "Property submission features",
        "Guides, news, and blog content",
      ],
    },
    outro:
      "We may update, change, or discontinue parts of the platform at any time without prior notice.",
  },
  {
    heading: "3. User responsibilities",
    intro: "When using our website, you agree that:",
    list: {
      type: "ol" as const,
      items: [
        "All information you submit is accurate and truthful.",
        "You will not upload false, misleading, or fraudulent property details.",
        "You will not attempt to hack, disrupt, or misuse the website.",
        "You will not impersonate an agent, homeowner, or another user.",
      ],
    },
    outro:
      "Any misuse may result in restricted access or removal of submitted content.",
  },
  {
    heading: "4. Property listings and accuracy",
    intro:
      "Realist strives to provide the most accurate and up-to-date information, but:",
    list: {
      type: "ul" as const,
      items: [
        "Property details may change without notice",
        "Prices, availability, and features are not guaranteed",
        "Images may be representative and not always exact",
      ],
    },
    outro:
      "We encourage users to verify information independently before making decisions.",
  },
  {
    heading: "5. Agent contact and communication",
    intro: "By contacting an agent through the website, you agree that:",
    list: {
      type: "ol" as const,
      items: [
        "Realist may forward your details to the appropriate agent.",
        "Agents may contact you via email or phone.",
        "You are requesting property-related assistance voluntarily.",
      ],
    },
    outro: "We do not guarantee specific response times or outcomes.",
  },
  {
    heading: "6. Intellectual property rights",
    intro:
      "Realist may link to outside resources or listing platforms. These external sites:",
    list: {
      type: "ul" as const,
      items: [
        "Are not controlled by Realist",
        "Have their own privacy and legal policies",
        "Are used at your own discretion",
      ],
    },
    outro:
      "We are not responsible for any issues arising from third-party websites.",
  },
];

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
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #EDF6FF 100%)",
        }}
      />

      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-[10px] sm:gap-[12px] lg:gap-[16px] px-4 sm:px-6 text-center">
        <h1
          className="text-[28px] sm:text-[34px] lg:text-[44px] font-semibold text-[#0d2138] leading-[36px] sm:leading-[44px] lg:leading-[56px] tracking-[-0.28px] sm:tracking-[-0.34px] lg:tracking-[-0.44px] max-w-[340px] sm:max-w-[520px] lg:max-w-[644px]"
          style={{ fontFamily: poppins }}
        >
          Terms &amp; Conditions
        </h1>
        <p
          className="text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038] leading-[20px] sm:leading-[22px] lg:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.15px] lg:tracking-[-0.16px]"
          style={{ fontFamily: montserrat }}
        >
          Last updated: October 15, 2023
        </p>
      </div>
    </section>
  );
}

/* ─── 2. Content ─── */
function TermsContent() {
  return (
    <div className="max-w-[952px] mx-auto px-4 sm:px-6 lg:px-0 py-[48px] sm:py-[64px] lg:py-[80px] flex flex-col gap-[36px] sm:gap-[42px] lg:gap-[48px]">
      {/* numbered sections */}
      {sections.map((s) => (
        <div
          key={s.heading}
          className="flex flex-col gap-[14px] sm:gap-[17px] lg:gap-[20px]"
        >
          <h2
            className="text-[24px] sm:text-[25px] lg:text-[28px] font-semibold text-[#0d2138] leading-[30px] sm:leading-[33px] lg:leading-[36px] tracking-[-0.22px] sm:tracking-[-0.25px] lg:tracking-[-0.28px]"
            style={{ fontFamily: poppins }}
          >
            {s.heading}
          </h2>
          <div
            className="text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[23px] lg:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.15px] lg:tracking-[-0.16px]"
            style={{ fontFamily: montserrat }}
          >
            <p className="mb-3">{s.intro}</p>
            {s.list.type === "ol" ? (
              <ol className="list-decimal ml-5 sm:ml-6 flex flex-col gap-1.5 sm:gap-1 mb-3">
                {s.list.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            ) : (
              <ul className="list-disc ml-5 sm:ml-6 flex flex-col gap-1.5 sm:gap-1 mb-3">
                {s.list.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            <p>{s.outro}</p>
          </div>
        </div>
      ))}

      {/* 12. Contact information */}
      <div className="flex flex-col gap-[14px] sm:gap-[17px] lg:gap-[20px]">
        <h2
          className="text-[22px] sm:text-[25px] lg:text-[28px] font-semibold text-[#0d2138] leading-[30px] sm:leading-[33px] lg:leading-[36px] tracking-[-0.22px] sm:tracking-[-0.25px] lg:tracking-[-0.28px]"
          style={{ fontFamily: poppins }}
        >
          12. Contact information
        </h2>
        <div
          className="text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[23px] lg:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.15px] lg:tracking-[-0.16px]"
          style={{ fontFamily: montserrat }}
        >
          <p className="mb-3">
            If you have questions about these Terms and Conditions, you can
            reach us at:
          </p>
          <p>
            <span className="font-medium text-[#0d2138]">
              info@ulrichpropiedades.com
            </span>
            <br />
            or via our{" "}
            <Link
              href="/contact"
              className="font-medium text-[#0d2138] hover:underline"
            >
              Contact Us
            </Link>{" "}
            page.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── 3. Consultation Banner ─── */
function ConsultationBanner() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
  });

  return (
    <section className="relative min-h-[690px] sm:min-h-[740px] lg:h-[784px] overflow-hidden">
      <img
        src={consultationBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-[rgba(10,25,53,0.35)]" />

      <div className="relative z-10 min-h-[690px] sm:min-h-[740px] lg:h-full flex items-center justify-center px-4 sm:px-6 py-10 sm:py-12 lg:py-0">
        <div className="bg-white rounded-[16px] sm:rounded-[18px] lg:rounded-[20px] p-4 sm:p-5 lg:p-[20px] w-full max-w-[539px] flex flex-col gap-[22px] sm:gap-[25px] lg:gap-[28px]">
          <h3
            className="text-[25px] sm:text-[30px] lg:text-[36px] font-medium text-[#0d2138] leading-[34px] sm:leading-[40px] lg:leading-[48px] tracking-[-0.25px] sm:tracking-[-0.3px] lg:tracking-[-0.36px]"
            style={{ fontFamily: poppins }}
          >
            Schedule a free consultation
          </h3>

          <div className="flex flex-col gap-[10px] sm:gap-[12px]">
            <div className="flex flex-col gap-[4px]">
              <label
                className="text-[13px] sm:text-[14px] font-medium text-[#0d2138] leading-[19px] sm:leading-[20px] tracking-[-0.13px] sm:tracking-[-0.14px]"
                style={{ fontFamily: montserrat }}
              >
                Full Name
              </label>
              <input
                type="text"
                placeholder="eg. Albert Jones"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="h-[44px] sm:h-auto border border-[#d1d5dc] rounded-[9px] sm:rounded-[10px] px-[12px] sm:p-[12px] text-[13px] sm:text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.13px] sm:tracking-[-0.14px] outline-none focus:border-[#4896b6] transition-colors"
                style={{ fontFamily: montserrat }}
              />
            </div>
            <div className="flex flex-col gap-[4px]">
              <label
                className="text-[13px] sm:text-[14px] font-medium text-[#0d2138] leading-[19px] sm:leading-[20px] tracking-[-0.13px] sm:tracking-[-0.14px]"
                style={{ fontFamily: montserrat }}
              >
                Email address
              </label>
              <input
                type="email"
                placeholder="albert@email.com"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="h-[44px] sm:h-auto border border-[#d1d5dc] rounded-[9px] sm:rounded-[10px] px-[12px] sm:p-[12px] text-[13px] sm:text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.13px] sm:tracking-[-0.14px] outline-none focus:border-[#4896b6] transition-colors"
                style={{ fontFamily: montserrat }}
              />
            </div>
            <div className="flex flex-col gap-[4px]">
              <label
                className="text-[13px] sm:text-[14px] font-medium text-[#0d2138] leading-[19px] sm:leading-[20px] tracking-[-0.13px] sm:tracking-[-0.14px]"
                style={{ fontFamily: montserrat }}
              >
                Topic
              </label>
              <input
                type="text"
                placeholder="Consultation"
                value={form.topic}
                onChange={(e) =>
                  setForm((f) => ({ ...f, topic: e.target.value }))
                }
                className="h-[44px] sm:h-auto border border-[#d1d5dc] rounded-[9px] sm:rounded-[10px] px-[12px] sm:p-[12px] text-[13px] sm:text-[14px] text-[#6a7282] leading-[20px] tracking-[-0.13px] sm:tracking-[-0.14px] outline-none focus:border-[#4896b6] transition-colors"
                style={{ fontFamily: montserrat }}
              />
            </div>
            <div className="flex flex-col gap-[4px]">
              <label
                className="text-[13px] sm:text-[14px] font-medium text-[#0d2138] leading-[19px] sm:leading-[20px] tracking-[-0.13px] sm:tracking-[-0.14px]"
                style={{ fontFamily: montserrat }}
              >
                Messages
              </label>
              <textarea
                placeholder="Enter a message"
                rows={4}
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                className="min-h-[105px] sm:min-h-[112px] border border-[#d1d5dc] rounded-[9px] sm:rounded-[10px] p-[12px] text-[13px] sm:text-[14px] text-[#99a1af] leading-[20px] tracking-[-0.13px] sm:tracking-[-0.14px] outline-none focus:border-[#4896b6] transition-colors resize-none"
                style={{ fontFamily: montserrat }}
              />
            </div>
          </div>

          <button
            className="w-full h-[44px] sm:h-[46px] rounded-[48px] flex items-center justify-center gap-[8px] sm:gap-[12px] text-[14px] sm:text-[16px] font-medium text-white leading-[22px] sm:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.16px]"
            style={{
              fontFamily: montserrat,
              background: "linear-gradient(to bottom, #005ea4, #006fc2)",
              border: "1px solid #0088ff",
            }}
          >
            Book a Free consultation
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="shrink-0"
            >
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
export function TermsPageContent() {
  return (
    <>
      <HeroBanner />
      <TermsContent />
      <ConsultationBanner />
    </>
  );
}
