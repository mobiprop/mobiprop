import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { EmailRecipientStatus } from "@/generated/prisma/enums";
import { verifyWebhookSignature } from "@/lib/sendgrid-marketing";

export const runtime = "nodejs";

/**
 * SendGrid Event Webhook receiver — configure this URL in SendGrid → Settings
 * → Mail Settings → Event Webhook, with Signed Event Webhook enabled, and put
 * the verification public key in SENDGRID_WEBHOOK_PUBLIC_KEY.
 *
 * Security: when the public key is configured, the ECDSA signature is
 * verified BEFORE any DB write and invalid payloads are rejected. Until the
 * key is configured the endpoint rejects everything (503) — it never ingests
 * unauthenticated data.
 *
 * Idempotency: every event carries a unique sg_event_id; events are inserted
 * with skipDuplicates and per-recipient timestamps only ever move from null
 * to a value, so SendGrid's retry redeliveries can never double-count.
 */

type SendgridEvent = {
  email?: string;
  event?: string;
  timestamp?: number;
  sg_event_id?: string;
  sg_message_id?: string;
  reason?: string;
  type?: string;
  // Custom args attached by sendCampaignBatches.
  up_campaign_id?: string;
  up_campaign_recipient_id?: string;
};

/** Which EmailCampaignRecipient timestamp an event sets (first occurrence only). */
const EVENT_FIELD: Record<string, "deliveredAt" | "openedAt" | "clickedAt" | "bouncedAt" | "droppedAt" | "unsubscribedAt" | "spamReportedAt"> = {
  delivered: "deliveredAt",
  open: "openedAt",
  click: "clickedAt",
  bounce: "bouncedAt",
  dropped: "droppedAt",
  unsubscribe: "unsubscribedAt",
  group_unsubscribe: "unsubscribedAt",
  spamreport: "spamReportedAt",
};

export async function POST(req: Request) {
  const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
  if (!publicKey) {
    console.error("[sendgrid-webhook] SENDGRID_WEBHOOK_PUBLIC_KEY is not configured — rejecting all webhook calls.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const valid = verifyWebhookSignature({
    publicKey,
    payload: rawBody,
    signature: req.headers.get("x-twilio-email-event-webhook-signature"),
    timestamp: req.headers.get("x-twilio-email-event-webhook-timestamp"),
  });
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let events: SendgridEvent[];
  try {
    const parsed = JSON.parse(rawBody);
    events = Array.isArray(parsed) ? parsed : [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  for (const event of events) {
    const email = event.email?.toLowerCase();
    const name = event.event;
    if (!email || !name || !event.sg_event_id) continue;

    const campaignId = event.up_campaign_id ?? null;
    const timestamp = event.timestamp ? new Date(event.timestamp * 1000) : new Date();

    // 1. Store the raw event; a duplicate sg_event_id means this delivery was
    //    already processed — skip everything else for it.
    try {
      const stored = await prisma.emailCampaignEvent.createMany({
        data: [{
          sgEventId: event.sg_event_id,
          campaignId,
          email,
          event: name,
          timestamp,
          payload: { reason: event.reason ?? null, type: event.type ?? null, sgMessageId: event.sg_message_id ?? null },
        }],
        skipDuplicates: true,
      });
      if (stored.count === 0) continue;
    } catch (error) {
      // Unknown campaign id (e.g. campaign deleted) — store nothing, move on.
      console.error("[sendgrid-webhook] failed to store event", name, error);
      continue;
    }

    // 2. Update the per-campaign recipient row (first occurrence per metric).
    const field = EVENT_FIELD[name];
    if (field && campaignId) {
      await prisma.emailCampaignRecipient.updateMany({
        where: { campaignId, email, [field]: null },
        data: { [field]: timestamp, lastEventAt: timestamp },
      });
      await prisma.emailCampaign.updateMany({
        where: { id: campaignId },
        data: { lastEventAt: timestamp },
      });
    }

    // 3. Update the recipient's global deliverability status. Hard bounces,
    //    drops and spam reports suppress future sends; unsubscribes too.
    if (name === "bounce" || name === "dropped" || name === "spamreport") {
      await prisma.emailRecipient.updateMany({
        where: { email, status: EmailRecipientStatus.SUBSCRIBED },
        data: { status: EmailRecipientStatus.BOUNCED, bouncedAt: timestamp },
      });
    } else if (name === "unsubscribe" || name === "group_unsubscribe") {
      await prisma.emailRecipient.updateMany({
        where: { email, status: { not: EmailRecipientStatus.UNSUBSCRIBED } },
        data: { status: EmailRecipientStatus.UNSUBSCRIBED, unsubscribedAt: timestamp },
      });
    }
  }

  return NextResponse.json({ received: events.length });
}
