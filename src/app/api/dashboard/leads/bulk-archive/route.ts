import { NextResponse } from "next/server";

import { bulkArchiveLeads } from "@/features/crm/lead-actions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.ids)) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await bulkArchiveLeads(body.ids);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, archivedIds: result.archivedIds, failedCount: result.failedCount });
}
