import { NextResponse } from "next/server";

import { getTemplatePreviewImage } from "@/features/integrations/docusign-actions";

export const runtime = "nodejs";

type Params = { params: Promise<{ templateId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { templateId } = await params;
  const result = await getTemplatePreviewImage(templateId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
