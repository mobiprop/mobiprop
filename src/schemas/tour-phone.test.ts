import { expect, test } from "vitest";
import { requestTourSchema, createTourSchema } from "./tour.schema";
const request = { submittedName: "Visitor", submittedEmail: "visitor@example.com", scheduledAt: "2026-09-20T18:00:00-03:00" };
test("public requests require a usable phone even when an email is supplied", () => {
  for (const submittedPhone of [undefined, "", "   ", "123", "abcdefgh"]) {
    expect(requestTourSchema.safeParse({ ...request, submittedPhone }).success).toBe(false);
  }
  expect(requestTourSchema.parse({ ...request, submittedPhone: " +54 9 11 8030 6000 " }).submittedPhone).toBe("+54 9 11 8030 6000");
});
test("staff booking rules remain unchanged", () => {
  expect(createTourSchema.safeParse(request).success).toBe(true);
});
