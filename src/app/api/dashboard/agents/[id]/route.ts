import { NextResponse } from "next/server";

import { updateAgentStatus } from "@/features/agents/agent-actions";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const newStatus = body?.status;

  if (newStatus !== "ACTIVE" && newStatus !== "INACTIVE") {
    return NextResponse.json({ success: false, error: "Invalid status. Must be ACTIVE or INACTIVE." }, { status: 400 });
  }

  const result = await updateAgentStatus(id, newStatus);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true });
}
