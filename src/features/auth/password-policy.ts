import { z } from "zod";

export const PASSWORD_REQUIREMENTS = "Usá al menos 8 caracteres, una mayúscula (A–Z), una minúscula (a–z), un número y un símbolo (por ejemplo, !, @ o #).";
export const newPasswordSchema = z.string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .regex(/[a-z]/, "Agregá al menos una letra minúscula (a–z).")
  .regex(/[A-Z]/, "Agregá al menos una letra mayúscula (A–Z).")
  .regex(/[0-9]/, "Agregá al menos un número.")
  .regex(/[!-/:-@\[-`{-~]/, "Agregá al menos un símbolo, como !, @ o #. Los espacios no cuentan como símbolos.");

export function passwordAuthError(error: { code?: string }): string {
  switch (error.code) {
    case "weak_password": return "La contraseña no cumple los requisitos de seguridad o es demasiado fácil de adivinar. " + PASSWORD_REQUIREMENTS;
    case "same_password": return "Elegí una contraseña diferente de la actual.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit": return "Realizaste demasiados intentos. Esperá unos instantes antes de volver a intentar.";
    case "email_address_invalid": return "Ingresá un correo electrónico válido.";
    case "session_not_found":
    case "session_expired": return "La sesión venció. Solicitá un nuevo correo para restablecer tu contraseña.";
    default: return "No pudimos completar la solicitud. Volvé a intentar. Si ya tenés una cuenta, podés iniciar sesión o recuperar tu contraseña.";
  }
}
