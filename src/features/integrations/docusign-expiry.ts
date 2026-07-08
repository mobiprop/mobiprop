import "server-only";

import { prisma } from "@/lib/prisma";
import { EnvelopeStatus } from "@/generated/prisma/enums";
import { resendEnvelope } from "@/lib/docusign";
import { notifyEnvelopeExpiringSoon } from "@/features/notifications/server/notify-events";

/**
 * Daily check (driven by /api/cron/docusign-reminders): envelopes still
 * awaiting signature whose expiry falls inside the configured reminder
 * window get a DocuSign resend + a DOCUSIGN_ENVELOPE_EXPIRING_SOON
 * notification. `reminderSentAt` makes this idempotent — re-running the
 * cron the same day is a no-op. Mirrors checkExpiringContracts, replacing
 * the contract-expiry cron this module supersedes.
 */
export async function checkExpiringEnvelopes(): Promise<{ notified: number }> {
  const settings = await prisma.docusignSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
  if (!settings.autoSendReminders) return { notified: 0 };

  const now = new Date();
  const windowEnd = new Date(now.getTime() + settings.autoReminderDays * 24 * 60 * 60 * 1000);

  const envelopes = await prisma.docusignEnvelope.findMany({
    where: {
      status: { in: [EnvelopeStatus.SENT, EnvelopeStatus.DELIVERED] },
      expiresAt: { not: null, gte: now, lte: windowEnd },
      reminderSentAt: null,
    },
    include: { opportunity: { select: { assignedAgentId: true } } },
  });

  let notified = 0;
  for (const envelope of envelopes) {
    if (!envelope.expiresAt) continue;
    try {
      await resendEnvelope(envelope.docusignEnvelopeId);
    } catch (error) {
      console.error("[docusign-expiry] failed to resend envelope", envelope.id, error);
      continue; // Don't mark reminded if the resend itself failed — retry tomorrow.
    }

    await notifyEnvelopeExpiringSoon({
      envelopeId: envelope.id,
      templateName: envelope.templateName,
      expiresAt: envelope.expiresAt,
      assignedAgentId: envelope.sentById ?? envelope.opportunity?.assignedAgentId ?? null,
    });
    await prisma.docusignEnvelope.update({ where: { id: envelope.id }, data: { reminderSentAt: now } });
    notified += 1;
  }

  return { notified };
}
