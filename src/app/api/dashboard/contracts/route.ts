import { NextResponse } from "next/server";

import { listContracts, createContract } from "@/features/crm/contract-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await listContracts();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    success: true,
    contracts: result.contracts,
    metrics: result.metrics,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await createContract(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, contract: result.contract }, { status: 201 });
}
