import { NextResponse } from "next/server";

import { listWebsiteTeam, saveWebsiteTeam } from "@/features/agents/agent-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await listWebsiteTeam();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, members: result.members });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.members)) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await saveWebsiteTeam(body.members);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, members: result.members });
}
