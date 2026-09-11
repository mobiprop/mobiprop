import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkCooldown } from "@/features/notifications/server/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(150),
  email: z.email().max(254),
  phone: z.string().trim().max(50),
  service: z.string().trim().max(100),
  message: z.string().trim().min(10).max(5000),
  consent: z.literal(true),
  website: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 16000) return NextResponse.json({ok:false}, {status:413});
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ok:false}, {status:403});
  const raw = await request.text();
  if (raw.length > 16000) return NextResponse.json({ok:false}, {status:413});
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ok:false}, {status:400}); }
  const parsed = schema.safeParse(body);
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
      await tx.lead.create({data:{
        leadNumber:`LDR-${String((row?.max ?? 0)+1).padStart(4,"0")}`,
        submittedName:data.name,submittedEmail:email,submittedPhone:data.phone || null,
        source:"WEBSITE_CONTACT_FORM",sourceDetail:data.service || "Contact page",
        notes:data.message,sourceUrl:new URL("/contact",request.url).href,
      }});
      return true;
    });
    return NextResponse.json({ok:result},{status:result?201:429});
  } catch {
    return NextResponse.json({ok:false},{status:503});
  }
}
