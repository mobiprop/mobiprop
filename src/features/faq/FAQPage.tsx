"use client";

import { useState } from "react";

/* ─── assets ─── */
const heroBg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg2.png";
const heroOverlay = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg.png";
const consultationBg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/contactformbg.png";

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

/* ─── data ─── */
const categories = [
  "All Categories",
  "Venta",
  "Alquiler",
  "Alquiler Temporal",
  "Proyectos/Emprendimientos",
  "Casas",
  "Departamentos",
  "Terrenos",
  "Oficinas y Locales",
  "Barrios Cerrados",
];

const faqs = [
  {
    q: "How can I schedule a viewing for a property?",
    a: 'You can request a viewing by clicking the "Contact" or "Saber más" button on any listing. Our agents (like Carola) will coordinate a visit. You can also contact us directly via WhatsApp or email at info@ulrichpropiedades.com.',
  },
  {
    q: "What areas do you specialize in?",
    a: "We are specialists in Zona Norte (Buenos Aires), with a heavy focus on exclusive areas such as Pilar, Tortugas Country Club, Ayres del Pilar, Las Liebres, Highland Park, and Azzurra.",
  },
  {
    q: "Do you offer property appraisals (Tasaciones)?",
    a: "Yes, we offer professional property appraisal services conducted by our experienced agents. Contact us to schedule an appraisal.",
  },
  {
    q: "What documentation is required for a property sale?",
    a: "For a property sale you will typically need a valid ID, proof of property ownership, title deed, and relevant municipal documentation. Our agents will guide you through the full process.",
  },
  {
    q: "Can I list my property with Ulrich Propiedades?",
    a: "Absolutely. We welcome property listings from owners in Zona Norte. Reach out via our contact form or call us directly to discuss listing your property.",
  },
  {
    q: "Are there temporary rental options for summer?",
    a: "Yes, we handle a selection of temporary and seasonal rental properties, including summer rentals in exclusive residential neighborhoods.",
  },
  {
    q: "How do I filter searches for specific amenities like a pool or security?",
    a: "Use the advanced filters on our listings page to narrow down properties by amenities such as swimming pool, 24/7 security, garage, and more.",
  },
  {
    q: "What are the commission rates for buyers and sellers?",
    a: "Commission rates vary depending on the type of transaction. Please contact our team for a detailed breakdown tailored to your specific situation.",
  },
  {
    q: "How to Send one-time or recurring invoices to customers",
    a: "You can manage invoices through your client portal. Our team can assist you with setting up one-time or recurring payment arrangements.",
  },
];

/* ─── Plus / Minus icons ─── */
function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M12 5V19M5 12H19" stroke="#666D80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M5 12H19" stroke="#0D0D12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Search icon ─── */
function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <path
        d="M17.5 17.5L13.875 13.875M15.8333 9.16667C15.8333 12.8486 12.8486 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667Z"
        stroke="#737373"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

  <div className="relative h-full flex flex-col items-center justify-center gap-5 sm:gap-6 px-4 sm:px-6 text-center">
    <div className="flex flex-col gap-3 sm:gap-5 items-center w-full max-w-[672px]">
      <h1
        className="text-[28px] sm:text-[34px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.18] sm:leading-[1.25] lg:leading-[56px] tracking-[-0.3px] sm:tracking-[-0.44px] max-w-[340px] sm:max-w-[644px]"
        style={{ fontFamily: poppins }}
      >
        Frequently Asked Questions
      </h1>

      <p
        className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[21px] sm:leading-[24px] tracking-[-0.12px] sm:tracking-[-0.16px] max-w-[320px] sm:max-w-[560px]"
        style={{ fontFamily: montserrat }}
      >
        Build stronger customer relationships, make more sales and save time.
        Tendly makes it easy to build the exact CRM your business needs.
      </p>
    </div>

    <div className="flex flex-col gap-4 sm:gap-5 items-center w-full max-w-[420px]">
      <div className="bg-white border border-[#dfe1e7] rounded-[1000px] flex items-center gap-2 px-4 py-3 w-full">
        <SearchIcon />

        <input
          type="text"
          placeholder="Search"
          className="flex-1 min-w-0 text-[14px] sm:text-[16px] text-[#737373] leading-[1.6] outline-none bg-transparent"
          style={{ fontFamily: "Inter, sans-serif" }}
        />

        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <div className="bg-[#eceff3] rounded-[12px] flex items-center justify-center w-5 h-5">
            <span
              className="text-[10px] text-[#666d80]"
              style={{ fontFamily: montserrat }}
            >
              ⌘
            </span>
          </div>

          <div className="bg-[#eceff3] rounded-[12px] flex items-center justify-center w-5 h-5">
            <span
              className="text-[10px] text-[#666d80]"
              style={{ fontFamily: montserrat }}
            >
              K
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center">
        <span
          className="text-[14px] font-medium text-[#666d80] leading-5 tracking-[-0.14px] whitespace-nowrap"
          style={{ fontFamily: montserrat }}
        >
          Popular questions:
        </span>

        {["Importing", "Billing", "Integrations"].map((tag) => (
          <span
            key={tag}
            className="bg-[#f9fafb] border border-[#e5e7eb] rounded-[1000px] px-2 py-[2px] text-[12px] text-[#666d80] tracking-[-0.12px] whitespace-nowrap cursor-pointer hover:bg-[#f0f2f5] transition-colors"
            style={{ fontFamily: poppins }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  </div>
</section>
  );
}

/* ─── 2. FAQ Content ─── */
function FAQContent() {
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set([0, 1]));

  function toggle(i: number) {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[76px] py-10 sm:py-14 lg:py-[80px]">
  <div className="flex flex-col lg:flex-row gap-8 lg:gap-[70px] items-start">
    {/* ── Categories sidebar ── */}
    <div className="flex flex-col gap-4 lg:gap-[20px] shrink-0 lg:w-[250px] w-full">
      <p
        className="text-[16px] sm:text-[18px] lg:text-[20px] font-medium text-[#0d0d12] leading-6 lg:leading-[32px] tracking-[-0.16px] lg:tracking-[-0.2px]"
        style={{ fontFamily: poppins }}
      >
        Categories
      </p>

      <div className="flex flex-col border-l border-[#dfe1e7]">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="relative flex items-center w-full text-left pl-[22px] sm:pl-[26px] py-[8px] sm:py-[10px] lg:py-[6px]"
            >
              {isActive && (
                <span className="absolute left-[-1px] top-0 h-full w-[2px] bg-[#1e4f86]" />
              )}

              <span
                className="text-[14px] sm:text-[14px] lg:text-[16px] leading-[26px] sm:leading-[32px] lg:leading-[38px] tracking-[-0.16px] sm:tracking-[-0.2px] lg:tracking-[-0.24px]"
                style={{
                  fontFamily: montserrat,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#1e4f86" : "#666d80",
                }}
              >
                {cat}
              </span>
            </button>
          );
        })}
      </div>
    </div>

    {/* ── FAQ accordion ── */}
    <div className="flex flex-col gap-4 lg:gap-[20px] flex-1 min-w-0 w-full">
      <p
        className="text-[16px] sm:text-[18px] lg:text-[20px] font-medium text-[#0d0d12] leading-6 lg:leading-[32px] tracking-[-0.16px] lg:tracking-[-0.2px]"
        style={{ fontFamily: poppins }}
      >
        General Information
      </p>

      <div className="flex flex-col gap-3 lg:gap-[16px]">
        {faqs.map((faq, i) => {
          const isOpen = openIndexes.has(i);

          return (
            <div
              key={i}
              className="bg-white border border-[#dfe1e7] rounded-[10px] lg:rounded-[12px] overflow-hidden"
              style={{
                boxShadow:
                  "0px 1px 3px 0px rgba(13,13,18,0.05), 0px 1px 2px 0px rgba(13,13,18,0.04)",
              }}
            >
              <button
                onClick={() => toggle(i)}
                className="flex items-start sm:items-center justify-between gap-3 w-full px-4 py-4 lg:p-[24px] text-left"
              >
                <span
                  className="flex-1 min-w-0 text-[15px] sm:text-[16px] lg:text-[20px] font-medium text-[#0d0d12] leading-[22px] sm:leading-6 lg:leading-[32px] tracking-[-0.15px] sm:tracking-[-0.16px] lg:tracking-[-0.2px]"
                  style={{ fontFamily: poppins }}
                >
                  {faq.q}
                </span>

                <span className="mt-[2px] sm:mt-0 shrink-0 text-[#1e4f86]">
                  {isOpen ? <MinusIcon /> : <PlusIcon />}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 lg:px-[24px] pb-4 lg:pb-[24px]">
                  <p
                    className="text-[13px] sm:text-[14px] lg:text-[16px] text-[#666d80] leading-5 sm:leading-[22px] lg:leading-[24px] tracking-[-0.13px] sm:tracking-[-0.14px] lg:tracking-[-0.16px]"
                    style={{ fontFamily: montserrat }}
                  >
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>
</div>
  );
}

/* ─── 3. Consultation Banner ─── */
function ConsultationBanner() {
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" });

  return (
    <section className="relative h-[680px] lg:h-[784px] overflow-hidden">
      <img src={consultationBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-[rgba(10,25,53,0.35)]" />

      <div className="relative z-10 h-full flex items-center justify-center px-6">
        <div className="bg-white rounded-[20px] p-[20px] w-full max-w-[539px] flex flex-col gap-[28px]">
          <h3
            className="text-[24px] lg:text-[36px] font-medium text-[#0d2138] leading-[1.22] lg:leading-[48px] tracking-[-0.36px]"
            style={{ fontFamily: poppins }}
          >
            Schedule a free consultation
          </h3>

          <div className="flex flex-col gap-[12px]">
            {/* Full Name */}
            <div className="flex flex-col gap-[4px]">
              <label
                className="text-[14px] font-medium text-[#0d2138] leading-[20px] tracking-[-0.14px]"
                style={{ fontFamily: montserrat }}
              >
                Full Name
              </label>
              <input
                type="text"
                placeholder="eg. Albert Jones"
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
                Email address
              </label>
              <input
                type="email"
                placeholder="albert@email.com"
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
                Topic
              </label>
              <input
                type="text"
                placeholder="Consultation"
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
                Messages
              </label>
              <textarea
                placeholder="Enter a message"
                rows={4}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="border border-[#d1d5dc] rounded-[10px] p-[12px] text-[14px] text-[#99a1af] leading-[20px] tracking-[-0.14px] outline-none focus:border-[#4896b6] transition-colors resize-none"
                style={{ fontFamily: montserrat }}
              />
            </div>
          </div>

          <button
            className="w-full h-[46px] rounded-[48px] flex items-center justify-center gap-[12px] text-[16px] font-medium text-white leading-[24px] tracking-[-0.16px]"
            style={{
              fontFamily: montserrat,
              background: "linear-gradient(to bottom, #005ea4, #006fc2)",
              border: "1px solid #0088ff",
            }}
          >
            Book a Free consultation
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
export function FAQPageContent() {
  return (
    <>
      <HeroBanner />
      <FAQContent />
      <ConsultationBanner />
    </>
  );
}
