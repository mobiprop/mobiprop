import { describe, expect, it } from "vitest";
import { resolveAppUrl } from "./app-url";
describe("production email origin", () => {
  it.each([undefined, "http://localhost:3000", "https://localhost:3000", "http://127.0.0.1:3000", "https://[::1]", "not-a-url", "javascript:alert(1)"])("never sends production emails to %s", (value) => {
    expect(resolveAppUrl(value, true)).toBe("https://mobi-prop.vercel.app");
  });
  it("uses the configured production origin", () => expect(resolveAppUrl("https://mobiprop.com.ar/", true)).toBe("https://mobiprop.com.ar"));
  it("keeps local development available", () => expect(resolveAppUrl("http://localhost:3001", false)).toBe("http://localhost:3001"));
});
