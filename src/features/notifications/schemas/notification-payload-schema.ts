import { z } from "zod";

import { isInternalUrl } from "@/features/notifications/utils/is-internal-url";

/**
 * Validates the encrypted Web Push payload before it leaves the server. Enforces
 * length limits (push services cap payloads near 4KB) and same-origin URLs, and
 * keeps sensitive PII out of the body by construction at the call site.
 */
export const webPushPayloadSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(400),
  icon: z.string().optional(),
  badge: z.string().optional(),
  url: z.string().refine(isInternalUrl, "URL must be a same-origin internal path"),
  tag: z.string().max(120).optional(),
  notificationId: z.string().min(1),
});

export type WebPushPayloadInput = z.infer<typeof webPushPayloadSchema>;
