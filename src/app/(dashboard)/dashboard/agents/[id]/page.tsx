import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { AgentDetailPage } from "@/features/dashboard/AgentDetailPage";

export const metadata: Metadata = { title: "Agent Detail — Ulrich Propiedades" };

export default async function DashboardAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDashboardAccess("agents:view");
  const { id } = await params;
  return <AgentDetailPage agentId={Number(id)} />;
}
