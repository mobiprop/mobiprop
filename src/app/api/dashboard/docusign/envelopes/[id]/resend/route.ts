import { NextResponse } from "next/server";

import { resendEnvelopeAction } from "@/features/integrations/docusign-actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;

  const result = await resendEnvelopeAction(id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, id: result.id });
}
