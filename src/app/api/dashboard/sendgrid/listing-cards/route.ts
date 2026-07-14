import { NextResponse } from "next/server";

import { getEmailListingCards } from "@/features/integrations/sendgrid-actions";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(Boolean);
  const result = await getEmailListingCards(ids);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, cards: result.cards });
}
