import { NextResponse } from "next/server";
import { contactSchema } from "@/features/contact/contact-schema";
import { sendContactEmails } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { checkCooldown } from "@/features/notifications/server/rate-limit";

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 16000) return NextResponse.json({ok:false}, {status:413});
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ok:false}, {status:403});
  const raw = await request.text();
  if (raw.length > 16000) return NextResponse.json({ok:false}, {status:413});
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ok:false}, {status:400}); }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ok:false}, {status:400});
  const data = parsed.data;
  if (data.website) return NextResponse.json({ok:true});
  const email = data.email.toLowerCase();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkCooldown(`contact:${ip}`, 10000).ok) return NextResponse.json({ok:false}, {status:429});
  try {
    const result = await prisma.$transaction(async tx => {
      // Existing CRM IDs are numeric LDR identifiers. Serialize generation with
      // other inserts so public submissions cannot reserve duplicate numbers.
      await tx.$executeRaw`LOCK TABLE leads IN SHARE ROW EXCLUSIVE MODE`;
      const recent = await tx.lead.count({where:{submittedEmail:email, source:"WEBSITE_CONTACT_FORM",createdAt:{gte:new Date(Date.now()-600000)}}});
      if (recent >= 3) return false;
      const [row] = await tx.$queryRaw<{max:number|null}[]>`SELECT MAX(CAST(SUBSTRING(lead_number FROM 5) AS INTEGER)) AS max FROM leads`;
      const lead = await tx.lead.create({data:{
        leadNumber:`LDR-${String((row?.max ?? 0)+1).padStart(4,"0")}`,
        submittedName:data.name,submittedEmail:email,submittedPhone:data.phone || null,
        source:"WEBSITE_CONTACT_FORM",sourceDetail:data.service || "Contact page",
        notes:data.message,sourceUrl:new URL("/contact",request.url).href,
      }});
      return {id:lead.id,leadNumber:lead.leadNumber};
    });
    if (!result) return NextResponse.json({ok:false},{status:429});
    // Persist first: a mail provider failure must not lose the inquiry or ask
    // the visitor to resubmit a lead that has already been saved.
    let delivery={teamSent:false,receiptSent:false};
    try { delivery=await sendContactEmails({...data,email,leadNumber:result.leadNumber}); }
    catch { console.error("[contact] Email delivery failed", {leadNumber:result.leadNumber}); }
    try {
      await prisma.leadActivity.create({data:{leadId:result.id,type:"EMAIL",metadata:{
        event:"CONTACT_FORM_EMAILS",teamRecipient:"hola@mobiprop.com.ar",...delivery,
        // Provider acceptance is not proof of arrival in the recipient inbox.
        status:delivery.teamSent && delivery.receiptSent ? "PROVIDER_ACCEPTED" : "DELIVERY_FAILED",
      }}});
    } catch { console.error("[contact] Could not record email result",{leadNumber:result.leadNumber}); }
    if (!delivery.teamSent || !delivery.receiptSent) console.warn("[contact] Inquiry saved; email delivery incomplete",{leadNumber:result.leadNumber,...delivery});
    return NextResponse.json({ok:true,confirmationEmailSent:delivery.receiptSent},{status:201});
  } catch {
    return NextResponse.json({ok:false},{status:503});
  }
}
