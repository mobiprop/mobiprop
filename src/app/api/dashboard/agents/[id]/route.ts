import { NextResponse } from "next/server";

import {
  deleteAgent,
  getAgentDetail,
  updateAgent,
  updateAgentStatus,
  type AgentDetailPeriod,
} from "@/features/agents/agent-actions";

export const runtime = "nodejs";

const VALID_PERIODS: AgentDetailPeriod[] = ["current_month", "last_month", "this_quarter", "this_year"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const periodParam = new URL(request.url).searchParams.get("period");
  const period = VALID_PERIODS.includes(periodParam as AgentDetailPeriod)
    ? (periodParam as AgentDetailPeriod)
    : undefined;

  const result = await getAgentDetail(id, period);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, agent: result.agent });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  // Two distinct shapes hit this route: { status } from the approve/deny/deactivate
  // buttons, and the Edit Agent modal's profile fields. Dispatch based on which
  // keys are present rather than overloading one schema for both.
  const hasProfileFields =
    body &&
    ("fullName" in body ||
      "phone" in body ||
      "city" in body ||
      "role" in body ||
      "notes" in body ||
      "teamLeaderId" in body);

  if (hasProfileFields) {
    const { fullName, phone, city, role, notes, teamLeaderId } = body;
    if (role !== undefined && role !== "AGENT" && role !== "MANAGER") {
      return NextResponse.json({ success: false, error: "Role must be AGENT or MANAGER." }, { status: 400 });
    }
    const result = await updateAgent(id, { fullName, phone, city, role, notes, teamLeaderId });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, agent: result.agent });
  }

  const newStatus = body?.status;
  if (newStatus !== "ACTIVE" && newStatus !== "INACTIVE") {
    return NextResponse.json({ success: false, error: "Invalid status. Must be ACTIVE or INACTIVE." }, { status: 400 });
  }

  const result = await updateAgentStatus(id, newStatus);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await deleteAgent(id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true });
}
