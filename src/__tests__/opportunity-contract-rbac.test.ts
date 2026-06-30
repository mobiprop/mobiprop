/**
 * Opportunity / Contract record-scoping unit tests (2026-06-26 Milestone 3 decision).
 *
 * Unlike Contacts/Leads (which AGENT now sees in full), Opportunities and Contracts
 * stay scoped to an agent's own/assigned records — the one place AGENT visibility
 * is deliberately restricted. Covers:
 *   1. listOpportunities / listContracts — AGENT gets an own/assigned OR scope;
 *      ADMIN/MANAGER (opportunities:view_all / contracts:view_all) get none.
 *   2. updateOpportunity / updateContract — AGENT is blocked (403) from updating
 *      a record that isn't theirs; ADMIN/MANAGER can update any record.
 */

import { describe, it, expect, vi, beforeEach, type MockInstance } from "vitest";

vi.mock("server-only", () => ({}));

type MockFn = MockInstance;

const db = {
  opportunity: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  contract: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
  // buildAgentMap() looks up assignedAgentId display names after create/update.
  profile: { findMany: vi.fn().mockResolvedValue([]) },
  $queryRaw: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ get prisma() { return db; } }));

const mockRequirePermission = vi.fn();
vi.mock("@/lib/require-permission", () => ({
  get requirePermission() { return mockRequirePermission; },
}));

vi.mock("@/lib/activity-log", () => ({ logActivity: vi.fn().mockResolvedValue(undefined) }));

// contract-actions.ts's document-upload helpers pull in the Supabase admin
// client (env.ts) transitively — stub the storage module so importing it
// doesn't require real Supabase env vars in the test runner.
vi.mock("@/lib/supabase/storage", () => ({
  mintContractDocumentUploadTicket: vi.fn(),
  verifyUploadedContractDocument: vi.fn(),
  removeContractDocumentObject: vi.fn(),
}));

// notify-events.ts transitively imports send-web-push.ts -> env.ts, which
// throws at module-load time outside a real runtime env — stub it out so
// importing opportunity-actions/contract-actions doesn't pull that chain in.
vi.mock("@/features/notifications/server/notify-events", () => ({
  notifyOpportunityClosed: vi.fn().mockResolvedValue(undefined),
  notifyOpportunityStageChanged: vi.fn().mockResolvedValue(undefined),
  notifyContractCreated: vi.fn().mockResolvedValue(undefined),
  notifyContractExpiring: vi.fn().mockResolvedValue(undefined),
}));

function grantAs(role: "ADMIN" | "MANAGER" | "AGENT", id: string) {
  mockRequirePermission.mockResolvedValue({
    ok: true,
    profile: { id, role, status: "ACTIVE", fullName: `Test ${role}`, email: `${role.toLowerCase()}@test.com`, avatarUrl: null },
  });
}

const AGENT_A_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const AGENT_B_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ADMIN_ID   = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const MANAGER_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const { listOpportunities, updateOpportunity, createContractFromOpportunity } = await import(
  "@/features/crm/opportunity-actions"
);
const { listContracts, updateContract } = await import("@/features/crm/contract-actions");

beforeEach(() => {
  vi.clearAllMocks();
});

function scopeOr(where: Record<string, unknown> | undefined): Record<string, unknown>[] | undefined {
  return where?.OR as Record<string, unknown>[] | undefined;
}

// ── Opportunities ───────────────────────────────────────────────────────────────

describe("listOpportunities — record scope", () => {
  it("scopes to own/assigned for AGENT", async () => {
    grantAs("AGENT", AGENT_A_ID);
    db.opportunity.findMany.mockResolvedValue([]);

    await listOpportunities();

    const [call] = (db.opportunity.findMany as MockFn).mock.calls;
    const or = scopeOr(call[0].where);
    expect(or).toContainEqual({ assignedAgentId: AGENT_A_ID });
    expect(or).toContainEqual({ createdById: AGENT_A_ID });
  });

  it("applies no scope for ADMIN", async () => {
    grantAs("ADMIN", ADMIN_ID);
    db.opportunity.findMany.mockResolvedValue([]);

    await listOpportunities();

    const [call] = (db.opportunity.findMany as MockFn).mock.calls;
    expect(call[0].where).toEqual({ isDeleted: false });
  });

  it("applies no scope for MANAGER", async () => {
    grantAs("MANAGER", MANAGER_ID);
    db.opportunity.findMany.mockResolvedValue([]);

    await listOpportunities();

    const [call] = (db.opportunity.findMany as MockFn).mock.calls;
    expect(call[0].where).toEqual({ isDeleted: false });
  });
});

describe("updateOpportunity — ownership guard", () => {
  it("blocks AGENT from updating an opportunity they don't own/aren't assigned to", async () => {
    grantAs("AGENT", AGENT_B_ID);
    db.opportunity.findUnique.mockResolvedValue({ assignedAgentId: AGENT_A_ID, createdById: AGENT_A_ID });

    const res = await updateOpportunity("opp-1", {});
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(403);
    expect(db.opportunity.update).not.toHaveBeenCalled();
  });

  it("allows AGENT to update their own assigned opportunity", async () => {
    grantAs("AGENT", AGENT_A_ID);
    db.opportunity.findUnique.mockResolvedValue({ assignedAgentId: AGENT_A_ID, createdById: null });
    db.opportunity.update.mockResolvedValue({
      id: "opp-1", opportunityId: "OPP-0001", title: "Test", contactId: null, propertyId: null,
      dealType: null, dealSize: null, stage: "QUALIFICATION", status: "OPEN", probability: 50,
      commission: null, commissionUnit: null, paymentTerms: null, contractStart: null, contractEnd: null,
      expectedCloseAt: null, agentCommissionValue: null, agentCommissionUnit: null, notes: null, assignedAgentId: AGENT_A_ID, createdById: null,
      createdAt: new Date(), contact: null, property: null,
    });

    const res = await updateOpportunity("opp-1", {});
    expect(res.ok).toBe(true);
  });

  it("allows MANAGER to update any opportunity regardless of who owns it", async () => {
    grantAs("MANAGER", MANAGER_ID);
    // Owned by a different agent entirely — a MANAGER must not be blocked by the
    // ownership check that applies to AGENT (opportunities:view_all bypasses it).
    db.opportunity.findUnique.mockResolvedValue({
      isDeleted: false, assignedAgentId: AGENT_A_ID, createdById: AGENT_A_ID,
      title: "Test", stage: "QUALIFICATION", status: "OPEN", dealSize: null,
    });
    db.opportunity.update.mockResolvedValue({
      id: "opp-1", opportunityId: "OPP-0001", title: "Test", contactId: null, propertyId: null,
      dealType: null, dealSize: null, stage: "QUALIFICATION", status: "OPEN", probability: 50,
      commission: null, commissionUnit: null, paymentTerms: null, contractStart: null, contractEnd: null,
      expectedCloseAt: null, agentCommissionValue: null, agentCommissionUnit: null, notes: null, assignedAgentId: AGENT_A_ID, createdById: null,
      createdAt: new Date(), contact: null, property: null,
    });

    const res = await updateOpportunity("opp-1", {});
    expect(res.ok).toBe(true);
  });
});

describe("createContractFromOpportunity — Option A pre-fill draft", () => {
  const baseOpp = {
    id: "opp-1",
    title: "Sale of 123 Main St",
    contactId: "contact-1",
    propertyId: "property-1",
    assignedAgentId: AGENT_A_ID,
    dealSize: 150000,
    dealType: "Sale",
    contractStart: null,
    contractEnd: null,
    status: "CLOSED_WON",
  };

  it("rejects when the opportunity is not Closed Won", async () => {
    grantAs("ADMIN", ADMIN_ID);
    db.opportunity.findFirst.mockResolvedValue({ ...baseOpp, status: "OPEN" });

    const res = await createContractFromOpportunity("opp-1");
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(400);
  });

  it("scopes the lookup to own/assigned for AGENT, so an unscoped row can't be fetched", async () => {
    grantAs("AGENT", AGENT_B_ID);
    db.opportunity.findFirst.mockResolvedValue(null);

    const res = await createContractFromOpportunity("opp-1");
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(404);

    const [call] = (db.opportunity.findFirst as MockFn).mock.calls;
    const or = scopeOr(call[0].where);
    expect(or).toContainEqual({ assignedAgentId: AGENT_B_ID });
    expect(or).toContainEqual({ createdById: AGENT_B_ID });
  });

  it("builds a draft from a Closed Won opportunity with the right field mapping", async () => {
    grantAs("AGENT", AGENT_A_ID);
    db.opportunity.findFirst.mockResolvedValue(baseOpp);

    const res = await createContractFromOpportunity("opp-1");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.draft).toEqual({
      title: "Sale of 123 Main St",
      contactId: "contact-1",
      propertyId: "property-1",
      assignedAgentId: AGENT_A_ID,
      opportunityId: "opp-1",
      value: 150000,
      startDate: null,
      endDate: null,
      type: "SALE",
    });
  });

  it("maps a Rent deal type to the RENT contract type", async () => {
    grantAs("ADMIN", ADMIN_ID);
    db.opportunity.findFirst.mockResolvedValue({ ...baseOpp, dealType: "Rent" });

    const res = await createContractFromOpportunity("opp-1");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.draft.type).toBe("RENT");
  });
});

// ── Contracts ────────────────────────────────────────────────────────────────────

describe("listContracts — record scope", () => {
  it("scopes to own/assigned for AGENT", async () => {
    grantAs("AGENT", AGENT_A_ID);
    db.contract.findMany.mockResolvedValue([]);

    await listContracts();

    const [call] = (db.contract.findMany as MockFn).mock.calls;
    const or = scopeOr(call[0].where);
    expect(or).toContainEqual({ assignedAgentId: AGENT_A_ID });
    expect(or).toContainEqual({ createdById: AGENT_A_ID });
  });

  it("applies no scope for ADMIN", async () => {
    grantAs("ADMIN", ADMIN_ID);
    db.contract.findMany.mockResolvedValue([]);

    await listContracts();

    const [call] = (db.contract.findMany as MockFn).mock.calls;
    expect(call[0].where).toEqual({ isDeleted: false });
  });
});

describe("updateContract — ownership guard", () => {
  it("blocks AGENT from updating a contract they don't own/aren't assigned to", async () => {
    grantAs("AGENT", AGENT_B_ID);
    db.contract.findUnique.mockResolvedValue({ assignedAgentId: AGENT_A_ID, createdById: AGENT_A_ID });

    const res = await updateContract("con-1", {});
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(403);
    expect(db.contract.update).not.toHaveBeenCalled();
  });
});
