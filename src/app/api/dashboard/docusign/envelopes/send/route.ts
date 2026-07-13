import { NextResponse } from "next/server";

import { sendEnvelopeForSignature, sendCustomContractForSignature } from "@/features/integrations/docusign-actions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { source, ...rest } = body;
  const result = source === "CUSTOM_UPLOAD" ? await sendCustomContractForSignature(rest) : await sendEnvelopeForSignature(rest);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, envelope: result.envelope }, { status: 201 });
}
