import { z } from "zod";

// Admin-only: create an AGENT, MANAGER, or ADMIN invitation. USER can never be
// invited through this schema. Inviting an ADMIN additionally requires the
// invitations:inviteAdmin permission — enforced in createAgentInvitation, not here.
export const createInvitationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  role: z.enum(["AGENT", "MANAGER", "ADMIN"]),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
  teamLeaderId: z.string().guid().optional(),
});

export const validateInvitationSchema = z.object({
  token: z.string().min(10, "Invalid invitation link"),
});

// Completes invite-based staff registration. Role/email come from the
// invitation only — never from this input.
export const acceptInvitationApiSchema = z
  .object({
    token: z.string().min(10, "Invalid invitation link"),
    firstName: z.string().trim().min(1, "Enter your first name"),
    lastName: z.string().trim().min(1, "Enter your last name"),
    phone: z.string().trim().min(1).optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type ValidateInvitationInput = z.infer<typeof validateInvitationSchema>;
export type AcceptInvitationApiInput = z.infer<typeof acceptInvitationApiSchema>;
