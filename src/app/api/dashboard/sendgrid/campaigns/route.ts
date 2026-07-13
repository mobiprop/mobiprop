import { NextResponse } from "next/server";

import { createCampaign, listCampaigns } from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await listCampaigns();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, campaigns: result.campaigns });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });

  const result = await createCampaign(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, campaign: result.campaign });
}
