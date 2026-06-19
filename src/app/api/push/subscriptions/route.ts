import { NextResponse } from "next/server";

import {
  deletePushSubscription,
  upsertPushSubscription,
} from "@/features/notifications/server/push-subscription-actions";
import {
  deletePushSubscriptionSchema,
  pushSubscriptionSchema,
} from "@/features/notifications/schemas/push-subscription-schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid subscription" },
      { status: 422 },
    );
  }

  const result = await upsertPushSubscription(parsed.data, req.headers.get("user-agent"));
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, subscriptionId: result.subscriptionId }, { status: 201 });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = deletePushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid endpoint" },
      { status: 422 },
    );
  }

  const result = await deletePushSubscription(parsed.data.endpoint);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, deactivated: result.deactivated });
}
