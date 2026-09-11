"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/common/PageHero";
import { ConsultationBanner } from "@/features/home/ConsultationBanner";
type FaqEntry = { id: string; categoryId: string; question: string; answer: string };
const CATEGORY_ORDER = [
  "generalInformation",
  "sales",
  "rentals",
  "propertyValuations",
  "closingsDeeds",
  "fees",
  "mortgages",
  "investments",
] as const;


export function FAQPageContent() {
 const {t}=useTranslation('faq');
 const [query,setQuery]=useState('');
 const [active,setActive]=useState('');
 const labels=t('categories',{returnObjects:true}) as Record<string,string>;
 const faqs=t('faqs',{returnObjects:true}) as FaqEntry[];
 const normalized=query.trim().toLocaleLowerCase();
 const matches=faqs.filter(f=>`${f.question} ${f.answer}`.toLocaleLowerCase().includes(normalized));
 const groups=CATEGORY_ORDER.filter(id=>(!active||active===id)&&matches.some(f=>f.categoryId===id));
 return <div className="bg-white">
  <PageHero badge={t('support')} title={t('hero.title')} subtitle={t('hero.subtitle')} />
  <div className="mx-auto max-w-[1440px] px-4 pb-20 sm:px-8 lg:px-16 lg:pb-[130px]">
   <div className="flex flex-wrap items-center justify-between gap-4 py-6 text-sm text-[#4f4f4f]">
    <p>{t('questionCount',{count:faqs.length})}</p>
    <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-[#e9e9e9] px-3 sm:w-[280px]"><img src="/listings/search.svg" width={16} height={16} alt="" /><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('hero.searchPlaceholder')} aria-label={t('hero.searchPlaceholder')} className="w-full bg-transparent text-sm outline-none" /></label>
   </div>
   <div className="grid items-start gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-[60px]">
    <aside className="lg:sticky lg:top-28">
     <nav aria-label={t('allCategories')} className="rounded-xl border border-[#e9e9e9] p-5" style={{fontFamily:'Poppins, sans-serif'}}>
      <p className="mb-3 text-[11px] uppercase tracking-wider text-[#005089]">{t('allCategories')}</p>
      <div className="flex flex-wrap gap-1 lg:flex-col">{['',...CATEGORY_ORDER].map(id=><button key={id} onClick={()=>setActive(id)} aria-pressed={active===id} className={`rounded-md px-3 py-2 text-left text-[13px] ${active===id?'bg-[#f0f6fa] text-[#005089]':'text-[#4f4f4f] hover:bg-[#fafafa]'}`}>{id?labels[id]:t('allCategories')}</button>)}</div>
     </nav>
     <div className="mt-5 rounded-xl border border-[#ccdeef] bg-[#f0f6fa] p-5"><p className="mb-4 text-sm text-[#00223a]">{t('stillQuestions')}</p><Link href="/contact" className="inline-block rounded-lg bg-[#0068b5] px-4 py-2 text-sm text-white">{t('contact')}</Link></div>
    </aside>
    <div className="min-w-0 space-y-10">
     {groups.map(id=><section key={id}>
      <h2 className="mb-5 text-xl font-medium text-[#232323]" style={{fontFamily:'Poppins, sans-serif'}}>{labels[id]}</h2>
      <div className="space-y-3">{matches.filter(f=>f.categoryId===id).map((faq)=><details key={faq.id} open={normalized?true:undefined} className="group rounded-xl border border-[#e9e9e9] bg-white">
       <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-medium text-[#232323] [&::-webkit-details-marker]:hidden" style={{fontFamily:'Poppins, sans-serif'}}>{faq.question}<img src="/listings/chevron-down.svg" width={20} height={20} alt="" className="h-5 w-5 shrink-0 rounded-full border border-[#ccdeef] p-1 transition-transform group-open:rotate-180" /></summary>
       <p className="px-5 pb-5 text-sm leading-6 text-[#4f4f4f]" style={{fontFamily:'Montserrat, sans-serif'}}>{faq.answer}</p>
      </details>)}</div>
     </section>)}
     {groups.length===0&&<p role="status" className="py-12 text-[#4f4f4f]">{t('noResults')}</p>}
     <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[#ccdeef] bg-[#f0f6fa] p-8"><p className="text-lg text-[#00223a]">{t('stillQuestions')}</p><Link href="/contact" className="rounded-lg bg-[#0068b5] px-5 py-3 text-sm text-white">{t('contact')}</Link></div>
    </div>
   </div>
  </div>
  <ConsultationBanner />
 </div>;
}
