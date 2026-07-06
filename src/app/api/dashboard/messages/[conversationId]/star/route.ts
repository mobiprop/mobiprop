import { NextResponse } from "next/server";

import { toggleConversationStar } from "@/features/messages/message-actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ conversationId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { conversationId } = await params;

  const result = await toggleConversationStar(conversationId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, isStarred: result.value });
}
