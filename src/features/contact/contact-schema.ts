import { z } from "zod";

export const contactSchema = z.object({
  name:z.string({error:"Ingresá tu nombre completo."}).trim().min(2,"Ingresá tu nombre completo (al menos 2 caracteres).").max(150,"El nombre no puede superar los 150 caracteres."),
  email:z.email("Ingresá un correo electrónico válido.").max(254,"El correo es demasiado largo."),
  phone:z.string({error:"Ingresá un teléfono de contacto válido."}).trim().min(6,"Ingresá un teléfono de contacto válido.").max(50,"El teléfono es demasiado largo.").refine(v=>/^[+\d\s().-]+$/.test(v)&&v.replace(/\D/g,"").length>=6,"Ingresá un teléfono de contacto válido."),
  service:z.string({error:"Seleccioná un servicio válido."}).trim().max(100,"El servicio es demasiado largo.").default(""),
  message:z.string({error:"Contanos en qué podemos ayudarte."}).trim().min(10,"Contanos un poco más: el mensaje debe tener al menos 10 caracteres.").max(5000,"El mensaje no puede superar los 5000 caracteres."),
  consent:z.literal(true,{error:"Aceptá los términos y condiciones para enviar tu consulta."}),
  website:z.string({error:"Revisá los datos del formulario."}).max(200,"Revisá los datos del formulario.").optional(),
});
