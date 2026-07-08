import { NextResponse } from "next/server";

import { attachEnvelopeToOpportunity, detachEnvelopeFromOpportunity } from "@/features/integrations/docusign-actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.envelopeId) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await attachEnvelopeToOpportunity(body.envelopeId, id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, id: result.id });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.envelopeId) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await detachEnvelopeFromOpportunity(body.envelopeId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, id: result.id });
}
