import { NextResponse } from "next/server";

import {
  addMemberManually,
  addMembersFromCrmContacts,
  listMembers,
  removeMember,
} from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  const search = new URL(req.url).searchParams.get("search") ?? undefined;
  const result = await listMembers(id, search);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, members: result.members, listName: result.listName });
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });

  // Two add modes: pick from CRM contacts, or type an address manually.
  if (Array.isArray(body.contactIds)) {
    const result = await addMembersFromCrmContacts(id, body.contactIds);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, added: result.added, skippedNoEmail: result.skippedNoEmail });
  }

  const result = await addMemberManually(id, body);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, member: result.member });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const recipientId = body?.recipientId;
  if (!recipientId) {
    return NextResponse.json({ success: false, error: "recipientId is required" }, { status: 400 });
  }
  const result = await removeMember(id, recipientId);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true });
}
