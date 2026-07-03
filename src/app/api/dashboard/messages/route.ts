import { NextResponse } from "next/server";

import { listConversations } from "@/features/messages/message-actions";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const archivedOnly = searchParams.get("archivedOnly") === "true";

  const result = await listConversations(archivedOnly);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, conversations: result.conversations });
}
