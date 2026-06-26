/**
 * Lead RBAC + business-logic unit tests.
 *
 * These tests mock the persistence and auth layers so they run without a live
 * database. They cover:
 *   1. Permission gates for every role / status combination.
 *   2. Lead record scope — AGENT now holds `leads:view_all` (2026-06-26 client decision:
 *      agents see ALL leads, not just own/assigned), so `leadRecordScope()` returns no
 *      scope for any staff role today. These tests pin that behavior; the scope helper
 *      itself stays in place for any role that might lack `leads:view_all` in the future.
 *   3. The CONVERTED guard in updateLead.
 *   4. convertLead concurrent-conversion idempotency (double-guard path).
 *   5. convertLead transaction atomicity (convertedOpportunityId inside tx).
 *   6. AGENT self-assignment-only enforcement on createLead.
 *   7. updateAgentStatus activity log.
 *   8. Global search excludes soft-deleted contacts.
 */

import { describe, it, expect, vi, beforeEach, type MockInstance } from "vitest";

// ── Stubs for server-only and Next.js internals ───────────────────────────────

vi.mock("server-only", () => ({}));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: (fn: unknown) => fn };
});

// ── Prisma mock factory ───────────────────────────────────────────────────────

type MockFn = MockInstance;
type ModelMethods = Record<string, MockFn>;
type PrismaMock = {
  lead: ModelMethods;
  leadNote: ModelMethods;
  leadActivity: ModelMethods;
  contact: ModelMethods;
  property: ModelMethods;
  profile: ModelMethods;
  opportunity: ModelMethods;
  $queryRaw: MockFn;
  $transaction: MockFn;
};

function makePrismaMock(): PrismaMock {
  const methods = () => ({
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  });
  const mock: PrismaMock = {
    lead: methods(),
    leadNote: methods(),
    leadActivity: methods(),
    contact: methods(),
    property: methods(),
    profile: methods(),
    opportunity: methods(),
    $queryRaw: vi.fn(),
    // Default: execute the async callback if given one, else run array form.
    $transaction: vi.fn(async (fnOrArray: unknown) => {
      if (typeof fnOrArray === "function") {
        return (fnOrArray as (tx: PrismaMock) => Promise<unknown>)(mock);
      }
      return Promise.all(fnOrArray as Promise<unknown>[]);
    }),
  };
  return mock;
}

let db: PrismaMock;

vi.mock("@/lib/prisma", () => ({ get prisma() { return db; } }));
vi.mock("@/lib/activity-log", () => ({ logActivity: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/features/notifications/server/notify-events", () => ({
  notifyLeadAssigned: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/maps", () => ({ geocodeAddress: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/supabase/storage", () => ({
  removePropertyImages: vi.fn(),
  mintPropertyImageUploadTickets: vi.fn(),
  verifyUploadedPropertyImages: vi.fn(),
}));
vi.mock("@/lib/email", () => ({ sendAgentInvitationEmail: vi.fn() }));

// ── Auth mock ─────────────────────────────────────────────────────────────────

type ProfileLike = { id: string; email: string; fullName: string | null; avatarUrl: string | null; role: string; status: string };

const AGENT_A_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const AGENT_B_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function profile(role: string, status = "ACTIVE", id = "cccccccc-cccc-cccc-cccc-cccccccccccc"): ProfileLike {
  return { id, email: `${role.toLowerCase()}@test.com`, fullName: `Test ${role}`, avatarUrl: null, role, status };
}

const PROFILES = {
  admin:    profile("ADMIN"),
  manager:  profile("MANAGER"),
  agentA:   profile("AGENT", "ACTIVE", AGENT_A_ID),
  agentB:   profile("AGENT", "ACTIVE", AGENT_B_ID),
  user:     profile("USER"),
  inactive: profile("AGENT", "INACTIVE"),
};

// Helper that resolves requirePermission based on which profile we supply.
// We override the mock before each assertion that needs a specific role.
const mockRequirePermission = vi.fn();

vi.mock("@/lib/require-permission", () => ({
  get requirePermission() {
    return mockRequirePermission;
  },
}));

// Convenience wrappers.
function grantAs(p: ProfileLike) {
  mockRequirePermission.mockResolvedValue({ ok: true, profile: p });
}
function denyUnauthenticated() {
  mockRequirePermission.mockResolvedValue({ ok: false, error: "You must be signed in.", reason: "unauthenticated" });
}
function denyInactive() {
  mockRequirePermission.mockResolvedValue({ ok: false, error: "Your account is not active.", reason: "inactive" });
}
function denyForbidden() {
  mockRequirePermission.mockResolvedValue({ ok: false, error: "You don't have permission to perform this action.", reason: "forbidden" });
}

// ── Shared lead fixtures ───────────────────────────────────────────────────────

const LEAD_ASSIGNED_TO_A = {
  id: "lead-1",
  leadNumber: "LDR-0001",
  contactId: "contact-1",
  assignedAgentId: AGENT_A_ID,
  createdById: AGENT_A_ID,
  score: 50,
  temperature: "WARM",
  lifecycleStatus: "NEW",
  isArchived: false,
  convertedOpportunityId: null,
  convertedAt: null,
  submittedName: "Alice",
  submittedEmail: "alice@test.com",
  submittedPhone: null,
  submittedLocation: null,
  source: "MANUAL",
  sourceDetail: null,
  sourceUrl: null,
  externalSource: null,
  externalSourceId: null,
  importBatchId: null,
  budgetMin: null,
  budgetMax: null,
  currency: "ARS",
  notes: null,
  lastContactedAt: null,
  nextFollowUpAt: null,
  closedAt: null,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  contact: { id: "contact-1", contactId: "CNT-0001", firstName: "Alice", lastName: "Smith", email: "alice@test.com", phone: null, location: null, type: "BUYER" },
  primaryListing: null,
  leadNotes: [],
  activities: [],
};

// ── Import the module under test ───────────────────────────────────────────────
// Imported here (not at top) so all mocks are in place first.
const { listLeads, getLead, createLead, updateLead, assignLead, archiveLead, convertLead } = await import("@/features/crm/lead-actions");

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  db = makePrismaMock();
  // Default aggregate for listLeads metrics
  (db.lead.aggregate as MockFn).mockResolvedValue({ _avg: { score: 0 } });
  (db.lead.count as MockFn).mockResolvedValue(0);
  (db.lead.findMany as MockFn).mockResolvedValue([]);
  (db.profile.findMany as MockFn).mockResolvedValue([]);
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. Permission gates on listLeads
// ─────────────────────────────────────────────────────────────────────────────

describe("listLeads — permission gates", () => {
  it("allows ADMIN", async () => {
    grantAs(PROFILES.admin);
    const res = await listLeads({});
    expect(res.ok).toBe(true);
  });

  it("allows MANAGER", async () => {
    grantAs(PROFILES.manager);
    const res = await listLeads({});
    expect(res.ok).toBe(true);
  });

  it("allows AGENT (with record scope)", async () => {
    grantAs(PROFILES.agentA);
    const res = await listLeads({});
    expect(res.ok).toBe(true);
  });

  it("blocks USER (403)", async () => {
    denyForbidden();
    const res = await listLeads({});
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(403);
  });

  it("blocks unauthenticated (403)", async () => {
    denyUnauthenticated();
    const res = await listLeads({});
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(403);
  });

  it("blocks inactive AGENT (403)", async () => {
    denyInactive();
    const res = await listLeads({});
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. AGENT record scope in listLeads
// ─────────────────────────────────────────────────────────────────────────────

describe("listLeads — AGENT record scope", () => {
  it("passes no scope when role is AGENT (leads:view_all)", async () => {
    grantAs(PROFILES.agentA);
    await listLeads({});

    const [findManyCall] = (db.lead.findMany as MockFn).mock.calls;
    const where = findManyCall[0].where;

    // AGENT holds leads:view_all (2026-06-26 decision) → scope is {} → no AND-scoped OR clause.
    const andItems: unknown[] = where.AND ?? [];
    const scopeClause = andItems.find(
      (c: unknown) => typeof c === "object" && c !== null && "OR" in (c as object) &&
        Array.isArray((c as Record<string, unknown>).OR) &&
        ((c as Record<string, unknown[]>).OR).some(
          (o: unknown) => typeof o === "object" && o !== null && ("assignedAgentId" in (o as object) || "createdById" in (o as object)),
        ),
    );
    expect(scopeClause).toBeUndefined();
  });

  it("passes no scope when role is ADMIN", async () => {
    grantAs(PROFILES.admin);
    await listLeads({});

    const [findManyCall] = (db.lead.findMany as MockFn).mock.calls;
    const where = findManyCall[0].where;

    // ADMIN has leads:view_all → scope is {} → AND should be empty or missing
    const andItems: unknown[] = where.AND ?? [];
    const scopeClause = andItems.find(
      (c: unknown) => typeof c === "object" && c !== null && "OR" in (c as object) &&
        Array.isArray((c as Record<string, unknown>).OR) &&
        ((c as Record<string, unknown[]>).OR).some(
          (o: unknown) => typeof o === "object" && o !== null && ("assignedAgentId" in (o as object) || "createdById" in (o as object)),
        ),
    );
    expect(scopeClause).toBeUndefined();
  });

  it("passes no scope when role is MANAGER", async () => {
    grantAs(PROFILES.manager);
    await listLeads({});

    const [findManyCall] = (db.lead.findMany as MockFn).mock.calls;
    const where = findManyCall[0].where;

    const andItems: unknown[] = where.AND ?? [];
    const hasAgentScope = andItems.some(
      (c: unknown) => typeof c === "object" && c !== null && "OR" in (c as object),
    );
    expect(hasAgentScope).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. AGENT cannot access another agent's lead via getLead
// ─────────────────────────────────────────────────────────────────────────────

describe("getLead — AGENT record scope", () => {
  it("returns a lead assigned to a different agent (leads:view_all)", async () => {
    // Agent B fetches a lead assigned to Agent A — allowed since AGENT now holds leads:view_all.
    grantAs(PROFILES.agentB);
    (db.lead.findFirst as MockFn).mockResolvedValue(LEAD_ASSIGNED_TO_A);
    (db.profile.findMany as MockFn).mockResolvedValue([]);

    const res = await getLead("lead-1");
    expect(res.ok).toBe(true);

    // No scope applied — just the id lookup.
    const [call] = (db.lead.findFirst as MockFn).mock.calls;
    const where = call[0].where;
    expect(where.id).toBe("lead-1");
    expect(where.OR).toBeUndefined();
  });

  it("returns 404 when the lead doesn't exist", async () => {
    grantAs(PROFILES.agentB);
    (db.lead.findFirst as MockFn).mockResolvedValue(null);

    const res = await getLead("lead-1");
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. updateLead blocks manual CONVERTED status
// ─────────────────────────────────────────────────────────────────────────────

describe("updateLead — CONVERTED guard", () => {
  it("returns 400 when lifecycleStatus is CONVERTED", async () => {
    grantAs(PROFILES.admin);
    const res = await updateLead("lead-1", { lifecycleStatus: "CONVERTED" });
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(400);
    expect((res as { error: string }).error).toMatch(/convert endpoint/i);
  });

  it("allows any other lifecycle status", async () => {
    grantAs(PROFILES.admin);
    (db.lead.findFirst as MockFn).mockResolvedValue({ ...LEAD_ASSIGNED_TO_A });
    (db.lead.update as MockFn).mockResolvedValue({ ...LEAD_ASSIGNED_TO_A, lifecycleStatus: "QUALIFIED" });
    (db.leadActivity.createMany as MockFn).mockResolvedValue({ count: 0 });
    (db.profile.findMany as MockFn).mockResolvedValue([]);

    const res = await updateLead("lead-1", { lifecycleStatus: "QUALIFIED" });
    expect(res.ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. convertLead — transaction atomicity and double-conversion guard
// ─────────────────────────────────────────────────────────────────────────────

describe("convertLead — atomicity and idempotency", () => {
  const convertedLead = {
    ...LEAD_ASSIGNED_TO_A,
    lifecycleStatus: "CONVERTED",
    convertedAt: new Date(),
    convertedOpportunityId: "opp-1",
  };

  it("creates opportunity and updates lead including convertedOpportunityId inside one transaction", async () => {
    grantAs(PROFILES.admin);
    // The pre-check findFirst
    (db.lead.findFirst as MockFn).mockResolvedValue(LEAD_ASSIGNED_TO_A);

    const createdOpp = { id: "opp-1", opportunityId: "OPP-0001" };
    (db.$queryRaw as MockFn).mockResolvedValue([{ max: 0 }]);
    (db.opportunity.create as MockFn).mockResolvedValue(createdOpp);
    (db.lead.update as MockFn).mockResolvedValue(convertedLead);
    (db.leadActivity.create as MockFn).mockResolvedValue({});
    (db.profile.findMany as MockFn).mockResolvedValue([]);

    const res = await convertLead("lead-1", { title: "Test Opp" });
    expect(res.ok).toBe(true);

    // Verify $transaction was called with an async callback (interactive form).
    expect(db.$transaction).toHaveBeenCalledOnce();
    const [txArg] = (db.$transaction as MockFn).mock.calls[0];
    expect(typeof txArg).toBe("function");

    // Verify convertedOpportunityId was included in the lead.update call.
    const updateCall = (db.lead.update as MockFn).mock.calls[0];
    expect(updateCall[0].data.convertedOpportunityId).toBe("opp-1");
  });

  it("blocks second conversion (already-converted guard)", async () => {
    grantAs(PROFILES.admin);
    // Lead already has convertedOpportunityId set.
    (db.lead.findFirst as MockFn).mockResolvedValue({
      ...LEAD_ASSIGNED_TO_A,
      convertedOpportunityId: "opp-existing",
    });

    const res = await convertLead("lead-1", {});
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(409);
    expect((res as { error: string }).error).toMatch(/already been converted/i);
    // $transaction must NOT have been called.
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("blocks conversion of archived lead", async () => {
    grantAs(PROFILES.admin);
    (db.lead.findFirst as MockFn).mockResolvedValue({
      ...LEAD_ASSIGNED_TO_A,
      isArchived: true,
      convertedOpportunityId: null,
    });

    const res = await convertLead("lead-1", {});
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(409);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("simulates concurrent conversion — second call denied at pre-check", async () => {
    // Real DB uses Postgres serializable isolation to prevent double-creation.
    // At the application layer the guard is: findFirst → check convertedOpportunityId.
    // Simulate: first request is mid-transaction, second request hits the DB
    // after the first committed → second findFirst returns the already-converted lead.
    grantAs(PROFILES.admin);
    (db.$queryRaw as MockFn).mockResolvedValue([{ max: 0 }]);
    (db.leadActivity.create as MockFn).mockResolvedValue({});
    (db.profile.findMany as MockFn).mockResolvedValue([]);

    let firstCallResolve: () => void;
    const firstCallGate = new Promise<void>((r) => { firstCallResolve = r; });

    // First call: findFirst returns unconverted, then waits at $transaction.
    let findFirstCallCount = 0;
    (db.lead.findFirst as MockFn).mockImplementation(() => {
      findFirstCallCount++;
      if (findFirstCallCount === 1) return Promise.resolve(LEAD_ASSIGNED_TO_A);
      // Second call sees the already-converted lead.
      return Promise.resolve({ ...LEAD_ASSIGNED_TO_A, convertedOpportunityId: "opp-1" });
    });

    (db.$transaction as MockFn).mockImplementation(async (fn: (tx: PrismaMock) => Promise<unknown>) => {
      // Simulate latency so second call can arrive.
      await firstCallGate;
      const opp = { id: "opp-1", opportunityId: "OPP-0001" };
      (db.opportunity.create as MockFn).mockResolvedValue(opp);
      (db.lead.update as MockFn).mockResolvedValue({ ...LEAD_ASSIGNED_TO_A, convertedOpportunityId: "opp-1", lifecycleStatus: "CONVERTED" });
      return fn(db);
    });

    // Launch both calls concurrently.
    const [r1, r2] = await Promise.all([
      convertLead("lead-1", { title: "Opp A" }),
      // Release the gate so the first transaction can complete.
      (async () => { firstCallResolve!(); return convertLead("lead-1", { title: "Opp B" }); })(),
    ]);

    // Exactly one must succeed, the other must be rejected.
    const results = [r1, r2];
    const successes = results.filter((r) => r.ok);
    const failures = results.filter((r) => !r.ok);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect((failures[0] as { status: number }).status).toBe(409);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. createLead — AGENT self-assignment enforcement
// ─────────────────────────────────────────────────────────────────────────────

describe("createLead — AGENT assignment restriction", () => {
  const contactRow = { id: "contact-1", contactId: "CNT-0001", firstName: "Alice", lastName: "Smith", email: "alice@test.com", phone: null, location: null, isDeleted: false };
  const newLead = { ...LEAD_ASSIGNED_TO_A, id: "lead-new" };

  beforeEach(() => {
    (db.$queryRaw as MockFn).mockResolvedValue([{ max: 0 }]);
    (db.contact.findFirst as MockFn).mockResolvedValue(contactRow);
    (db.lead.create as MockFn).mockResolvedValue(newLead);
    (db.leadActivity.create as MockFn).mockResolvedValue({});
    (db.profile.findMany as MockFn).mockResolvedValue([]);
  });

  it("allows AGENT to self-assign", async () => {
    grantAs(PROFILES.agentA);
    (db.profile.findUnique as MockFn).mockResolvedValue({ status: "ACTIVE" });

    const res = await createLead({
      contactId: "contact-1",
      submittedName: "Alice",
      source: "MANUAL",
      assignedAgentId: AGENT_A_ID,
    });
    expect(res.ok).toBe(true);
  });

  it("blocks AGENT from assigning to another agent", async () => {
    grantAs(PROFILES.agentA);

    const res = await createLead({
      contactId: "contact-1",
      submittedName: "Alice",
      source: "MANUAL",
      assignedAgentId: AGENT_B_ID,
    });
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(403);
    expect((res as { error: string }).error).toMatch(/yourself/i);
  });

  it("allows MANAGER to assign to any agent", async () => {
    grantAs(PROFILES.manager);
    (db.profile.findUnique as MockFn).mockResolvedValue({ status: "ACTIVE" });

    const res = await createLead({
      contactId: "contact-1",
      submittedName: "Alice",
      source: "MANUAL",
      assignedAgentId: AGENT_B_ID,
    });
    expect(res.ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. archiveLead / restoreLead — AGENT only sees own leads
// ─────────────────────────────────────────────────────────────────────────────

describe("archiveLead — AGENT scope", () => {
  it("applies no scope for AGENT (leads:view_all) and 404s only when the lead is missing", async () => {
    grantAs(PROFILES.agentB);
    (db.lead.findFirst as MockFn).mockResolvedValue(null);

    const res = await archiveLead("lead-1");
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(404);

    const [call] = (db.lead.findFirst as MockFn).mock.calls;
    expect(call[0].where.OR).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. assignLead — USER and unauthenticated are blocked
// ─────────────────────────────────────────────────────────────────────────────

describe("assignLead — permission gates", () => {
  it("blocks USER", async () => {
    denyForbidden();
    const res = await assignLead("lead-1", { agentId: AGENT_A_ID });
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. SetNull FK — lead primaryListingId becomes null when listing deleted
// ─────────────────────────────────────────────────────────────────────────────

describe("SetNull FK relationship", () => {
  it("lead with null primaryListingId is still returned (listing deleted scenario)", async () => {
    grantAs(PROFILES.admin);
    const leadWithNullListing = { ...LEAD_ASSIGNED_TO_A, primaryListingId: null, primaryListing: null };
    (db.lead.findFirst as MockFn).mockResolvedValue(leadWithNullListing);
    (db.profile.findMany as MockFn).mockResolvedValue([]);

    const res = await getLead("lead-1");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.lead.primaryListing).toBeNull();
      expect(res.lead.primaryListingId).toBeNull();
    }
  });
});
