"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { PageBackdrop } from "@/components/common/PageHero";
import styles from "./ContactPage.module.css";
import { ConsultationBanner } from "@/features/home/ConsultationBanner";
import { FAQ } from "@/features/home/FAQ";
import { PropertyLocationMap } from "@/components/maps/PropertyLocationMap";

const address = "Las Amapolas 455, Manuel Alberti, Buenos Aires, Argentina";
const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
const cards = [
 {icon:"phone",title:"Teléfono",value:"+54 9 11 8030 6000",description:"Lun. a vie., de 9:00 a 19:00",action:"Llamanos",href:"tel:+5491180306000"},
 {icon:"whatsapp",title:"WhatsApp",value:"+54 9 11 8030 6000",description:"Respuestas rápidas, generalmente en minutos",action:"Respuesta rápida",href:"https://wa.me/5491180306000"},
 {icon:"email",title:"Correo electrónico",value:"hola@mobiprop.com.ar",description:"Escribinos las 24 horas; respondemos dentro de las 24 h",action:"24/7",href:"mailto:hola@mobiprop.com.ar"},
 {icon:"location",title:"Oficina",value:"Las Amapolas 455",description:"Buenos Aires, Argentina · Lun. a vie.",action:"",href:directions},
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
   <PageBackdrop />
   <div className={styles.heroContent}>
    <span className={styles.eyebrow}>Contactanos</span>
    <h1>Encontremos tu<br/>propiedad ideal</h1>
    <p>Nuestros agentes te acompañan en cada paso para comprar, vender o alquilar tu propiedad.</p>
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
     <h2>Envianos un mensaje</h2>
     <p>Te responderemos dentro de las 24 horas</p>
    </div>
    <div className={styles.fields}>
     <label><span className="sr-only">Nombre completo</span><input className={inputClass} name="name" autoComplete="name" placeholder="Nombre completo*" required minLength={2} maxLength={150}/></label>
     <label><span className="sr-only">Correo electrónico</span><input className={inputClass} name="email" type="email" autoComplete="email" placeholder="Correo electrónico*" required maxLength={254}/></label>
     <label><span className="sr-only">Teléfono</span><input className={inputClass} name="phone" type="tel" autoComplete="tel" placeholder="Teléfono*" maxLength={50} required/></label>
     <label><span className="sr-only">¿Qué servicio te interesa?</span><select className={`${inputClass} ${styles.select}`} name="service" defaultValue=""><option value="" disabled>¿Qué servicio te interesa?</option><option>Comprar una propiedad</option><option>Vender una propiedad</option><option>Alquilar una propiedad</option><option>Tasación de una propiedad</option><option>Otro</option></select></label>
     <label className={styles.message}><span className="sr-only">Tu mensaje</span><textarea className={inputClass} name="message" placeholder="Tu mensaje" required minLength={10} maxLength={5000}/></label>
    </div>
    <div hidden aria-hidden="true"><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <div className={styles.formActions}>
     <label className={styles.consent}><input type="checkbox" name="consent" required/><span>Acepto los <Link href="/terms-conditions">términos y condiciones</Link></span></label>
     <button disabled={status==="sending"} className={styles.submit}>{status==="sending"?"Enviando…":"Enviar mensaje"}</button>
    </div>
    <p role="status" className={styles.status}>{status==="sent"?"Gracias. Recibimos tu mensaje.":status==="error"?"No pudimos enviar tu mensaje. Volvé a intentar o escribinos por WhatsApp.":""}</p>
   </form>
   <section className={styles.location}>
    <div className={styles.locationHeading}>
     <div className={styles.locationLabel}>Ubicación</div>
     <h2>Hablemos de lo que necesitás</h2>
     <p>Si querés comprar, vender o consultar sobre el mercado, Mobi Prop está para acompañarte.</p>
    </div>
    <div className={styles.map}>
     <PropertyLocationMap address={address} title="Mobi Prop" />
     <div className={styles.mapCard}>
      <h3>Mobi Prop</h3>
      <div className={styles.mapActions}>
       <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" aria-label="Ver la oficina en Google Maps"><img src="/pages/contact-map-open.svg" alt="" width={16} height={16}/></a>
       <a href={directions} target="_blank" rel="noopener noreferrer" aria-label="Cómo llegar a nuestra oficina"><img src="/pages/contact-map-directions.svg" alt="" width={16} height={16}/></a>
      </div>
      <p>Las Amapolas 455<br/>Buenos Aires, Argentina</p>
      <a className={styles.directions} href={directions} target="_blank" rel="noopener noreferrer">Cómo llegar</a>
     </div>
    </div>
   </section>
  </div>
  <FAQ className={styles.faq} iconAssets={{open:"/pages/contact-faq-open.svg",closed:"/pages/contact-faq-closed.svg"}} contactHref="#contact-form"/>
  <div className={styles.cta}><ConsultationBanner contactHref="#contact-form" /></div>
 </div>;
}
