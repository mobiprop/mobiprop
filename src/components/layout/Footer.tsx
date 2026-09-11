"use client";

import Image from "next/image";
import { Phone } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const footerBg = "/hero/cta-footer-bg.webp";

const socialLinks = [
  {
    name: "Instagram",
    href: "https://instagram.com/mobiprop",
    path: "M12.75 1.5H5.25C3.17893 1.5 1.5 3.17893 1.5 5.25V12.75C1.5 14.8211 3.17893 16.5 5.25 16.5H12.75C14.8211 16.5 16.5 14.8211 16.5 12.75V5.25C16.5 3.17893 14.8211 1.5 12.75 1.5Z M9 12C10.6569 12 12 10.6569 12 9C12 7.34315 10.6569 6 9 6C7.34315 6 6 7.34315 6 9C6 10.6569 7.34315 12 9 12Z",
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/mobiprop",
    path: "M13.5 1.5H11.25C10.2554 1.5 9.30161 1.89509 8.59835 2.59835C7.89509 3.30161 7.5 4.25544 7.5 5.25V7.5H5.25V10.5H7.5V16.5H10.5V10.5H12.75L13.5 7.5H10.5V5.25C10.5 5.05109 10.579 4.86032 10.7197 4.71967C10.8603 4.57902 11.0511 4.5 11.25 4.5H13.5V1.5Z",
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/mobiprop",
    path: "M12 6C13.1935 6 14.3381 6.47411 15.182 7.31802C16.0259 8.16193 16.5 9.30653 16.5 10.5V15.75H13.5V10.5C13.5 10.1022 13.342 9.72064 13.0607 9.43934C12.7794 9.15804 12.3978 9 12 9C11.6022 9 11.2206 9.15804 10.9393 9.43934C10.658 9.72064 10.5 10.1022 10.5 10.5V15.75H7.5V10.5C7.5 9.30653 7.97411 8.16193 8.81802 7.31802C9.66193 6.47411 10.8065 6 12 6Z M4.5 6.75H1.5V15.75H4.5V6.75Z",
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/5491180306000",
    path: "M15.75 8.625C15.7526 9.6149 15.5213 10.5914 15.075 11.475C14.5458 12.5338 13.7323 13.4244 12.7256 14.047C11.7189 14.6695 10.5587 14.9995 9.375 15C8.3851 15.0026 7.40859 14.7713 6.525 14.325L2.25 15.75L3.675 11.475C3.2287 10.5914 2.99742 9.6149 3 8.625C3.00046 7.44132 3.33046 6.28114 3.95304 5.27441C4.57562 4.26769 5.46619 3.45418 6.525 2.925C7.40859 2.4787 8.3851 2.24742 9.375 2.25H9.75C11.3133 2.33624 12.7898 2.99607 13.8969 4.10314C15.0039 5.21022 15.6638 6.68674 15.75 8.25V8.625Z",
  },
];

function SocialIcon({ path }: { path: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d={path} stroke="#F0F6FA" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path
        d="M12.25 5.83301C12.25 9.91634 7 13.4163 7 13.4163C7 13.4163 1.75 9.91634 1.75 5.83301C1.75 4.44062 2.30312 3.10526 3.28769 2.1207C4.27226 1.13613 5.60761 0.583008 7 0.583008C8.39239 0.583008 9.72774 1.13613 10.7123 2.1207C11.6969 3.10526 12.25 4.44062 12.25 5.83301Z M7 7.58301C7.9665 7.58301 8.75 6.79951 8.75 5.83301C8.75 4.86651 7.9665 4.08301 7 4.08301C6.0335 4.08301 5.25 4.86651 5.25 5.83301C5.25 6.79951 6.0335 7.58301 7 7.58301Z"
        stroke="#F0F6FA"
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return <Phone size={16} strokeWidth={1.5} className="shrink-0 text-[#f0f6fa]" aria-hidden="true" />;
}

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path
        d="M11.667 2.33301H2.33366C1.68933 2.33301 1.16699 2.85534 1.16699 3.49967V10.4997C1.16699 11.144 1.68933 11.6663 2.33366 11.6663H11.667C12.3113 11.6663 12.8337 11.144 12.8337 10.4997V3.49967C12.8337 2.85534 12.3113 2.33301 11.667 2.33301Z M1.16699 2.33301L7.00033 7.58301L12.8337 2.33301"
        stroke="#F0F6FA"
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-[16px] text-white capitalize" style={{ fontFamily: "Montserrat, sans-serif" }}>
          {heading}
        </p>
        <div className="h-0.5 w-6 rounded-full bg-[#5c93b2]" />
      </div>
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-[16px] text-[#e4e4e4] hover:text-white transition-colors leading-6"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Footer() {
  const { t } = useTranslation(["footer", "navigation"]);

  const columns = [
    {
      heading: t("columns.company.heading", { ns: "footer" }),
      links: [
        { label: t("home", { ns: "navigation" }), href: "/" },
        { label: t("about", { ns: "navigation" }), href: "/about" },
        { label: t("blog", { ns: "navigation" }), href: "/blog" },
      ],
    },
    {
      heading: t("columns.explore.heading", { ns: "footer" }),
      links: [
        { label: t("listings", { ns: "navigation" }), href: "/listings" },
        { label: t("links.rentals", { ns: "footer" }), href: "/listings?transactionType=RENT" },
      ],
    },
    {
      heading: t("columns.support.heading", { ns: "footer" }),
      links: [
        { label: t("links.helpCenter"), href: "/faq" },
        { label: t("links.contactUs"), href: "/contact" },
        { label: t("faq", { ns: "navigation" }), href: "/faq" },
      ],
    },
    {
      heading: t("columns.legal.heading", { ns: "footer" }),
      links: [
        { label: t("privacyPolicy", { ns: "navigation" }), href: "/privacy-policy" },
        { label: t("links.termsOfService"), href: "/terms-conditions" },
        { label: t("links.cookiePolicy"), href: "/privacy-policy#legal-section-8" },
      ],
    },
  ];

  return (
    <footer className="relative bg-[#001a2c] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
        <img src={footerBg} alt="" className="h-full w-full object-cover" />
      </div>

      <div className="site-footer-container relative z-10 mx-auto flex flex-col gap-[42px] pt-16 pb-8">
        <div className="grid gap-12 xl:grid-cols-[405px_minmax(0,1fr)] xl:gap-12 min-[1440px]:gap-[214px]">
          <div className="flex flex-col gap-7 w-full lg:max-w-[405px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <Image src="/mobi-prop-logo-white.svg" alt="" width={30} height={30} className="h-[30px] w-[30px]" />
                <p className="text-[24px] leading-none text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
                  <span className="font-medium">Mobi</span> <span className="font-light">Prop</span>
                </p>
              </div>
              <p className="text-[16px] text-[#e4e4e4] leading-6" style={{ fontFamily: "Montserrat, sans-serif" }}>
                {t("description", { ns: "footer" })}
              </p>
            </div>

            <div className="-mt-1 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={social.name}
                  aria-label={social.name}
                  className="flex size-[38px] items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.06] transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {social.name === "WhatsApp" ? <span aria-hidden="true" className="size-[18px] bg-[#f0f6fa]" style={{ mask: "url(/icons/brand-whatsapp.svg) center / contain no-repeat", WebkitMask: "url(/icons/brand-whatsapp.svg) center / contain no-repeat" }} /> : social.name === "LinkedIn" ? <span aria-hidden="true" className="size-[18px] bg-[#f0f6fa]" style={{ mask: "url(/icons/brand-linkedin.svg) center / contain no-repeat", WebkitMask: "url(/icons/brand-linkedin.svg) center / contain no-repeat" }} /> : <SocialIcon path={social.path} />}
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="flex items-start gap-3">
                <span className="mt-1">
                  <LocationIcon />
                </span>
                <a href="https://www.google.com/maps/search/?api=1&query=Las+Amapolas+455+Manuel+Alberti+Argentina" className="text-[16px] text-[#e4e4e4]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {t("address", { ns: "footer" })}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <PhoneIcon />
                <a href="tel:+5491180306000" className="text-[16px] text-[#e4e4e4]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {t("phone", { ns: "footer" })}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <MailIcon />
                <a href="mailto:hola@mobiprop.com.ar" className="text-[16px] text-[#e4e4e4]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {t("email", { ns: "footer" })}
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 min-[1440px]:grid-cols-[81px_76px_102px_128px] min-[1440px]:gap-[102px]">
            {columns.map((col) => (
              <FooterColumn key={col.heading} heading={col.heading} links={col.links} />
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[14px] sm:text-[16px] text-[#b2b2b2] text-center sm:text-left" style={{ fontFamily: "Montserrat, sans-serif" }}>
            {t("copyright", { ns: "footer" })}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-y-2 [&>a]:px-5 [&>a+a]:border-l [&>a+a]:border-[#9a9a9a] [&>a:first-child]:pl-0 [&>a:last-child]:pr-0">
            <Link href="/privacy-policy" className="text-[14px] sm:text-[16px] text-[#b2b2b2] hover:text-white transition-colors" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {t("privacyPolicy", { ns: "navigation" })}
            </Link>
            <Link href="/terms-conditions" className="text-[14px] sm:text-[16px] text-[#b2b2b2] hover:text-white transition-colors" style={{ fontFamily: "Montserrat, sans-serif" }}>
              {t("links.termsOfService")}
            </Link>
            <Link href="/privacy-policy#legal-section-8" className="text-[14px] sm:text-[16px] text-[#b2b2b2] hover:text-white">{t("links.cookiePolicy")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
