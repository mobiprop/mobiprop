import { expect, test } from "vitest";
import { renderContactReceipt, renderContactTeamNotification } from "./contact-email-design";
const data={name:'Matias <script>',email:'test@example.com',phone:'+54 11 1234 5678',service:'Comprar',message:'Hola <img src=x onerror=alert(1)>\nSegunda línea',leadNumber:'LDR-0001'};
test('receipt is branded, Spanish and does not echo an arbitrary submitted message',()=>{
 const html=renderContactReceipt(data);
 expect(html).toContain('Recibimos tu consulta');expect(html).toContain('24 horas');
 expect(html).toContain('mobi-logo.png');expect(html).toContain('hola@mobiprop.com.ar');
 expect(html).not.toContain('<script>');expect(html).not.toContain(data.message);
});
test('internal email contains escaped contact details and safe message line breaks',()=>{
 const html=renderContactTeamNotification(data);
 expect(html).toContain('LDR-0001');expect(html).toContain('test@example.com');
 expect(html).toContain('&lt;img');expect(html).not.toContain('<img src=x');
 expect(html).toContain('<br>Segunda línea');expect(html).toContain('/dashboard/leads');
});
