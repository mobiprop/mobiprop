"use client";

import { BrandedNotification, type BrandedNotificationProps } from "@/components/common/BrandedNotification";
import { contactSchema } from "./contact-schema";
import { CustomSelect } from "@/components/ui/CustomSelect";
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
 {icon:"phone",title:"Teléfono",value:"+54 9 11 8030 6000",description:"Lunes a Viernes de 9:00 a 19:00",action:"Llamanos",href:"tel:+5491180306000"},
 {icon:"whatsapp",title:"WhatsApp",value:"+54 9 11 8030 6000",description:"Respuestas rápidas, generalmente en minutos",action:"Respuesta rápida",href:"https://wa.me/5491180306000"},
 {icon:"email",title:"Correo electrónico",value:"hola@mobiprop.com.ar",description:"Respondemos dentro de las 24hs",action:"24/7",href:"mailto:hola@mobiprop.com.ar"},
 {icon:"location",title:"Oficina",value:"Las Amapolas 455",description:"Buenos Aires, Argentina",action:"",href:directions},
];
const inputClass = styles.field;

export function ContactPageContent() {
 const [status,setStatus]=useState<"idle"|"sending">("idle");
 const [notification,setNotification]=useState<BrandedNotificationProps|null>(null);
 const [invalidField,setInvalidField]=useState<string|null>(null);
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();
  if(status==="sending") return;
  const form=event.currentTarget, values=new FormData(form);
  const parsed=contactSchema.safeParse({...Object.fromEntries(values),consent:values.get("consent")==="on"});
  if(!parsed.success) {
   const issue=parsed.error.issues[0], field=String(issue.path[0]);
   setInvalidField(field);
   setNotification({type:"error",title:"Revisá tu consulta",message:issue.message});
   const control=form.elements.namedItem(field);
   if(control instanceof HTMLElement) control.focus();
   return;
  }
  setInvalidField(null);setNotification(null);setStatus("sending");
  try {
   const response=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(parsed.data)});
   if(!response.ok) {
    const message=response.status===429?"Ya recibimos varias consultas tuyas. Esperá unos minutos antes de enviar otra.":response.status===400?"Revisá los datos de la consulta e intentá nuevamente.":"No pudimos guardar tu consulta. Intentá nuevamente o escribinos por WhatsApp.";
    setNotification({type:"error",title:"No se pudo enviar la consulta",message});
    return;
   }
   form.reset();
   setNotification({type:"success",title:"Recibimos tu consulta",message:"Gracias por contactarnos. Te responderemos dentro de las 24 horas."});
  } catch {
   setNotification({type:"error",title:"No se pudo conectar",message:"Revisá tu conexión e intentá nuevamente. Tus datos siguen en el formulario."});
  } finally {setStatus("idle");}
 }
 return <div className={styles.page}>
  {notification && <BrandedNotification {...notification} onClose={()=>setNotification(null)}/>}
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
   <form id="contact-form" noValidate onSubmit={submit} onInput={()=>setInvalidField(null)} className={styles.form}>
    <div className={styles.formHeading}>
     <h2>Envianos un mensaje</h2>
     <p>Te responderemos dentro de las 24 horas</p>
    </div>
    <div className={styles.fields}>
     <label><span className="sr-only">Nombre completo</span><input className={inputClass} name="name" aria-invalid={invalidField==="name" || undefined} autoComplete="name" placeholder="Nombre completo*" required minLength={2} maxLength={150}/></label>
     <label><span className="sr-only">Correo electrónico</span><input className={inputClass} name="email" aria-invalid={invalidField==="email" || undefined} type="email" autoComplete="email" placeholder="Correo electrónico*" required maxLength={254}/></label>
     <label><span className="sr-only">Teléfono</span><input className={inputClass} name="phone" aria-invalid={invalidField==="phone" || undefined} type="tel" autoComplete="tel" placeholder="Teléfono*" maxLength={50} required/></label>
     <label><span className="sr-only">¿Qué servicio te interesa?</span><CustomSelect className={inputClass} name="service" defaultValue=""><option value="" disabled>¿Qué servicio te interesa?</option><option>Comprar una propiedad</option><option>Vender una propiedad</option><option>Alquilar una propiedad</option><option>Tasación de una propiedad</option><option>Otro</option></CustomSelect></label>
     <label className={styles.message}><span className="sr-only">Tu mensaje</span><textarea className={inputClass} name="message" aria-invalid={invalidField==="message" || undefined} placeholder="Tu mensaje" required minLength={10} maxLength={5000}/></label>
    </div>
    <div hidden aria-hidden="true"><label>Sitio web<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <div className={styles.formActions}>
     <label className={styles.consent}><input type="checkbox" name="consent" aria-invalid={invalidField==="consent" || undefined} required/><span>Acepto los <Link href="/terms-conditions">términos y condiciones</Link></span></label>
     <button disabled={status==="sending"} className={styles.submit}>{status==="sending"?"Enviando…":"Enviar mensaje"}</button>
    </div>
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
