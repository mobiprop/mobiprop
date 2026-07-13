/**
 * SendGrid marketing action tests — the anti-spam safety rails.
 *
 * Covers:
 *   1. sendCampaign refuses a second send of the same campaign (atomic claim).
 *   2. Only SUBSCRIBED recipients with valid addresses are targeted.
 *   3. Send is blocked without subject/body/audience/API key, or with a
 *      non-newsletter sender.
 *   4. Test send never marks the campaign as sent.
 *   5. commitImport dedupes by email, skips invalid rows, and honours the
 *      skip-unsubscribed toggle without resubscribing anyone.
 *   6. Every action is permission-gated (403 for roles without the grant).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockLogActivity = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/activity-log", () => ({ logActivity: mockLogActivity }));

const mockDispatchNotification = vi.fn().mockResolvedValue(undefined);
vi.mock("@/features/notifications/server/notify-events", () => ({
  dispatchNotification: mockDispatchNotification,
}));

let mockGateResult: Record<string, unknown> = { ok: true, profile: { id: "admin-1", role: "ADMIN" } };
const mockRequirePermission = vi.fn(async (_permission: unknown) => mockGateResult);
vi.mock("@/lib/require-permission", () => ({
  requirePermission: (permission: unknown) => mockRequirePermission(permission),
}));

const mockSendBatches = vi.fn();
const mockSendTest = vi.fn();
let mockConfigured = true;
vi.mock("@/lib/sendgrid-marketing", () => ({
  isSendgridConfigured: () => mockConfigured,
  getSendgridConfigStatus: () => ({ apiKey: mockConfigured, webhookPublicKey: false, newsletterSender: "mailing@ulrichpropiedades.com" }),
  testSendgridConnection: vi.fn(),
  sendCampaignBatches: (...args: unknown[]) => mockSendBatches(...args),
  sendCampaignTest: (...args: unknown[]) => mockSendTest(...args),
  NEWSLETTER_FROM_EMAIL: "mailing@ulrichpropiedades.com",
  NEWSLETTER_FROM_NAME: "Ulrich Propiedades",
}));

const mockCampaign = {
  findUnique: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
  groupBy: vi.fn(),
  findFirst: vi.fn(),
};
const mockCampaignRecipient = { createMany: vi.fn(), updateMany: vi.fn() };
const mockListMember = { findMany: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() };
const mockRecipient = {
  findUnique: vi.fn(),
  findMany: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  create: vi.fn(),
  createMany: vi.fn(),
  update: vi.fn(),
  groupBy: vi.fn(),
};
const mockList = { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() };
const mockSettings = { upsert: vi.fn(), update: vi.fn() };

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailCampaign: mockCampaign,
    emailCampaignRecipient: mockCampaignRecipient,
    emailListMember: mockListMember,
    emailRecipient: mockRecipient,
    emailList: mockList,
    sendgridSettings: mockSettings,
    emailCampaignEvent: { count: vi.fn().mockResolvedValue(0) },
    contact: { findMany: vi.fn() },
    $queryRaw: vi.fn().mockResolvedValue([]),
  },
}));

const { sendCampaign, sendCampaignTestEmail, commitImport, createCampaign } = await import(
  "@/features/integrations/sendgrid-actions"
);

const DRAFT_CAMPAIGN = {
  id: "camp-1",
  campaignId: "CMP-001",
  name: "April Newsletter",
  subject: "New listings",
  previewText: null,
  htmlBody: "<p>Hello %first_name%</p>",
  fromName: "Ulrich Propiedades",
  fromEmail: "mailing@ulrichpropiedades.com",
  status: "DRAFT",
  listId: "list-1",
  scheduledAt: null,
  list: { name: "All Contacts" },
};

const SUBSCRIBED_MEMBERS = [
  { recipient: { id: "r1", email: "a@example.com", firstName: "Ana", unsubscribeToken: "tok-a" } },
  { recipient: { id: "r2", email: "b@example.com", firstName: "Ben", unsubscribeToken: "tok-b" } },
];

function defaultSettings() {
  return {
    id: "default",
    defaultFromName: "Ulrich Propiedades",
    defaultFromEmail: "mailing@ulrichpropiedades.com",
    clickTracking: true,
    openTracking: true,
    sandboxMode: false,
    lastConnectionTestAt: null,
    updatedAt: new Date(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockConfigured = true;
  mockGateResult = { ok: true, profile: { id: "admin-1", role: "ADMIN" } };
  mockSettings.upsert.mockResolvedValue(defaultSettings());
  mockCampaign.update.mockResolvedValue({});
  mockCampaignRecipient.createMany.mockResolvedValue({ count: 2 });
  mockCampaignRecipient.updateMany.mockResolvedValue({ count: 2 });
});

describe("sendCampaign duplicate-send guard", () => {
  it("rejects when the atomic DRAFT→SENDING claim fails (already sent/sending)", async () => {
    mockCampaign.findUnique.mockResolvedValue({ ...DRAFT_CAMPAIGN });
    mockListMember.findMany.mockResolvedValue(SUBSCRIBED_MEMBERS);
    // Someone else already claimed it.
    mockCampaign.updateMany.mockResolvedValue({ count: 0 });

    const result = await sendCampaign("camp-1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
      expect(result.error).toMatch(/already sent/i);
    }
    expect(mockSendBatches).not.toHaveBeenCalled();
  });

  it("sends exactly once when the claim succeeds and records SENT", async () => {
    mockCampaign.findUnique
      .mockResolvedValueOnce({ ...DRAFT_CAMPAIGN }) // sendCampaign read
      .mockResolvedValueOnce({ ...DRAFT_CAMPAIGN, status: "SENDING" }); // executeCampaignSend read
    mockListMember.findMany.mockResolvedValue(SUBSCRIBED_MEMBERS);
    mockCampaign.updateMany.mockResolvedValue({ count: 1 });
    mockSendBatches.mockResolvedValue({ sentEmails: ["a@example.com", "b@example.com"], failedEmails: [] });

    const result = await sendCampaign("camp-1");
    expect(result.ok).toBe(true);
    expect(mockSendBatches).toHaveBeenCalledTimes(1);
    // Campaign flipped to SENT with a sentAt timestamp.
    const finalUpdate = mockCampaign.update.mock.calls.at(-1)?.[0];
    expect(finalUpdate.data.status).toBe("SENT");
    expect(mockDispatchNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: "EMAIL_CAMPAIGN_SENT" }),
    );
    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "EMAIL_CAMPAIGN_SENT" }),
    );
  });
});

describe("sendCampaign readiness validation", () => {
  it.each([
    ["empty subject", { subject: "  " }, /subject/i],
    ["empty body", { htmlBody: "" }, /body/i],
    ["no audience", { listId: null }, /audience/i],
    ["non-newsletter sender", { fromEmail: "no-reply@ulrichpropiedades.com" }, /mailing@ulrichpropiedades\.com/],
  ])("blocks send with %s", async (_label, patch, message) => {
    mockCampaign.findUnique.mockResolvedValue({ ...DRAFT_CAMPAIGN, ...patch });
    mockListMember.findMany.mockResolvedValue(SUBSCRIBED_MEMBERS);

    const result = await sendCampaign("camp-1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(message);
    expect(mockSendBatches).not.toHaveBeenCalled();
  });

  it("blocks send when the SendGrid API key is missing", async () => {
    mockConfigured = false;
    mockCampaign.findUnique.mockResolvedValue({ ...DRAFT_CAMPAIGN });

    const result = await sendCampaign("camp-1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/api key/i);
  });

  it("blocks send when the audience has zero subscribed recipients", async () => {
    mockCampaign.findUnique.mockResolvedValue({ ...DRAFT_CAMPAIGN });
    mockListMember.findMany.mockResolvedValue([]);

    const result = await sendCampaign("camp-1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/no subscribed recipients/i);
  });

  it("only queries SUBSCRIBED members when resolving targets", async () => {
    mockCampaign.findUnique.mockResolvedValue({ ...DRAFT_CAMPAIGN });
    mockListMember.findMany.mockResolvedValue(SUBSCRIBED_MEMBERS);
    mockCampaign.updateMany.mockResolvedValue({ count: 0 }); // stop before real send

    await sendCampaign("camp-1");
    expect(mockListMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ recipient: { status: "SUBSCRIBED" } }),
      }),
    );
  });

  it("filters out syntactically invalid emails from the target list", async () => {
    mockCampaign.findUnique
      .mockResolvedValueOnce({ ...DRAFT_CAMPAIGN })
      .mockResolvedValueOnce({ ...DRAFT_CAMPAIGN, status: "SENDING" });
    mockListMember.findMany.mockResolvedValue([
      ...SUBSCRIBED_MEMBERS,
      { recipient: { id: "r3", email: "not-an-email", firstName: null, unsubscribeToken: "tok-c" } },
    ]);
    mockCampaign.updateMany.mockResolvedValue({ count: 1 });
    mockSendBatches.mockResolvedValue({ sentEmails: ["a@example.com", "b@example.com"], failedEmails: [] });

    await sendCampaign("camp-1");
    const targets = mockSendBatches.mock.calls[0][1] as { email: string }[];
    expect(targets.map((t) => t.email)).toEqual(["a@example.com", "b@example.com"]);
  });
});

describe("sendCampaignTestEmail", () => {
  it("sends a test without changing campaign status or recipients", async () => {
    mockCampaign.findUnique.mockResolvedValue({ ...DRAFT_CAMPAIGN });
    mockSendTest.mockResolvedValue({ sent: true });

    const result = await sendCampaignTestEmail("camp-1", ["me@example.com"]);
    expect(result.ok).toBe(true);
    expect(mockSendTest).toHaveBeenCalledTimes(1);
    expect(mockCampaign.update).not.toHaveBeenCalled();
    expect(mockCampaign.updateMany).not.toHaveBeenCalled();
    expect(mockCampaignRecipient.createMany).not.toHaveBeenCalled();
  });

  it("rejects more than 5 test addresses and invalid ones", async () => {
    const tooMany = await sendCampaignTestEmail("camp-1", [
      "a@x.com", "b@x.com", "c@x.com", "d@x.com", "e@x.com", "f@x.com",
    ]);
    expect(tooMany.ok).toBe(false);

    const invalid = await sendCampaignTestEmail("camp-1", ["not-an-email"]);
    expect(invalid.ok).toBe(false);
  });
});

describe("commitImport dedupe & unsubscribe handling", () => {
  const LIST = { id: "list-2", name: "Investors" };

  beforeEach(() => {
    mockList.findUnique.mockResolvedValue(LIST);
    mockRecipient.createMany.mockResolvedValue({ count: 1 });
    mockListMember.createMany.mockResolvedValue({ count: 2 });
  });

  it("dedupes in-file duplicates, skips invalid rows, keeps existing rows intact on 'skip'", async () => {
    // a@ exists already; b@ is new; duplicate b@ within the file collapses.
    mockRecipient.findMany
      .mockResolvedValueOnce([{ id: "r1", email: "a@example.com", status: "SUBSCRIBED" }])
      .mockResolvedValueOnce([
        { id: "r1", email: "a@example.com", status: "SUBSCRIBED" },
        { id: "r9", email: "b@example.com", status: "SUBSCRIBED" },
      ]);

    const result = await commitImport(
      "list-2",
      [
        { email: "A@Example.com " },
        { email: "b@example.com" },
        { email: "b@example.com" },
        { email: "garbage" },
      ],
      { duplicateMode: "skip", skipUnsubscribed: true, method: "csv" },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.imported).toBe(1); // only b@ was new
      expect(result.skipped).toBe(1); // a@ skipped as duplicate
      expect(result.invalid).toBe(1); // garbage
    }
    // Only the new recipient row is created.
    const created = mockRecipient.createMany.mock.calls[0][0].data as { email: string }[];
    expect(created.map((r) => r.email)).toEqual(["b@example.com"]);
    // Existing contact was not updated in skip mode.
    expect(mockRecipient.update).not.toHaveBeenCalled();
  });

  it("never resubscribes an unsubscribed contact, even when not skipping them", async () => {
    mockRecipient.findMany
      .mockResolvedValueOnce([{ id: "r5", email: "out@example.com", status: "UNSUBSCRIBED" }])
      .mockResolvedValueOnce([{ id: "r5", email: "out@example.com", status: "UNSUBSCRIBED" }]);

    const result = await commitImport(
      "list-2",
      [{ email: "out@example.com", firstName: "Opt" }],
      { duplicateMode: "update", skipUnsubscribed: false, method: "paste" },
    );

    expect(result.ok).toBe(true);
    // The update only touches profile fields — status is never written back
    // to SUBSCRIBED by an import.
    for (const call of mockRecipient.update.mock.calls) {
      expect(call[0].data).not.toHaveProperty("status");
    }
  });

  it("skips unsubscribed contacts entirely when the toggle is on", async () => {
    mockRecipient.findMany
      .mockResolvedValueOnce([{ id: "r5", email: "out@example.com", status: "UNSUBSCRIBED" }])
      .mockResolvedValueOnce([{ id: "r5", email: "out@example.com", status: "UNSUBSCRIBED" }]);

    const result = await commitImport(
      "list-2",
      [{ email: "out@example.com" }],
      { duplicateMode: "update", skipUnsubscribed: true, method: "paste" },
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.skipped).toBe(1);
    expect(mockListMember.createMany).not.toHaveBeenCalled();
  });
});

describe("RBAC gating", () => {
  it("returns 403 when the role lacks the permission", async () => {
    mockGateResult = { ok: false, error: "You don't have permission to perform this action.", reason: "forbidden" };

    for (const run of [
      () => sendCampaign("camp-1"),
      () => sendCampaignTestEmail("camp-1", ["a@x.com"]),
      () => commitImport("list-1", [{ email: "a@x.com" }], { duplicateMode: "update", skipUnsubscribed: true, method: "csv" }),
      () => createCampaign({ name: "X" }),
    ]) {
      const result = await run();
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(403);
    }
    expect(mockSendBatches).not.toHaveBeenCalled();
  });

  it("gates sending on sendgrid:send specifically", async () => {
    mockCampaign.findUnique.mockResolvedValue({ ...DRAFT_CAMPAIGN });
    mockListMember.findMany.mockResolvedValue(SUBSCRIBED_MEMBERS);
    mockCampaign.updateMany.mockResolvedValue({ count: 0 });

    await sendCampaign("camp-1");
    expect(mockRequirePermission).toHaveBeenCalledWith("sendgrid:send");
  });
});
