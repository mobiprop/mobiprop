import { NextResponse } from "next/server";

import { listAvailableTemplates } from "@/features/integrations/docusign-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await listAvailableTemplates();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, templates: result.templates, usedCounts: result.usedCounts });
}
