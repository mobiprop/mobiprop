import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Mark a push subscription inactive after a permanent provider error (404/410)
 * or repeated failures. Delivery history is retained for audit. Best-effort —
 * never throws into the delivery path.
 */
export async function deactivateSubscription(
  subscriptionId: string,
  reason: string,
): Promise<void> {
  try {
    await prisma.pushSubscription.update({
      where: { id: subscriptionId },
      data: { isActive: false, lastFailureAt: new Date() },
    });
    console.warn("[push] subscription deactivated", { subscriptionId, reason });
  } catch (error) {
    console.error("[push] failed to deactivate subscription", { subscriptionId, error });
  }
}
