"use client";

import { useEffect } from "react";
import { spanishValidationMessage } from "@/i18n/form-validation";

export function SpanishFormValidation() {
  useEffect(() => {
    type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const localized = new Set<Control>();
    const isControl = (target: EventTarget | null): target is Control =>
      target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
    const onInvalid = (event: Event) => {
      const control = event.target;
      if (!isControl(control)) return;
      // Preserve messages supplied by a form's own business validation.
      if (control.validity.customError && !localized.has(control)) return;
      control.setCustomValidity("");
      if (control.validity.valid) return;
      control.setCustomValidity(spanishValidationMessage(control.validity, control.type));
      localized.add(control);
    };
    const onEdit = (event: Event) => {
      const control = event.target;
      if (isControl(control) && localized.has(control)) {
        control.setCustomValidity("");
        localized.delete(control);
      }
    };
    const onReset = (event: Event) => {
      for (const control of localized) {
        if (control.form === event.target) {
          control.setCustomValidity("");
          localized.delete(control);
        }
      }
    };
    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onEdit, true);
    document.addEventListener("change", onEdit, true);
    document.addEventListener("reset", onReset, true);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onEdit, true);
      document.removeEventListener("change", onEdit, true);
      document.removeEventListener("reset", onReset, true);
      for (const control of localized) control.setCustomValidity("");
    };
  }, []);
  return null;
}
