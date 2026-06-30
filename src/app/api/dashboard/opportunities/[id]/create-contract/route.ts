import { NextResponse } from "next/server";

import { createContractFromOpportunity } from "@/features/crm/opportunity-actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = await createContractFromOpportunity(id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, draft: result.draft });
}
