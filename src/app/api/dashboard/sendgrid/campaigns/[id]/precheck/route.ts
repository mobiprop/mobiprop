import { NextResponse } from "next/server";

import { getSendPrecheck } from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const result = await getSendPrecheck(id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    success: true,
    ready: result.ready,
    reason: result.reason,
    recipientCount: result.recipientCount,
    listName: result.listName,
  });
}
