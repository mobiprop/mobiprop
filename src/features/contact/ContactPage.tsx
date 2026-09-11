"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { PageHero } from "@/components/common/PageHero";
import { ConsultationBanner } from "@/features/home/ConsultationBanner";
import { FAQ } from "@/features/home/FAQ";
import { PropertyLocationMap } from "@/components/maps/PropertyLocationMap";

const address = "Las Amapolas 455, Manuel Alberti, Buenos Aires, Argentina";
const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
const cards = [
 {icon:"phone",title:"Phone",value:"+54 9 11 8030 6000",description:"Mon – Fri, 9:00 AM – 7:00 PM",action:"Call us",href:"tel:+5491180306000"},
 {icon:"whatsapp",title:"WhatsApp",value:"+54 9 11 8030 6000",description:"Quick replies, usually within minutes",action:"Fast reply",href:"https://wa.me/5491180306000"},
 {icon:"email",title:"Email",value:"hola@mobiprop.com.ar",description:"Available 24/7 — we reply within 24h",action:"24/7",href:"mailto:hola@mobiprop.com.ar"},
 {icon:"location",title:"Office",value:"Las Amapolas 455, Manuel Alberti",description:"Buenos Aires, Argentina · Open Mon–Fri",action:"Location",href:directions},
];
const inputClass="h-[58px] w-full rounded-[14px] border border-[#e9e9e9] bg-[#f0f6fa] px-5 text-base outline-none focus:border-[#005089] focus:ring-1 focus:ring-[#005089]";

export function ContactPageContent() {
 const [status,setStatus]=useState<"idle"|"sending"|"sent"|"error">("idle");
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if(status==="sending") return;
  const form=event.currentTarget, values=new FormData(form);
  setStatus("sending");
  try {
   const response=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...Object.fromEntries(values),consent:values.get("consent")==="on"})});
   if(!response.ok) throw new Error("Submission failed");
   form.reset();setStatus("sent");
  } catch {setStatus("error");}
 }
 return <>
  <PageHero badge="Get in touch" title={<>Let’s Find Your<br/>Perfect Property</>} subtitle="Our expert agents are ready to guide you through every step of your real estate journey, buying, selling, or renting." />
  <div className="mx-auto max-w-[1440px] px-5 pb-20 sm:px-8 lg:px-16 lg:pb-[140px]" style={{fontFamily:"Montserrat, sans-serif"}}>
   <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
    {cards.map(card=><a key={card.title} href={card.href} className="flex min-h-[284px] flex-col items-center rounded-2xl border border-[#e9e9e9] p-6 pt-10 text-center transition-colors hover:border-[#005089]">
     <span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-[#f0f6fa]"><img src={`/pages/contact-${card.icon}.svg`} alt="" width={28} height={28}/></span>
     <span className="mb-2 text-sm font-medium uppercase tracking-wider text-[#005089]">{card.title}</span>
     <span className="text-base font-medium leading-6 text-[#232323]">{card.value}</span>
     <span className="mt-2 text-sm leading-5 text-[#6c6c6c]">{card.description}</span>
     <span className="mt-4 rounded-full bg-[#f0f6fa] px-3 py-1 text-xs text-[#005089]">{card.action}</span>
    </a>)}
   </div>
   <form onSubmit={submit} className="mt-[80px]">
    <h2 className="mb-3 text-2xl font-medium text-[#232323]" style={{fontFamily:"Poppins, sans-serif"}}>Send a Message</h2>
    <p className="mb-8 text-sm text-[#4f4f4f]">We’ll get back to you within 24 hours</p>
    <div className="grid gap-5 sm:grid-cols-2">
     <label><span className="sr-only">Full Name</span><input className={inputClass} name="name" autoComplete="name" placeholder="Full Name*" required minLength={2} maxLength={150}/></label>
     <label><span className="sr-only">Email Address</span><input className={inputClass} name="email" type="email" autoComplete="email" placeholder="Email Address*" required maxLength={254}/></label>
     <label><span className="sr-only">Phone Number</span><input className={inputClass} name="phone" type="tel" autoComplete="tel" placeholder="Phone Number*" maxLength={50} required/></label>
     <label><span className="sr-only">Service Interested In</span><select className={inputClass} name="service" defaultValue=""><option value="" disabled>Service Interested In</option><option>Buying a Property</option><option>Selling a Property</option><option>Renting a Property</option><option>Property Valuation</option><option>Other</option></select></label>
     <label className="sm:col-span-2"><span className="sr-only">Your Message</span><textarea className={`${inputClass} min-h-[154px] py-4`} name="message" placeholder="Your Message" required minLength={10} maxLength={5000}/></label>
    </div>
    <div hidden aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-6">
     <label className="flex items-start gap-3 text-sm leading-6 text-[#6c6c6c]"><input type="checkbox" name="consent" required className="mt-1 size-4 accent-[#005089]"/><span>I accept the <Link href="/terms-conditions" className="text-[#005089] underline">term and conditions</Link></span></label>
     <button disabled={status==="sending"} className="h-12 rounded-xl bg-gradient-to-br from-[#005ea4] to-[#006fc2] px-7 text-base font-medium text-white disabled:opacity-60">{status==="sending"?"Sending…":"Send Message"}</button>
    </div>
    <p role="status" className="mt-4 text-sm">{status==="sent"?"Thank you. Your message has been received.":status==="error"?"We couldn’t send your message. Please try again or contact us by WhatsApp.":""}</p>
   </form>
   <section className="mt-24 lg:mt-[140px]">
    <div className="mx-auto mb-[50px] max-w-[866px] text-center"><h2 className="text-[32px] font-medium leading-[1.2] tracking-[-1px] text-[#232323] lg:text-[44px]" style={{fontFamily:"Poppins, sans-serif"}}>Let’s Talk About your Needs</h2><p className="mt-5 text-lg leading-[27px] text-[#4f4f4f]">Whether you&apos;re ready to buy, sell, or have questions about the market, Mobi Prop is here to guide you.</p></div>
    <div className="h-[360px] overflow-hidden rounded-2xl border border-[#e9e9e9] lg:h-[569px]"><PropertyLocationMap address={address} title="Mobi Prop" /></div>
    <a href={directions} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-[#005089] underline">Get Directions</a>
   </section>
  </div>
  <FAQ/><ConsultationBanner/>
 </>;
}
