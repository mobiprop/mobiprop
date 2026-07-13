import { NextResponse } from "next/server";

import { sendDueScheduledCampaigns } from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Triggered by Vercel Cron (see vercel.json) — sends campaigns whose
 * "Schedule for later" time has arrived. Each campaign is claimed with an
 * atomic SCHEDULED→SENDING transition, so overlapping cron runs can never
 * double-send.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await sendDueScheduledCampaigns();
  return NextResponse.json({ success: true, ...result });
}
