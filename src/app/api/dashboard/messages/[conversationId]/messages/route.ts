import { NextResponse } from "next/server";

import { sendMessage } from "@/features/messages/message-actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ conversationId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { conversationId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await sendMessage(conversationId, body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, message: result.message }, { status: 201 });
}
