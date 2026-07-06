import { NextResponse } from "next/server";

import { listMessages, deleteConversation } from "@/features/messages/message-actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ conversationId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { conversationId } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const result = await listMessages(conversationId, cursor, limit && Number.isFinite(limit) ? limit : undefined);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, messages: result.messages, nextCursor: result.nextCursor });
}

/** Soft-deletes the conversation for the caller only — see deleteConversation's doc comment. */
export async function DELETE(_req: Request, { params }: Params) {
  const { conversationId } = await params;

  const result = await deleteConversation(conversationId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, id: result.id });
}
