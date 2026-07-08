import { NextResponse } from "next/server";

import { getDocusignSettings, updateDocusignSettings } from "@/features/integrations/docusign-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await getDocusignSettings();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, settings: result.settings });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await updateDocusignSettings(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, settings: result.settings });
}
