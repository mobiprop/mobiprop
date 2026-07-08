import { NextResponse } from "next/server";

import { listEnvelopes } from "@/features/integrations/docusign-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await listEnvelopes();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, envelopes: result.envelopes, stats: result.stats });
}
