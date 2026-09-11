"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./ContactPage.module.css";
import { ConsultationBanner } from "@/features/home/ConsultationBanner";
import { FAQ } from "@/features/home/FAQ";
import { PropertyLocationMap } from "@/components/maps/PropertyLocationMap";

const address = "Las Amapolas 455, Manuel Alberti, Buenos Aires, Argentina";
const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
const cards = [
 {icon:"phone",title:"Phone",value:"+54 9 11 8030 6000",description:"Mon – Fri, 9:00 AM – 7:00 PM",action:"Call us",href:"tel:+5491180306000"},
 {icon:"whatsapp",title:"WhatsApp",value:"+54 9 11 8030 6000",description:"Quick replies, usually within minutes",action:"Fast reply",href:"https://wa.me/5491180306000"},
 {icon:"email",title:"Email",value:"hola@mobiprop.com.ar",description:"Available 24/7 — we reply within 24h",action:"24/7",href:"mailto:hola@mobiprop.com.ar"},
 {icon:"location",title:"Office",value:"Las Amapolas 455, Manuel Alberti",description:"Buenos Aires, Argentina · Open Mon–Fri",action:"",href:directions},
];
const inputClass = styles.field;

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
 return <div className={styles.page}>
  <section className={styles.hero}>
   <div className={styles.backdrop} aria-hidden="true">
    <img className={styles.heroImage} src="/listings/hero.jpg" alt="" />
    <div className={styles.heroScreen}/>
    <img className={styles.heroBlur} src="/pages/contact-hero-blur.svg" alt="" />
   </div>
   <div className={styles.heroContent}>
    <span className={styles.eyebrow}>Get in touch</span>
    <h1>Let&apos;s Find Your<br/>Perfect Property</h1>
    <p>Our expert agents are ready to guide you through every step of your real estate journey, buying, selling, or renting.</p>
   </div>
  </section>
  <div className={styles.container}>
   <div className={styles.cards}>
    {cards.map(card=><a key={card.title} href={card.href} className={styles.card}>
     <span className={styles.icon}><img src={`/pages/contact-${card.icon}.svg`} alt="" width={28} height={28}/></span>
     <span className={styles.cardText}>
      <span className={styles.cardTitle}>{card.title}</span>
      <span className={styles.cardValue}>{card.value}</span>
      <span className={styles.cardDescription}>{card.description}</span>
     </span>
     {card.action && <span className={styles.badge}>{card.action}</span>}
    </a>)}
   </div>
   <form id="contact-form" onSubmit={submit} className={styles.form}>
    <div className={styles.formHeading}>
     <h2>Send a Message</h2>
     <p>We&apos;ll get back to you within 24 hours</p>
    </div>
    <div className={styles.fields}>
     <label><span className="sr-only">Full Name</span><input className={inputClass} name="name" autoComplete="name" placeholder="Full Name*" required minLength={2} maxLength={150}/></label>
     <label><span className="sr-only">Email Address</span><input className={inputClass} name="email" type="email" autoComplete="email" placeholder="Email Address*" required maxLength={254}/></label>
     <label><span className="sr-only">Phone Number</span><input className={inputClass} name="phone" type="tel" autoComplete="tel" placeholder="Phone Number*" maxLength={50} required/></label>
     <label><span className="sr-only">Service Interested In</span><select className={`${inputClass} ${styles.select}`} name="service" defaultValue=""><option value="" disabled>Service Interested In</option><option>Buying a Property</option><option>Selling a Property</option><option>Renting a Property</option><option>Property Valuation</option><option>Other</option></select></label>
     <label className={styles.message}><span className="sr-only">Your Message</span><textarea className={inputClass} name="message" placeholder="Your Message" required minLength={10} maxLength={5000}/></label>
    </div>
    <div hidden aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <div className={styles.formActions}>
     <label className={styles.consent}><input type="checkbox" name="consent" required/><span>I accept the <Link href="/terms-conditions">term and conditions</Link></span></label>
     <button disabled={status==="sending"} className={styles.submit}>{status==="sending"?"Sending…":"Send Message"}</button>
    </div>
    <p role="status" className={styles.status}>{status==="sent"?"Thank you. Your message has been received.":status==="error"?"We couldn’t send your message. Please try again or contact us by WhatsApp.":""}</p>
   </form>
   <section className={styles.location}>
    <div className={styles.locationHeading}>
     <div className={styles.locationLabel}>Location</div>
     <h2>Let’s Talk About your Needs</h2>
     <p>Whether you&apos;re ready to buy, sell, or have questions about the market, Mobi Prop is here to guide you.</p>
    </div>
    <div className={styles.map}>
     <PropertyLocationMap address={address} title="Mobi Prop" />
     <div className={styles.mapCard}>
      <h3>Mobi Prop</h3>
      <div className={styles.mapActions}>
       <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" aria-label="Open office in Google Maps"><img src="/pages/contact-map-open.svg" alt="" width={16} height={16}/></a>
       <a href={directions} target="_blank" rel="noopener noreferrer" aria-label="Get directions to our office"><img src="/pages/contact-map-directions.svg" alt="" width={16} height={16}/></a>
      </div>
      <p>Las Amapolas 455, Manuel Alberti<br/>Buenos Aires, Argentina</p>
      <a className={styles.directions} href={directions} target="_blank" rel="noopener noreferrer">Get Directions</a>
     </div>
    </div>
   </section>
  </div>
  <FAQ className={styles.faq} iconAssets={{open:"/pages/contact-faq-open.svg",closed:"/pages/contact-faq-closed.svg"}} contactHref="#contact-form"/>
  <div className={styles.cta}><ConsultationBanner contactHref="#contact-form" /></div>
 </div>;
}
