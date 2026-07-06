import { NextResponse } from "next/server";

import { deleteMessage } from "@/features/messages/message-actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ conversationId: string; messageId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { messageId } = await params;

  const result = await deleteMessage(messageId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, id: result.id });
}
