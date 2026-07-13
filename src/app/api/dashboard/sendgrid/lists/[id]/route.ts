import { NextResponse } from "next/server";

import { deleteEmailList, updateEmailList } from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });

  const result = await updateEmailList(id, body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, list: result.list });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const result = await deleteEmailList(id);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true });
}
