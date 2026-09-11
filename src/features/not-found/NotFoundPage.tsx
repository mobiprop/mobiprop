"use client";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
  const { t } = useTranslation("common");
  return <section className="flex min-h-[calc(100svh-80px)] items-center justify-center bg-white px-6 py-16" style={{fontFamily:"Poppins, sans-serif"}}>
    <div className="flex w-full max-w-[700px] flex-col items-center gap-[30px] text-center">
      <div aria-hidden="true" className="relative flex h-[200px] items-center justify-center">
        <span className="text-[160px] font-semibold leading-[200px] text-[#005ea4]/[0.12] sm:text-[200px]">404</span>
        <img src="/pages/not-found-house.svg" alt="" width={160} height={160} className="absolute h-40 w-40" />
      </div>
      <div className="flex flex-col items-center gap-4">
        <span className="rounded-full border border-[#ccdeef] bg-[#f0f6fa] px-3 py-1.5 text-xs font-medium uppercase tracking-[1px] text-[#191919]">{t("notFound.eyebrow")}</span>
        <h1 className="max-w-[650px] text-[34px] font-medium leading-[1.2] tracking-[-1.5px] text-[#101010] sm:text-[52px]">{t("notFound.title")}</h1>
        <p className="text-base leading-[27px] text-[#4f4f4f] sm:text-lg" style={{fontFamily:"Montserrat, sans-serif"}}>{t("notFound.description")}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/" className="rounded-xl bg-gradient-to-br from-[#005ea4] to-[#006fc2] px-6 py-3.5 text-base font-medium text-white">{t("notFound.backHome")}</Link>
        <Link href="/contact" className="rounded-xl border border-[#005089] px-6 py-3.5 text-base font-medium text-[#005089]">{t("notFound.contactSupport")}</Link>
      </div>
    </div>
  </section>;
}
