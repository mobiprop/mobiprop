import { NextResponse } from "next/server";

import { removeContractDocument } from "@/features/crm/contract-actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; docId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { id, docId } = await params;
  const result = await removeContractDocument(id, docId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, id: result.id });
}
