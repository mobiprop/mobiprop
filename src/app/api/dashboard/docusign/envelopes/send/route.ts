import { NextResponse } from "next/server";

import { sendEnvelopeForSignature } from "@/features/integrations/docusign-actions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await sendEnvelopeForSignature(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, envelope: result.envelope }, { status: 201 });
}
