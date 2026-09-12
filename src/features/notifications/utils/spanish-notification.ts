// Translate generated system copy only; preserve customer messages and unknown notifications.
const TITLES: Record<string,string> = {
  "Manager invited": "Gerente invitado",
  "New agent invited": "Nuevo agente invitado",
  "Invitation accepted": "Invitación aceptada",
  "Invitation revoked": "Invitación revocada",
  "New listing created": "Nueva propiedad creada",
  "Listing status changed": "Estado de propiedad actualizado",
  "Listing deleted": "Propiedad eliminada",
  "Listing assigned to you": "Propiedad asignada a vos",
  "Listing reassigned": "Propiedad reasignada",
  "New lead assigned to you": "Nuevo prospecto asignado a vos",
  "Unassigned lead needs attention": "Prospecto sin asignar",
  "Lead assigned to you": "Prospecto asignado a vos",
  "Lead reassigned": "Prospecto reasignado",
  "Lead assigned": "Prospecto asignado",
  "Tour scheduled": "Visita agendada",
  "New tour request": "Nueva solicitud de visita",
  "Tour assigned to you": "Visita asignada a vos",
  "Tour reassigned": "Visita reasignada",
  "Tour confirmed": "Visita confirmada",
  "Tour rescheduled": "Visita reprogramada",
  "Tour cancelled": "Visita cancelada",
  "Tour completed": "Visita completada",
  "Tour no-show": "Inasistencia a la visita",
  "Opportunity stage updated": "Etapa de oportunidad actualizada",
  "Opportunity won": "Oportunidad ganada",
  "Opportunity lost": "Oportunidad perdida",
  "Envelope sent for signature": "Documento enviado para firmar",
  "Envelope viewed": "Documento visto",
  "Envelope signed": "Documento firmado",
  "Envelope declined": "Firma rechazada",
  "Envelope voided": "Documento anulado",
  "Envelope expiring soon": "Documento próximo a vencer",
  "Test notification": "Notificación de prueba"
};
const BODIES: Record<string,string> = {
  "A listing has been assigned to you.": "Se te asignó una propiedad.",
  "A listing was assigned to an agent.": "Se asignó una propiedad a un agente.",
  "A new lead came in and was automatically assigned to you.": "Ingresó un nuevo prospecto y se te asignó automáticamente.",
  "A new lead came in with no agent to assign — please assign it manually.": "Ingresó un nuevo prospecto sin agente asignado. Asignalo manualmente.",
  "A new lead has been assigned to you.": "Se te asignó un nuevo prospecto.",
  "A lead was reassigned to another agent.": "Se reasignó un prospecto a otro agente.",
  "A lead was assigned to an agent.": "Se asignó un prospecto a un agente.",
  "A property tour was scheduled on your calendar.": "Se agendó una visita a una propiedad en tu calendario.",
  "A customer requested a property visit.": "Un cliente solicitó una visita a una propiedad.",
  "A property tour has been assigned to you.": "Se te asignó una visita a una propiedad.",
  "A property tour was assigned to another agent.": "Se asignó una visita a otro agente.",
  "A property tour has been confirmed.": "Se confirmó una visita a una propiedad.",
  "A property tour has been rescheduled.": "Se reprogramó una visita a una propiedad.",
  "A property tour has been cancelled.": "Se canceló una visita a una propiedad.",
  "A property tour was marked completed.": "Se marcó una visita como completada.",
  "A property tour was marked as a no-show.": "Se registró una inasistencia a una visita.",
  "Push notifications are working on this device.": "Las notificaciones funcionan en este dispositivo."
};
const ROLES: Record<string,string> = {Agent:"Agente",Manager:"Gerente",Administrator:"Administrador",Admin:"Administrador",AGENT:"Agente",MANAGER:"Gerente",ADMIN:"Administrador"};
const STATUSES: Record<string,string> = {ACTIVE:"Activo",INACTIVE:"Inactivo",PAUSED:"Pausado",RENTED:"Alquilado",SOLD:"Vendido",DRAFT:"Borrador"};
export function spanishNotification(title: string, body: string): {title:string;body:string} {
  if (title.startsWith("Message from ")) return {title:"Mensaje de " + title.slice(13),body};
  if (!TITLES[title]) return {title,body};
  let translated = BODIES[body];
  if (!translated) {
    const rules: [RegExp, (...parts: string[]) => string][] = [
      [/^(.+) invited (.+) to join as (.+)\.$/, (_,a,b,c)=>`${a} invitó a ${b} como ${ROLES[c] ?? c}.`],
      [/^(.+) accepted their invitation and joined as (.+)\.$/, (_,a,b)=>`${a} aceptó su invitación y se incorporó como ${ROLES[b] ?? b}.`],
      [/^The invitation for (.+) was revoked by (.+)\.$/, (_,a,b)=>`La invitación de ${a} fue revocada por ${b}.`],
      [/^(.+) created (.+)\.$/, (_,a,b)=>`${a} creó ${b}.`],
      [/^(.+) changed (.+) to (.+)\.$/, (_,a,b,c)=>`${a} cambió ${b} a ${STATUSES[c] ?? c}.`],
      [/^(.+) deleted (.+)\.$/, (_,a,b)=>`${a} eliminó ${b}.`],
      [/^(.+) moved to a new stage\.$/, (_,a)=>`${a} cambió de etapa.`],
      [/^(.+) was marked Closed Won\.$/, (_,a)=>`${a} se marcó como ganada.`],
      [/^(.+) was marked Closed Lost\.$/, (_,a)=>`${a} se marcó como perdida.`],
      [/^(.+) was sent to (.+)\.$/, (_,a,b)=>`${a} se envió a ${b}.`],
      [/^(.+) opened (.+)\.$/, (_,a,b)=>`${a} abrió ${b}.`],
      [/^(.+) was signed by (.+)\.$/, (_,a,b)=>`${a} fue firmado por ${b}.`],
      [/^(.+) was declined by (.+)\.$/, (_,a,b)=>`${a} fue rechazado por ${b}.`],
      [/^(.+) was voided\.$/, (_,a)=>`${a} fue anulado.`],
      [/^(.+) expires in (\d+) days (.+)\.$/, (_,a,b,c)=>`${a} vence en ${b} días ${c}.`],
    ];
    for (const [pattern, render] of rules) { const match=body.match(pattern); if(match) { translated=render(...match); break; } }
  }
  return {title:TITLES[title],body:translated ?? body};
}
