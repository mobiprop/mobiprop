import { z } from "zod";

export const contactSchema = z.object({
  name:z.string().trim().min(2,"Ingresá tu nombre completo (al menos 2 caracteres).").max(150,"El nombre no puede superar los 150 caracteres."),
  email:z.email("Ingresá un correo electrónico válido.").max(254,"El correo es demasiado largo."),
  phone:z.string().trim().min(6,"Ingresá un teléfono de contacto válido.").max(50,"El teléfono es demasiado largo.").refine(v=>/^[+\d\s().-]+$/.test(v)&&v.replace(/\D/g,"").length>=6,"Ingresá un teléfono de contacto válido."),
  service:z.string().trim().max(100,"El servicio es demasiado largo."),
  message:z.string().trim().min(10,"Contanos un poco más: el mensaje debe tener al menos 10 caracteres.").max(5000,"El mensaje no puede superar los 5000 caracteres."),
  consent:z.literal(true,{error:"Aceptá los términos y condiciones para enviar tu consulta."}),
  website:z.string().max(200).optional(),
});
