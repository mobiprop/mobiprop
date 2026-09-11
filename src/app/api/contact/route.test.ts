import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({transaction:vi.fn(),cooldown:vi.fn()}));
vi.mock('@/lib/prisma',()=>({prisma:{$transaction:mocks.transaction}}));
vi.mock('@/features/notifications/server/rate-limit',()=>({checkCooldown:mocks.cooldown}));
import { POST } from './route';
const data={name:'Test Visitor',email:'test@example.com',phone:'123456789',service:'Buying',message:'I would like to arrange a viewing.',consent:true};
const request=(body:unknown,origin='https://mobi-prop.vercel.app')=>new Request('https://mobi-prop.vercel.app/api/contact',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();mocks.cooldown.mockReturnValue({ok:true});});
describe('public contact submission',()=>{
 it('rejects missing consent without writing a lead',async()=>{expect((await POST(request({...data,consent:false}))).status).toBe(400);expect(mocks.transaction).not.toHaveBeenCalled();});
 it('rejects a cross-origin request',async()=>{expect((await POST(request(data,'https://other.example'))).status).toBe(403);expect(mocks.transaction).not.toHaveBeenCalled();});
 it('does not persist honeypot submissions',async()=>{expect((await POST(request({...data,website:'spam'}))).status).toBe(200);expect(mocks.transaction).not.toHaveBeenCalled();});
 it('reports success only after persistence succeeds',async()=>{mocks.transaction.mockResolvedValue(true);expect((await POST(request(data))).status).toBe(201);});
 it('reports database failure rather than claiming delivery',async()=>{mocks.transaction.mockRejectedValue(new Error('offline'));expect((await POST(request(data))).status).toBe(503);});
 it('limits repeated submissions',async()=>{mocks.transaction.mockResolvedValue(false);expect((await POST(request(data))).status).toBe(429);});
});
