import { APP_URL } from "./constants";
import { card, escapeEmail } from "./transactional-email-design";

export type ContactEmailData = {name:string;email:string;phone:string;service:string;message:string;leadNumber:string};
const font="'Montserrat','Segoe UI',Arial,sans-serif";
const paragraph=(content:string)=>`<p style="margin:24px 0;font:14px/22px ${font};color:#232323;">${content}</p>`;
function details(data:ContactEmailData, internal:boolean) {
 const rows=internal?[["Referencia",data.leadNumber],["Nombre",data.name],["Correo",data.email],["Teléfono",data.phone],["Servicio",data.service||"Consulta general"]]:[["Referencia",data.leadNumber],["Servicio",data.service||"Consulta general"]];
 return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;background:#fff;border:1px solid #ccdeef;border-radius:12px;text-align:left;">${rows.map(([label,value])=>`<tr><td width="32%" valign="top" style="padding:12px;font:500 12px/20px ${font};color:#005089;">${label}</td><td style="padding:12px;font:14px/20px ${font};color:#232323;overflow-wrap:anywhere;word-break:break-word;">${escapeEmail(value)}</td></tr>`).join("")}</table>`;
}
export function renderContactReceipt(data:ContactEmailData) {
 return card("Consulta recibida","Recibimos tu consulta","icon-check.png",
 paragraph(`Hola ${escapeEmail(data.name)}, gracias por escribirnos.`)+paragraph("Tu consulta ya está en manos de nuestro equipo. <strong>Te responderemos dentro de las 24 horas.</strong>")+details(data,false)+paragraph("Si necesitás agregar información, respondé a este correo."),
 '¿Preferís hablar por WhatsApp? <a href="https://wa.me/5491180306000" style="color:#005089;">Escribinos al +54 9 11 8030 6000</a>');
}
export function renderContactTeamNotification(data:ContactEmailData) {
 const message=escapeEmail(data.message).replace(/\r?\n/g,"<br>");
 return card("Nueva consulta","Nueva consulta desde la web","verify.png",
 paragraph("Se recibió una consulta desde el formulario de contacto de Mobi Prop.")+details(data,true)+`<div style="margin:24px 0;padding:20px;background:white;border:1px solid #ccdeef;border-radius:12px;text-align:left;font:14px/22px ${font};color:#232323;overflow-wrap:anywhere;word-break:break-word;"><strong>Mensaje</strong><br>${message}</div>`+paragraph(`<a href="${APP_URL}/dashboard/leads" style="display:inline-block;padding:14px 24px;background:#0066b0;border-radius:12px;color:#fff;text-decoration:none;">Ver consultas en el CRM</a>`),
 "Respondé a este correo para contactar directamente al interesado.");
}
