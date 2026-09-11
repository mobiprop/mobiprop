import 'server-only';
import type { User } from '@supabase/supabase-js';
import { APP_URL } from './constants';
import { prisma } from './prisma';
import { sendWelcomeEmail } from './email';

/** Claim by a deterministic primary key so simultaneous callbacks cannot send twice. */
export async function sendVerifiedWelcome(user: User): Promise<void> {
  if (!user.email || !user.email_confirmed_at) return;
  const id = `welcome:${user.id}`;
  let claimed = false;
  let delivered = false;
  try {
    const profile = await prisma.profile.findUnique({where:{id:user.id},select:{role:true,status:true}});
    if (profile?.role !== 'USER' || profile.status !== 'ACTIVE') return;
    try {
      await prisma.activityLog.create({data:{id,action:'WELCOME_EMAIL_PENDING',entityType:'PROFILE',entityId:user.id}});
      claimed = true;
    } catch (error) {
      if ((error as {code?:string}).code === 'P2002') return;
      throw error;
    }
    const properties = await prisma.property.findMany({where:{status:'ACTIVE',publishedAt:{not:null}},orderBy:[{isFeatured:'desc'},{publishedAt:'desc'}],take:3,include:{images:{orderBy:[{isCover:'desc'},{sortOrder:'asc'}],take:1}}});
    const recommendations = properties.map(p=>({title:p.title,url:`${APP_URL}/listings/${p.slug}`,image:p.images[0]?.url,location:p.location,bedrooms:p.bedrooms,bathrooms:p.bathrooms,area:p.totalAreaM2,price:p.salePrice?`${p.saleCurrency} ${Number(p.salePrice).toLocaleString('en-US')}`:p.rentPrice?`${p.rentCurrency} ${Number(p.rentPrice).toLocaleString('en-US')}`:undefined}));
    const result = await sendWelcomeEmail({to:user.email,properties:recommendations,name:typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined});
    if (result.sent) {
      delivered = true;
      await prisma.activityLog.update({where:{id},data:{action:'WELCOME_EMAIL_SENT'}});
    }
    else {
      await prisma.activityLog.delete({where:{id}});
      claimed = false;
      console.error('[welcome] Delivery failed', result.error);
    }
  } catch (error) {
    // Retry an unsuccessful attempt on the next verified login. Keep the claim
    // after accepted delivery, even if updating the log fails, to avoid duplicates.
    if (claimed && !delivered) {
      await prisma.activityLog.deleteMany({where:{id,action:'WELCOME_EMAIL_PENDING'}}).catch(() => undefined);
    }
    console.error('[welcome] Could not complete delivery', error instanceof Error ? error.message : 'Unknown error');
  }
}
