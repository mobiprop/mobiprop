"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export function LegalLayout({updated, sections, children}: {updated:string;sections:{id:string;label:string}[];children:ReactNode}) {
 const {t}=useTranslation('common');
 return <div className="bg-white px-4 pb-24 sm:px-8 lg:px-16 lg:pb-[150px]">
  <div className="mx-auto max-w-[1312px]">
   <div className="flex flex-wrap justify-between gap-4 py-[14px] mb-[50px] text-sm text-[#4f4f4f]" style={{fontFamily:'Montserrat, sans-serif'}}><p>{updated}</p><nav className="flex flex-wrap gap-x-5 gap-y-2"><Link href="/privacy-policy">{t('legal.privacy')}</Link><Link href="/terms-conditions">{t('legal.terms')}</Link><Link href="/faq">Preguntas frecuentes</Link></nav></div>
   <div className="grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-[60px]">
    <aside className="lg:sticky lg:top-28">
     <nav aria-label={t('legal.contents')} className="rounded-2xl border border-[#e9e9e9] p-6 text-sm" style={{fontFamily:'Montserrat, sans-serif'}}>
      <p className="mb-3 text-[11px] uppercase tracking-wider text-[#005089]">{t('legal.contents')}</p>
      <div className="flex flex-wrap gap-1 lg:flex-col">{sections.map(s=><a key={s.id} href={`#${s.id}`} className="rounded-md px-3 py-2 text-[#4f4f4f] hover:bg-[#f0f6fa] hover:text-[#005089] focus-visible:outline-2 focus-visible:outline-[#005089]">{s.label}</a>)}</div>
     </nav>

    </aside>
    <div className="min-w-0 text-[#4f4f4f] [&_h2]:scroll-mt-28 [&_h3]:scroll-mt-28 [&_h2]:text-[24px] [&_h2]:font-medium [&_h2]:leading-[39px] [&_h3]:text-[24px] [&_h3]:font-medium [&_p]:leading-7">{children}</div>
   </div>
  </div>
 </div>;
}
