import "server-only";

import { prisma } from "@/lib/prisma";
import { ContractStatus, ContractType } from "@/generated/prisma/enums";
import { notifyContractExpiring } from "@/features/notifications/server/notify-events";

const EXPIRY_WINDOW_DAYS = 60;

/**
 * Daily check (driven by /api/cron/contract-expiry): rental contracts whose
 * end date falls within the next 60 days get a single CONTRACT_EXPIRING
 * notification — a single threshold per the 2026-06-26 client decision (no
 * second closer-to-expiry reminder unless later requested). `expiryNotifiedAt`
 * makes this idempotent, so re-running the cron the same day is a no-op.
 */
export async function checkExpiringContracts(): Promise<{ notified: number }> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + EXPIRY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const contracts = await prisma.contract.findMany({
    where: {
      isDeleted: false,
      status: ContractStatus.ACTIVE,
      type: { in: [ContractType.RENT, ContractType.SALE_AND_RENT] },
      endDate: { not: null, gte: now, lte: windowEnd },
      expiryNotifiedAt: null,
    },
    select: { id: true, title: true, endDate: true, assignedAgentId: true },
  });

  for (const contract of contracts) {
    if (!contract.endDate) continue;
    await notifyContractExpiring({
      contractId: contract.id,
      title: contract.title,
      endDate: contract.endDate,
      assignedAgentId: contract.assignedAgentId,
    });
    await prisma.contract.update({ where: { id: contract.id }, data: { expiryNotifiedAt: now } });
  }

  return { notified: contracts.length };
}
