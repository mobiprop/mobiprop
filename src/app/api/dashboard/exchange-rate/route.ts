import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/require-permission";
import { getDolarBlueVenta } from "@/lib/exchange-rate";

export const runtime = "nodejs";

// Live Dólar Blue "venta" preview — used to pre-fill the rate shown when
// closing an ARS-denominated opportunity. The rate actually locked in at
// close time is resolved server-side again (or overridden), this is just
// for display before the user confirms.
export async function GET() {
  const gate = await requirePermission("opportunities:update");
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.error }, { status: 403 });
  }

  const rate = await getDolarBlueVenta();
  return NextResponse.json({ success: true, rate });
}
