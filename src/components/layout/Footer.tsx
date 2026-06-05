import Link from "next/link";
import svgPaths from "@/assets/svg-6s7nojygyu";

const footerBg = "/assets/figma-temp/HomePageFinal/image-bg.png";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Listing", href: "/listings" },
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms-conditions" },
];

function MailIcon() {
  return (
    <svg width="16" height="14" viewBox="0 0 14.3334 11.6667" fill="none" className="shrink-0">
      <path d={svgPaths.p3d448680} stroke="white" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14.38 14.4401" fill="none" className="shrink-0">
      <path d={svgPaths.p3a452d00} stroke="white" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 11.6667 14.3333" fill="none" className="shrink-0 mt-[3px]">
      <path d={svgPaths.p1fff3000} stroke="#EDF5F8" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p1a179d80} stroke="#EDF5F8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Section heading with bottom border — exactly as Figma: pb-[8px] pt-[4px] px-[4px] */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-[rgba(255,255,255,0.2)] pb-[8px] pt-[4px] px-[4px] w-full">
      <p
        className="text-[18px] font-medium text-white leading-[26px] tracking-[-0.18px] whitespace-nowrap"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {children}
      </p>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative bg-[#0d2138] overflow-hidden">
      {/* Background building image — extends above footer per Figma (top:-113px, h:902px) */}
      <div className="absolute inset-x-0 top-[-113px] h-[902px] pointer-events-none">
  <img
    src={footerBg}
    alt=""
    className="w-full h-full object-contain object-top opacity-100"
  />
</div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-[76px] pt-[92px] pb-[40px]">
        {/* Top content row — bordered at bottom */}
        <div className="flex flex-col lg:flex-row lg:gap-[80px] xl:gap-[120px] pb-[56px] border-b border-[rgba(255,255,255,0.16)]">

          {/* ── Newsletter ── */}
          <div className="shrink-0 lg:w-[460px] mb-10 lg:mb-0">
            <p
              className="text-[28px] font-medium text-white leading-[36px] tracking-[-0.28px] mb-6 max-w-[412px]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              From concept sketches to final execution.
            </p>
            <div className="flex flex-col gap-[10px]">
              {/* "Subscribe our news letter" — full white, no opacity per Figma */}
              <p
                className="text-[16px] text-white leading-[24px] tracking-[-0.16px]"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Subscribe our news letter
              </p>
              {/* Email input — h-[56px] per Figma */}
              <div className="relative bg-[#f5f7fa] h-[56px] rounded-[100px] w-full">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="absolute inset-0 bg-transparent pl-6 pr-[140px] text-[16px] text-[#717784] outline-none rounded-[100px] tracking-[-0.16px]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                />
                {/* Subscribe button — w-[131px] with ring shadow per Figma */}
                <button
                  className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[44px] w-[131px] rounded-[100px] text-[16px] font-medium text-white flex items-center justify-center"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    background: "linear-gradient(to bottom, #005ea4, #006fc2)",
                    border: "1.011px solid #0088ff",
                    boxShadow: "0px 0px 0px 4px #e0e9f2",
                  }}
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: Navigation + Office ── */}
          <div className="flex flex-col sm:flex-row gap-12 lg:gap-[85px] flex-1 lg:justify-end">

            {/* Navigation */}
            <div className="flex flex-col gap-[24px] lg:w-[221px]">
              <SectionHeading>Navigation</SectionHeading>
              <div
                className="flex flex-col gap-[16px] opacity-80"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                {navLinks.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="text-[16px] text-white leading-[24px] tracking-[-0.16px] hover:opacity-100 transition-opacity whitespace-nowrap"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Visit Our Office — two sub-sections per Figma (both titled "Visit Our Office") */}
            <div className="flex flex-col gap-[28px] lg:w-[234px]">
              {/* Sub-section 1: Address */}
              <div className="flex flex-col gap-[24px]">
                <SectionHeading>Visit Our Office</SectionHeading>
                <div className="flex gap-[12px] items-start opacity-80">
                  <LocationIcon />
                  <p
                    className="text-[16px] text-white leading-[24px] tracking-[-0.16px]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    4517 Washington Ave. Manchester,
                    <br />
                    Kentucky 39495
                  </p>
                </div>
              </div>

              {/* Sub-section 2: Email + Phone */}
              <div className="flex flex-col gap-[24px]">
                <SectionHeading>Visit Our Office</SectionHeading>
                <div className="flex flex-col gap-[12px] opacity-80">
                  <div className="flex gap-[12px] items-center">
                    <MailIcon />
                    <p
                      className="text-[16px] text-white leading-[24px] tracking-[-0.16px]"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      contact@ulrichpropiedades.com
                    </p>
                  </div>
                  <div className="flex gap-[12px] items-center">
                    <PhoneIcon />
                    <p
                      className="text-[16px] text-white leading-[24px] tracking-[-0.16px]"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      (239) 555-0108
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright — plain white, no opacity per Figma */}
        <div className="pt-6">
          <p
            className="text-[16px] text-white leading-[24px] tracking-[-0.16px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Ulrich Propiedades © 2026. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
