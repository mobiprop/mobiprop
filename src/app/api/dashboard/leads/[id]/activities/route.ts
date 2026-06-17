import { NextResponse } from "next/server";

import { getLeadActivities } from "@/features/crm/lead-actions";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getLeadActivities(id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, activities: result.activities });
}
