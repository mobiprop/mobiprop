"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function SiteMapPage() {
  const { t } = useTranslation(["navigation", "footer"]);
  const links = [
    ["home", "/"], ["listings", "/listings"], ["about", "/about"],
    ["blog", "/blog"], ["contact", "/contact"], ["faq", "/faq"],
    ["privacyPolicy", "/privacy-policy"], ["termsConditions", "/terms-conditions"],
  ];
  return <section className="about-container py-20">
    <h1 className="home-section-title">{t("links.sitemap", { ns: "footer" })}</h1>
    <nav aria-label={t("links.sitemap", { ns: "footer" })} className="mt-10 grid gap-5 sm:grid-cols-2">
      {links.map(([label, href]) => <Link key={href} href={href} className="text-lg text-[#005089] underline underline-offset-4">{t(label)}</Link>)}
    </nav>
  </section>;
}
