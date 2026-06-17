import { NextResponse } from "next/server";

import { listAgents } from "@/features/agents/agent-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await listAgents();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, agents: result.agents, metrics: result.metrics });
}
