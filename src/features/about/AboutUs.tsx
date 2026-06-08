const heroBg = "/assets/figma-temp/AboutUs/7c381d7793bef2f0501fb33eaa3df52bea0aa4ef.png";
const clouds = "/assets/figma-temp/AboutUs/224a1a87c6d1fc7b05e65142626032911210d860.png";
const teamImg = "/assets/figma-temp/AboutUs/b899c84aa4076fb26befc9d304f327cf0d73e9c4.png";
const expertiseImg = "/assets/figma-temp/AboutUs/588e2ac07e8ad705ffa6608997ace8d55b9a9849.png";
const aboutImg1 = "/assets/figma-temp/AboutUs/8137495f6ced8731d50e90db7307a71887d9405e.png";
const aboutImg2 = "/assets/figma-temp/AboutUs/5e9224a430ef2b5ac63582faee420b32e47f98c2.png";

const galleryRows = [
  [
    "/assets/figma-temp/AboutUs/gallery-prop1.png",
    "/assets/figma-temp/AboutUs/gallery-prop2.png",
    "/assets/figma-temp/AboutUs/gallery-prop3.png",
  ],
  [
    "/assets/figma-temp/AboutUs/gallery-prop5.png",
    "/assets/figma-temp/AboutUs/gallery-prop7.png",
    "/assets/figma-temp/AboutUs/gallery-prop8.png",
  ],
  [
    "/assets/figma-temp/AboutUs/gallery-prop1.png",
    "/assets/figma-temp/AboutUs/gallery-prop2.png",
    "/assets/figma-temp/AboutUs/gallery-prop3.png",
  ],
];

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

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
    <div className="w-14 h-14 rounded-[14px] bg-[#f3f4f6] flex items-center justify-center shrink-0">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 19V7a2 2 0 0 1 2-2h7l3 3h0M4 19h16V10a2 2 0 0 0-2-2H9"
          stroke="#1E4F86"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

const expertiseCards = [
  {
    title: "Property Sales & Consultation",
    desc: "Expert guidance through every step — from first inquiry to final handover, ensuring a smooth and confident buying experience.",
  },
  {
    title: "Premium Listing Curation",
    desc: "Each property is carefully selected for its design, quality, and comfort reflecting Ulrich commitment to modern minimalist.",
  },
  {
    title: "After-Sales Support",
    desc: "Our commitment doesn't end with a sale — we're here to ensure every client feels supported, understood, and valued.",
  },
];

const stats = [
  {
    value: "$150M+",
    label: "Properties sold",
    desc: "Over $150M in sales, helping clients find homes and investments with ease and confidence.",
  },
  {
    value: "500+",
    label: "Happy Clients",
    desc: "More than 500 satisfied clients trust us to make their real estate journey smooth and successful.",
  },
  {
    value: "20+",
    label: "Years of Expertise",
    desc: "Over 20 years of experience guiding clients with market insight and professional advice.",
  },
];

export function AboutUsContent() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative h-[360px] lg:h-[408px] overflow-hidden border-b border-black/10">
        <div className="absolute inset-0 overflow-hidden">
          <img src={heroBg} alt="" className="absolute w-full h-[110%] -top-[10%] object-cover" />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(167,189,221,0.97) 0%, rgba(255,255,255,0.77) 45%, white 63%)",
          }}
        />
        <div className="absolute inset-0 opacity-40 overflow-hidden pointer-events-none">
          <img src={clouds} alt="" className="absolute w-full h-full object-cover" />
        </div>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #EDF6FF 100%)" }}
        />
        <div className="relative h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
          <SectionTag label="About Us" />
          <h1
            className="text-[34px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.25] lg:leading-[56px] tracking-[-0.44px] max-w-[624px]"
            style={{ fontFamily: poppins }}
          >
            Where Global Property Meets Local Expertise
          </h1>
          <p
            className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px] max-w-[560px]"
            style={{ fontFamily: montserrat }}
          >
            Discover a wide range of properties, from cozy apartments to luxurious estates, tailored to suit every need and budget.
          </p>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="bg-white">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16 lg:py-20 flex flex-col items-center gap-10 lg:gap-12">
          <div className="flex flex-col items-center gap-2 text-center">
            <SectionTag label="Our Story" />
            <h2
              className="text-[30px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.2] lg:leading-[56px] tracking-[-0.44px] max-w-[629px]"
              style={{ fontFamily: poppins }}
            >
              Finding a Property Should be Exciting, not Overwhelming.
            </h2>
          </div>
          <div className="w-full rounded-[20px] overflow-hidden h-[300px] lg:h-[560px]">
            <img src={teamImg} alt="Our team" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* ── Our Gallery ── */}
      <section className="bg-white">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16 lg:py-20 flex flex-col gap-10 lg:gap-12">
          <div className="flex flex-col gap-2 max-w-[631px]">
            <SectionTag label="Our Gallery" />
            <h2
              className="text-[30px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.2] lg:leading-[56px] tracking-[-0.44px]"
              style={{ fontFamily: poppins }}
            >
              Property Moments Captured Beautifully
            </h2>
            <p
              className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px] max-w-[501px]"
              style={{ fontFamily: montserrat }}
            >
              Explore high quality images reflecting comfort design, location, &amp; everyday living experience,
            </p>
          </div>

          {/* image grid with top/bottom fade */}
          <div className="relative">
            <div className="flex flex-col gap-6">
              {galleryRows.map((row, r) => (
                <div key={r} className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {row.map((src, c) => (
                    <div
                      key={`${r}-${c}`}
                      className="h-[260px] lg:h-[420px] rounded-[20px] overflow-hidden"
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[120px] bg-gradient-to-b from-white to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[120px] bg-gradient-to-t from-white to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Our Expertise ── */}
      <section className="bg-white">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16 lg:py-20 flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: heading + subtext + image */}
          <div className="flex flex-col gap-10 lg:w-1/2">
            <div className="flex flex-col gap-2">
              <SectionTag label="Our Expertise" />
              <h2
                className="text-[28px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.2] lg:leading-[56px] tracking-[-0.44px] max-w-[540px]"
                style={{ fontFamily: poppins }}
              >
                Driven by Experience, All About Excellence
              </h2>
              <p
                className="text-[16px] text-[#2b3038] leading-[25.6px] max-w-[597px]"
                style={{ fontFamily: montserrat }}
              >
                Ulrich brings clarity and confidence to every step of your home-buying journey — combining market insight, design sensibility, and trusted service.
              </p>
            </div>
            <div className="rounded-[16px] overflow-hidden h-[260px] lg:h-[406px]">
              <img src={expertiseImg} alt="Our expertise" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Right: cards */}
          <div className="flex flex-col gap-5 lg:w-1/2">
            {expertiseCards.map((card) => (
              <div
                key={card.title}
                className="bg-white border border-[#d1d5dc] rounded-[16px] p-[30px] flex flex-col gap-4"
              >
                <CardIcon />
                <h3
                  className="text-[22px] lg:text-[28px] font-semibold text-[#0d2138] leading-[1.25] lg:leading-[36px] tracking-[-0.28px]"
                  style={{ fontFamily: poppins }}
                >
                  {card.title}
                </h3>
                <p
                  className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px]"
                  style={{ fontFamily: montserrat }}
                >
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Ulrich + Stats ── */}
      <section className="bg-white">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16 lg:py-20 flex flex-col gap-10 lg:gap-12">
          {/* Text block */}
          <div className="flex flex-col gap-4 max-w-[1196px]">
            <SectionTag label="About Us" />
            <div className="flex flex-col gap-6">
              <h2
                className="text-[28px] lg:text-[36px] font-semibold text-[#0d2138] leading-[1.25] lg:leading-[48px] tracking-[-0.36px] max-w-[761px]"
                style={{ fontFamily: poppins }}
              >
                At Ulrich, every home begins with a promise — a place where modern design meets lasting comfort.
              </h2>
              <div className="flex flex-col gap-6">
                <p className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px]" style={{ fontFamily: montserrat }}>
                  Built on trust and guided by integrity, Ulrich was founded to redefine how people experience real estate. We believe that a home should be more than just a property — it should reflect a lifestyle of quality, simplicity, and peace of mind. Through a thoughtful and transparent approach, our team ensures that every client finds a home that truly fits their needs and aspirations.
                </p>
                <p className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px]" style={{ fontFamily: montserrat }}>
                  Our commitment goes beyond transactions. We focus on craftsmanship, design, and service that stand the test of time — values that shape every decision we make. At Ulrich, we don't just sell homes; we create experiences built on trust, guided by professionalism, and inspired by modern living.
                </p>
              </div>
            </div>
          </div>

          {/* Images + stats */}
          <div className="flex flex-col gap-8">
            {/* two images */}
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 h-[240px] lg:h-[291px] rounded-[16px] overflow-hidden">
                <img src={aboutImg1} alt="Our story" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 h-[240px] lg:h-[291px] rounded-[12px] overflow-hidden">
                <img src={aboutImg2} alt="Our story" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* stats with dividers */}
            <div className="flex flex-col sm:flex-row">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex-1 flex flex-col gap-4 ${
                    i > 0 ? "sm:pl-10 sm:border-l sm:border-[#d1d5dc] pt-6 sm:pt-0" : "sm:pr-10"
                  }`}
                >
                  <div
                    className="text-[40px] lg:text-[44px] font-medium text-[#0d2138] leading-[1.1] lg:leading-[56px]"
                    style={{ fontFamily: poppins }}
                  >
                    {s.value}
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="text-[18px] font-semibold text-[#2b3038] leading-[26px] tracking-[-0.18px]" style={{ fontFamily: poppins }}>
                      {s.label}
                    </div>
                    <p className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px]" style={{ fontFamily: montserrat }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
