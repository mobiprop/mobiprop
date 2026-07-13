import { NextResponse } from "next/server";

import { mintCustomContractUploadTicket } from "@/features/integrations/docusign-actions";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.type) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await mintCustomContractUploadTicket({ name: body.name, type: body.type });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, ticket: result.ticket });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to create upload ticket" }, { status: 400 });
  }
}
