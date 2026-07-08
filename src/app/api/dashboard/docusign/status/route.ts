import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/require-permission";
import { isDocusignConfigured, getDocusignConfigStatus } from "@/lib/docusign";

export const runtime = "nodejs";

export async function GET() {
  const gate = await requirePermission("docusign:view");
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.error }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    connected: isDocusignConfigured(),
    config: getDocusignConfigStatus(),
  });
}
