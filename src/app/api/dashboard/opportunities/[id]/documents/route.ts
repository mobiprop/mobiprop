import { NextResponse } from "next/server";

import { addOpportunityDocument } from "@/features/crm/opportunity-actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.storagePath || !body?.fileName) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await addOpportunityDocument(id, body.storagePath, body.fileName);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, document: result.document }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to save document" }, { status: 400 });
  }
}
