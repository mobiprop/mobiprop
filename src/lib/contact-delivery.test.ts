import { beforeEach, afterEach, expect, test, vi } from "vitest";
const mail=vi.hoisted(()=>({send:vi.fn(),setApiKey:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@sendgrid/mail",()=>({default:mail}));
import { sendContactEmails } from "./email";
const data={name:"Matias",email:"visitor@example.com",phone:"123456789",service:"Comprar",message:"Quiero hacer una consulta.",leadNumber:"LDR-0001"};
beforeEach(()=>{vi.stubEnv("SENDGRID_API_KEY","test-only-not-a-real-key");mail.send.mockReset();mail.send.mockResolvedValue([]);});
afterEach(()=>vi.unstubAllEnvs());
test("sends separate branded messages to the team and visitor with correct reply addresses",async()=>{
 expect(await sendContactEmails(data)).toEqual({teamSent:true,receiptSent:true});
 expect(mail.send).toHaveBeenCalledTimes(2);
 expect(mail.send).toHaveBeenCalledWith(expect.objectContaining({to:"hola@mobiprop.com.ar",from:"Mobi Prop <hola@mobiprop.com.ar>",replyTo:"visitor@example.com"}));
 expect(mail.send).toHaveBeenCalledWith(expect.objectContaining({to:"visitor@example.com",replyTo:"hola@mobiprop.com.ar",subject:"Recibimos tu consulta — Mobi Prop"}));
});
test("reports each provider failure without claiming the other email failed",async()=>{
 mail.send.mockRejectedValueOnce(new Error("unavailable"));
 expect(await sendContactEmails(data)).toEqual({teamSent:false,receiptSent:true});
});
