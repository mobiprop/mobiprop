import { expect, test } from "vitest";
import { spanishNotification } from "@/features/notifications/utils/spanish-notification";
import { updateContactSchema } from "@/schemas/contact.schema";

test("existing and newly created system notifications translate consistently", () => {
  const translated = spanishNotification("New tour request", "A customer requested a property visit.");
  expect(translated).toEqual({ title: "Nueva solicitud de visita", body: "Un cliente solicitó una visita a una propiedad." });
  expect(spanishNotification(translated.title, translated.body)).toEqual(translated);
  expect(spanishNotification("Unassigned lead needs attention", "A new lead came in with no agent to assign — please assign it manually.").body).toContain("Asignalo manualmente");
});
test("notification translations preserve names, property titles and customer messages", () => {
  expect(spanishNotification("Listing status changed", 'Matias changed "Casa en Pilar" (LST-0001) to SOLD.').body).toBe('Matias cambió "Casa en Pilar" (LST-0001) a Vendido.');
  expect(spanishNotification("Message from Jane", "Please call me")).toEqual({ title: "Mensaje de Jane", body: "Please call me" });
  expect(spanishNotification("Custom", "Custom message")).toEqual({ title: "Custom", body: "Custom message" });
});
test("contact linking deduplicates property IDs and omitted links stay untouched", () => {
  expect(updateContactSchema.parse({ propertyIds: ["listing-1", "listing-1", "listing-2"] }).propertyIds).toEqual(["listing-1", "listing-2"]);
  expect(updateContactSchema.parse({ firstName: "Sergio" })).not.toHaveProperty("propertyIds");
  expect(updateContactSchema.parse({ propertyIds: [] }).propertyIds).toEqual([]);
});
