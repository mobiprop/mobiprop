import { describe, expect, it } from "vitest";
import { newPasswordSchema, passwordAuthError } from "./password-policy";
import { signUpSchema, updatePasswordSchema, loginWithPasswordSchema } from "./schemas";

describe("public password policy", () => {
  it.each(["Aa1!", "abcdefgh1!", "ABCDEFGH1!", "Abcdefgh!", "Abcdefgh1", "Abcdefg1 ", "Abcdefg1é"])("rejects missing requirements: %s", password => {
    expect(newPasswordSchema.safeParse(password).success).toBe(false);
  });
  it("applies the same policy to signup and reset, preserving existing login credentials", () => {
    const password = "LongPassword1!";
    expect(signUpSchema.safeParse({fullName: "Test User", email: "test@example.com", password}).success).toBe(true);
    expect(updatePasswordSchema.safeParse({password, confirmPassword: password}).success).toBe(true);
    expect(updatePasswordSchema.safeParse({password, confirmPassword: "OtherPassword1!"}).success).toBe(false);
    expect(loginWithPasswordSchema.safeParse({email: "test@example.com", password: "old-password"}).success).toBe(true);
  });
  it("keeps unknown provider errors generic and gives actionable known errors", () => {
    expect(passwordAuthError({code: "database_error"})).toBe(passwordAuthError({code: "user_already_exists"}));
    expect(passwordAuthError({code: "weak_password"})).toContain("mayúscula");
    expect(passwordAuthError({code: "same_password"})).toContain("diferente");
    expect(passwordAuthError({code: "over_email_send_rate_limit"})).toContain("Esperá");
  });
});
