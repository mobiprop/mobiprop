import { NextResponse } from "next/server";

import { mintMessageAttachmentTickets } from "@/features/messages/message-actions";
import { attachmentUploadTicketRequestSchema } from "@/schemas/message.schema";

export const runtime = "nodejs";

type Params = { params: Promise<{ conversationId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { conversationId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = attachmentUploadTicketRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await mintMessageAttachmentTickets(conversationId, parsed.data.files);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, tickets: result.tickets });
}
