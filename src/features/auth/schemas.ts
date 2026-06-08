import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginWithPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const magicLinkSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const otpSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  token: z.string().length(6, "Enter the 6-digit code"),
  type: z.enum(["signup", "email", "recovery"]),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const acceptInvitationSchema = z
  .object({
    token: z.string().min(10, "Invalid invitation link"),
    fullName: z.string().trim().min(2, "Enter your full name"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
    acceptedTerms: z.literal(true, {
      message: "You must accept the Terms of Service and Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type LoginWithPasswordInput = z.infer<typeof loginWithPasswordSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
