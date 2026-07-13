import { NextResponse } from "next/server";

import { previewImport } from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.listId || !Array.isArray(body.rows)) {
    return NextResponse.json({ success: false, error: "listId and rows are required" }, { status: 400 });
  }
  const result = await previewImport(body.listId, body.rows);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, preview: result.preview });
}
