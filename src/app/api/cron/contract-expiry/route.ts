import { NextResponse } from "next/server";

import { checkExpiringContracts } from "@/features/crm/contract-expiry";

export const runtime = "nodejs";

/**
 * Triggered daily by Vercel Cron (see vercel.json). Vercel signs cron requests
 * with the CRON_SECRET env var as a bearer token — see
 * https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs.
 * Requires CRON_SECRET to be set in the Vercel project (and locally for
 * manual testing); requests without a matching token are rejected.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await checkExpiringContracts();
  return NextResponse.json({ success: true, notified: result.notified });
}
