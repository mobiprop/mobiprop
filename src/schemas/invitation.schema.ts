import { z } from "zod";

// Admin-only: create an AGENT, MANAGER, or ADMIN invitation. USER can never be
// invited through this schema. Inviting an ADMIN additionally requires the
// invitations:inviteAdmin permission — enforced in createAgentInvitation, not here.
export const createInvitationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ingresá un correo electrónico válido"),
  role: z.enum(["AGENT", "MANAGER", "ADMIN"]),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
  teamLeaderId: z.string().guid().optional(),
});

export const validateInvitationSchema = z.object({
  token: z.string().min(10, "El enlace de invitación no es válido"),
});

// Completes invite-based staff registration. Role/email come from the
// invitation only — never from this input.
export const acceptInvitationApiSchema = z
  .object({
    token: z.string().min(10, "El enlace de invitación no es válido"),
    firstName: z.string().trim().min(1, "Ingresá tu nombre"),
    lastName: z.string().trim().min(1, "Ingresá tu apellido"),
    phone: z.string().trim().min(1).optional(),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirmá tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type ValidateInvitationInput = z.infer<typeof validateInvitationSchema>;
export type AcceptInvitationApiInput = z.infer<typeof acceptInvitationApiSchema>;
