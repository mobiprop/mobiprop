import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

import { EnvelopeStatus } from "@/generated/prisma/enums";
import { applyEnvelopeWebhookEvent } from "@/features/integrations/docusign-actions";

export const runtime = "nodejs";

/**
 * DocuSign Connect webhook receiver — configure this URL (see the DocuSign
 * page's Settings tab) as the Connect endpoint, with HMAC signing enabled
 * using DOCUSIGN_CONNECT_HMAC_KEY as the shared secret.
 *
 * Security: the HMAC signature is verified BEFORE any DB write, and a
 * missing/invalid signature is rejected outright — this endpoint is public
 * (DocuSign calls it unauthenticated over HTTPS), so the signature is the
 * only proof a payload really came from DocuSign.
 *
 * Idempotency: DocuSign redelivers events on a non-2xx or slow response.
 * applyEnvelopeWebhookEvent dedupes by an event key derived from
 * (event, envelopeId, status) and only ever advances status forward, so a
 * redelivered or out-of-order event is a safe no-op.
 */

type ConnectSigner = { name?: string; email?: string; status?: string };
type ConnectPayload = {
  event?: string;
  data?: {
    envelopeId?: string;
    envelopeSummary?: {
      status?: string;
      recipients?: { signers?: ConnectSigner[] };
    };
  };
};

function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(header);
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

/** Maps a DocuSign Connect event name to our status enum, or null for events we don't track. */
function mapEventToStatus(event: string): EnvelopeStatus | null {
  const normalized = event.toLowerCase().replace(/_/g, "-");
  if (normalized.includes("completed")) return EnvelopeStatus.COMPLETED;
  if (normalized.includes("declined")) return EnvelopeStatus.DECLINED;
  if (normalized.includes("voided")) return EnvelopeStatus.VOIDED;
  if (normalized.includes("delivered") || normalized.includes("viewed")) return EnvelopeStatus.DELIVERED;
  if (normalized.includes("sent")) return EnvelopeStatus.SENT;
  return null;
}

export async function POST(req: Request) {
  const secret = process.env.DOCUSIGN_CONNECT_HMAC_KEY;
  if (!secret) {
    console.error("[docusign-webhook] DOCUSIGN_CONNECT_HMAC_KEY is not configured — rejecting all webhook calls.");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-docusign-signature-1");
  if (!verifySignature(rawBody, signatureHeader, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: ConnectPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const event = payload.event;
  const envelopeId = payload.data?.envelopeId;
  const rawStatus = payload.data?.envelopeSummary?.status;
  if (!event || !envelopeId || !rawStatus) {
    // Malformed/unexpected payload shape — acknowledge so DocuSign doesn't
    // retry forever, but do nothing.
    return NextResponse.json({ ok: true, skipped: "incomplete payload" });
  }

  const status = mapEventToStatus(event) ?? mapEventToStatus(rawStatus);
  if (!status) {
    return NextResponse.json({ ok: true, skipped: "unhandled event" });
  }

  const signer = payload.data?.envelopeSummary?.recipients?.signers?.[0];

  try {
    await applyEnvelopeWebhookEvent({
      docusignEnvelopeId: envelopeId,
      eventKey: `${event}:${envelopeId}:${status}`,
      status,
      recipientName: signer?.name,
    });
  } catch (error) {
    console.error("[docusign-webhook] failed to apply event", error);
    // Still acknowledge — retrying won't fix a bug on our side, and we don't
    // want DocuSign hammering the endpoint indefinitely.
  }

  return NextResponse.json({ ok: true });
}
