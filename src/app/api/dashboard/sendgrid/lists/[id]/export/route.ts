import { NextResponse } from "next/server";

import { exportListCsv } from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const result = await exportListCsv(id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return new NextResponse(result.csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
    },
  });
}
