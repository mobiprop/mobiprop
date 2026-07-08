import { NextResponse } from "next/server";

import { voidEnvelopeAction } from "@/features/integrations/docusign-actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const result = await voidEnvelopeAction(id, body?.reason || "Voided by staff");
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, id: result.id });
}
