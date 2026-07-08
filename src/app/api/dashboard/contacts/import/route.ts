import { NextResponse } from "next/server";

import { importContacts } from "@/features/crm/contact-actions";
import { importContactsSchema } from "@/schemas/contact.schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = importContactsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 422 },
    );
  }

  const result = await importContacts(parsed.data.rows);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    success: true,
    created: result.created,
    skipped: result.skipped,
    errors: result.errors,
  });
}
