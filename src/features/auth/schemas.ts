import { newPasswordSchema } from "./password-policy";
import { OTP_LENGTH } from "./otp-config";
import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresá tu nombre completo"),
  email: z.string().trim().email("Ingresá un correo electrónico válido"),
  password: newPasswordSchema,
});

export const loginWithPasswordSchema = z.object({
  email: z.string().trim().email("Ingresá un correo electrónico válido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const magicLinkSchema = z.object({
  email: z.string().trim().email("Ingresá un correo electrónico válido"),
});

export const otpSchema = z.object({
  email: z.string().trim().email("Ingresá un correo electrónico válido"),
  token: z.string().regex(new RegExp(`^[0-9]{${OTP_LENGTH}}$`), `Ingresá el código de ${OTP_LENGTH} dígitos`),
  type: z.enum(["signup", "email", "recovery"]),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().email("Ingresá un correo electrónico válido"),
});

export const updatePasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string().min(8, "Confirmá tu nueva contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const acceptInvitationSchema = z
  .object({
    token: z.string().min(10, "El enlace de invitación no es válido"),
    fullName: z.string().trim().min(2, "Ingresá tu nombre completo"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirmá tu contraseña"),
    acceptedTerms: z.literal(true, {
      message: "Aceptá los términos de servicio y la política de privacidad",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type LoginWithPasswordInput = z.infer<typeof loginWithPasswordSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
