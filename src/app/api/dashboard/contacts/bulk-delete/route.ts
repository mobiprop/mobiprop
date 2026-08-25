import { NextResponse } from "next/server";

import { bulkDeleteContacts } from "@/features/crm/contact-actions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.ids)) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await bulkDeleteContacts(body.ids);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, deletedIds: result.deletedIds, failedCount: result.failedCount });
}
