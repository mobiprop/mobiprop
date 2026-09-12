import { beforeEach, afterEach, expect, test, vi } from "vitest";
const mail = vi.hoisted(() => ({ send: vi.fn(), setApiKey: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@sendgrid/mail", () => ({ default: mail }));
import { sendTourTeamEmail } from "./email";
beforeEach(() => { vi.stubEnv("SENDGRID_API_KEY", "test-only-not-a-real-key"); mail.send.mockReset(); mail.send.mockResolvedValue([]); });
afterEach(() => vi.unstubAllEnvs());
const data = { name: "Visitor", email: "visitor@example.com", phone: "+54 9 11 8030 6000", message: "Please call <script>alert(1)</script>", tourNumber: "TUR-0001", propertyTitle: "Casa en Pilar", scheduledAtLabel: "20 de septiembre, 18:00" };
test("team receives contact-format tour details with phone and a clean subject", async () => {
  expect(await sendTourTeamEmail(data)).toEqual({ sent: true });
  const message = mail.send.mock.calls[0][0];
  expect(message).toMatchObject({ to: "hola@mobiprop.com.ar", replyTo: "visitor@example.com", subject: "Nueva solicitud de visita TUR-0001" });
  for (const value of [data.phone, data.propertyTitle, data.scheduledAtLabel, data.tourNumber]) expect(message.html).toContain(value);
  expect(message.html).not.toContain("<script>");
});
test("a phone-only request still notifies the team", async () => {
  expect(await sendTourTeamEmail({ ...data, email: "" })).toEqual({ sent: true });
  expect(mail.send.mock.calls[0][0].to).toBe("hola@mobiprop.com.ar");
});
