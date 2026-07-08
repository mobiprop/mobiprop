import { NextResponse } from "next/server";

import { mintOpportunityDocumentTicket } from "@/features/crm/opportunity-actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.type) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await mintOpportunityDocumentTicket(id, { name: body.name, type: body.type });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, ticket: result.ticket });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to create upload ticket" }, { status: 400 });
  }
}
