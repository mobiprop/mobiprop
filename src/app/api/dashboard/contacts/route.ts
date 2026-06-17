import { NextResponse } from "next/server";

import { listContacts, createContact } from "@/features/crm/contact-actions";

export const runtime = "nodejs";

export async function GET() {
  const result = await listContacts();
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, contacts: result.contacts, metrics: result.metrics });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const result = await createContact(body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, contact: result.contact }, { status: 201 });
}
