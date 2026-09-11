import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({transaction:vi.fn(),cooldown:vi.fn(),sendEmails:vi.fn(),activity:vi.fn()}));
vi.mock('@/lib/prisma',()=>({prisma:{$transaction:mocks.transaction,leadActivity:{create:mocks.activity}}}));
vi.mock('@/features/notifications/server/rate-limit',()=>({checkCooldown:mocks.cooldown}));
vi.mock('@/lib/email',()=>({sendContactEmails:mocks.sendEmails}));
import { POST } from './route';
const data={name:'Test Visitor',email:'test@example.com',phone:'123456789',service:'Buying',message:'I would like to arrange a viewing.',consent:true};
const request=(body:unknown,origin='https://mobi-prop.vercel.app')=>new Request('https://mobi-prop.vercel.app/api/contact',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();mocks.cooldown.mockReturnValue({ok:true});mocks.sendEmails.mockResolvedValue({teamSent:true,receiptSent:true});mocks.activity.mockResolvedValue({});});
describe('public contact submission',()=>{
 it('rejects missing consent without writing a lead',async()=>{expect((await POST(request({...data,consent:false}))).status).toBe(400);expect(mocks.transaction).not.toHaveBeenCalled();});
 it('rejects a cross-origin request',async()=>{expect((await POST(request(data,'https://other.example'))).status).toBe(403);expect(mocks.transaction).not.toHaveBeenCalled();});
 it('does not persist honeypot submissions',async()=>{expect((await POST(request({...data,website:'spam'}))).status).toBe(200);expect(mocks.transaction).not.toHaveBeenCalled();});
 it('reports success only after persistence succeeds',async()=>{mocks.transaction.mockResolvedValue({id:"lead1",leadNumber:"LDR-0001"});expect((await POST(request(data))).status).toBe(201);});
 it('reports database failure rather than claiming delivery',async()=>{mocks.transaction.mockRejectedValue(new Error('offline'));expect((await POST(request(data))).status).toBe(503);});
 it('limits repeated submissions',async()=>{mocks.transaction.mockResolvedValue(false);expect((await POST(request(data))).status).toBe(429);});
});

it('notifies both parties only after the lead is saved',async()=>{
 mocks.transaction.mockResolvedValue({id:"lead1",leadNumber:"LDR-0001"});
 await POST(request(data));
 expect(mocks.sendEmails).toHaveBeenCalledWith(expect.objectContaining({email:data.email,leadNumber:"LDR-0001"}));
 expect(mocks.activity).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({metadata:expect.objectContaining({status:"PROVIDER_ACCEPTED"})})}));
});
it('does not send email for failed persistence or throttled requests',async()=>{
 mocks.transaction.mockRejectedValue(new Error('offline'));await POST(request(data));
 expect(mocks.sendEmails).not.toHaveBeenCalled();
});
it('keeps saved leads successful if email delivery fails',async()=>{
 mocks.transaction.mockResolvedValue({id:"lead1",leadNumber:"LDR-0001"});
 mocks.sendEmails.mockResolvedValue({teamSent:false,receiptSent:false});
 const response=await POST(request(data));expect(response.status).toBe(201);
 expect(await response.json()).toEqual({ok:true,confirmationEmailSent:false});
 expect(mocks.activity).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({metadata:expect.objectContaining({status:"DELIVERY_FAILED"})})}));
});
it('rejects invalid phone numbers without sending mail',async()=>{
 expect((await POST(request({...data,phone:'abc'}))).status).toBe(400);
 expect(mocks.sendEmails).not.toHaveBeenCalled();
});
