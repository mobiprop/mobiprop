import { NextResponse } from "next/server";

import { createEmailList, listEmailLists } from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await listEmailLists();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, lists: result.lists });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });

  const result = await createEmailList(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, list: result.list });
}
