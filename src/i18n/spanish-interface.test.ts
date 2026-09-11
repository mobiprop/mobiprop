import { describe, expect, it } from "vitest";
import { resolvePreferences } from "@/features/profile/preferences";
import { isSupportedLanguage } from "./config";
import i18n, { syncSiteLanguageFromPreference } from "./client";
import { spanishValidationMessage } from "./form-validation";

describe("Spanish interface", () => {
  it.each(["en", "en-US", "es-AR", "pt-BR"])("normalizes saved %s account preferences", (language) => {
    expect(resolvePreferences({ preferences: { locale: { language } } }).locale.language).toBe("es");
    syncSiteLanguageFromPreference(language);
    expect(i18n.language).toBe("es");
    expect(i18n.t("navigation:home")).toBe("Inicio");
  });

  it("defaults new accounts to Spanish and rejects legacy English cookies", () => {
    expect(resolvePreferences({ preferences: null }).locale.language).toBe("es");
    expect(isSupportedLanguage("en")).toBe(false);
  });

  it("does not display English even when a caller requests English", async () => {
    const instance = i18n.cloneInstance();
    await instance.changeLanguage("en");
    expect(instance.t("navigation:home")).toBe("Inicio");
  });

  it.each([
    [{ valueMissing: true }, "text", "Completá este campo para continuar."],
    [{ valueMissing: true }, "checkbox", "Marcá esta casilla para continuar."],
    [{ typeMismatch: true }, "email", "Ingresá un correo electrónico válido."],
    [{ patternMismatch: true }, "text", "Usá el formato indicado para este campo."],
  ])("provides Spanish native validation feedback", (validity, type, message) => {
    expect(spanishValidationMessage(validity as ValidityState, type)).toBe(message);
  });
});
