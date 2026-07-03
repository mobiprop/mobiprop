import { z } from "zod";

export const sendMessageSchema = z
  .object({
    body: z.string().trim().max(4000).optional().default(""),
    attachments: z
      .array(
        z.object({
          storagePath: z.string().min(1),
          fileName: z.string().min(1).max(255),
        }),
      )
      .max(6)
      .optional()
      .default([]),
  })
  .refine((data) => data.body.length > 0 || data.attachments.length > 0, {
    message: "A message needs text or at least one attachment.",
  });

export const attachmentUploadTicketRequestSchema = z.object({
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        type: z.string().min(1),
      }),
    )
    .min(1)
    .max(6),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type AttachmentUploadTicketRequestInput = z.infer<typeof attachmentUploadTicketRequestSchema>;
