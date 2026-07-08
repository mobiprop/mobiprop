import { NextResponse } from "next/server";

import { checkExpiringEnvelopes } from "@/features/integrations/docusign-expiry";

export const runtime = "nodejs";

/**
 * Triggered daily by Vercel Cron (see vercel.json). Vercel signs cron requests
 * with the CRON_SECRET env var as a bearer token — see
 * https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await checkExpiringEnvelopes();
  return NextResponse.json({ success: true, notified: result.notified });
}
