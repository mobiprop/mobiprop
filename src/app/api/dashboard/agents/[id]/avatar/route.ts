import { NextResponse } from "next/server";

import { removeAgentAvatar, updateAgentAvatar } from "@/features/agents/agent-actions";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ success: false, error: "No photo provided." }, { status: 400 });
  }

  const result = await updateAgentAvatar(id, file);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, agent: result.agent });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await removeAgentAvatar(id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, agent: result.agent });
}
