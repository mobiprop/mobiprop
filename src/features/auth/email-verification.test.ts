import { beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(()=>({login:vi.fn(),signOut:vi.fn(),profile:vi.fn(),after:vi.fn()}));
vi.mock('next/server',()=>({after:mocks.after}));
vi.mock('@/lib/verified-welcome',()=>({sendVerifiedWelcome:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{signInWithPassword:mocks.login,signOut:mocks.signOut}})}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:vi.fn()}));
vi.mock('@/lib/prisma',()=>({prisma:{profile:{findUnique:mocks.profile}}}));
import { signInWithPassword } from './actions';
const credentials={email:'test@example.com',password:'test-password'};
beforeEach(()=>{vi.clearAllMocks();mocks.profile.mockResolvedValue({role:'USER',status:'ACTIVE'});});
test('unverified users get no usable login session',async()=>{
 mocks.login.mockResolvedValue({data:{user:{id:'test',email_confirmed_at:null}},error:null});
 expect((await signInWithPassword(credentials)).error).toContain('verify');
 expect(mocks.signOut).toHaveBeenCalled();expect(mocks.after).not.toHaveBeenCalled();
});
test('verified active users can sign in',async()=>{
 mocks.login.mockResolvedValue({data:{user:{id:'test',email_confirmed_at:'2026-09-11'}},error:null});
 expect(await signInWithPassword(credentials)).toEqual({});expect(mocks.signOut).not.toHaveBeenCalled();
});
test('inactive users are signed out',async()=>{
 mocks.login.mockResolvedValue({data:{user:{id:'test',email_confirmed_at:'2026-09-11'}},error:null});
 mocks.profile.mockResolvedValue({role:'USER',status:'SUSPENDED'});
 expect((await signInWithPassword(credentials)).error).toContain('not active');expect(mocks.signOut).toHaveBeenCalled();
});
