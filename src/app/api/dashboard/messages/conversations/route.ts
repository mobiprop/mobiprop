import { NextResponse } from "next/server";

import { getOrCreateConversation } from "@/features/messages/message-actions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.otherProfileId) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await getOrCreateConversation(body.otherProfileId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, conversationId: result.conversationId }, { status: 201 });
}
