import { z } from "zod";

/**
 * Body of POST /api/push/subscriptions — the JSON shape produced by the browser
 * `PushSubscription.toJSON()`, plus an optional human-readable device label.
 * The `userId` is intentionally NOT accepted from the client; it is always
 * derived from the authenticated session.
 */
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("Invalid endpoint").max(2048),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1, "Missing p256dh key").max(512),
    auth: z.string().min(1, "Missing auth key").max(512),
  }),
  deviceLabel: z.string().max(120).optional(),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

/** Body of DELETE /api/push/subscriptions — disable one device by endpoint. */
export const deletePushSubscriptionSchema = z.object({
  endpoint: z.string().url("Invalid endpoint").max(2048),
});

export type DeletePushSubscriptionInput = z.infer<typeof deletePushSubscriptionSchema>;
