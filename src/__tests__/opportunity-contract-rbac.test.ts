/**
 * Opportunity / Contract record-scoping unit tests (2026-06-26 Milestone 3
 * decision; team-based MANAGER scoping added 2026-07-02).
 *
 * Unlike Contacts/Leads (which AGENT now sees in full), Opportunities and Contracts
 * stay scoped to an agent's own/assigned records — the one place AGENT visibility
 * is deliberately restricted. Covers:
 *   1. listOpportunities / listContracts — AGENT gets an own/assigned OR scope;
 *      MANAGER gets an own+team OR scope (resolveOwnerScopeIds); ADMIN gets none.
 *   2. updateOpportunity / updateContract — AGENT/MANAGER are blocked (403) from
 *      updating a record outside their scope; ADMIN can update any record.
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
  // Default: no team members for any MANAGER (resolveOwnerScopeIds's
  // teamLeaderId lookup) and no agent rows for buildAgentMap's id-in lookup.
  // Tests that need a team member override this with mockImplementationOnce.
  db.profile.findMany.mockResolvedValue([]);
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
    expect(or).toContainEqual({ assignedAgentId: { in: [AGENT_A_ID] } });
    expect(or).toContainEqual({ createdById: { in: [AGENT_A_ID] } });
  });

  it("applies no scope for ADMIN", async () => {
    grantAs("ADMIN", ADMIN_ID);
    db.opportunity.findMany.mockResolvedValue([]);

    await listOpportunities();

    const [call] = (db.opportunity.findMany as MockFn).mock.calls;
    expect(call[0].where).toEqual({ isDeleted: false });
  });

  it("scopes MANAGER to self only when they lead no team", async () => {
    grantAs("MANAGER", MANAGER_ID);
    db.opportunity.findMany.mockResolvedValue([]);

    await listOpportunities();

    const [call] = (db.opportunity.findMany as MockFn).mock.calls;
    const or = scopeOr(call[0].where);
    expect(or).toContainEqual({ assignedAgentId: { in: [MANAGER_ID] } });
    expect(or).toContainEqual({ createdById: { in: [MANAGER_ID] } });
  });

  it("scopes MANAGER to self + direct reports", async () => {
    grantAs("MANAGER", MANAGER_ID);
    db.profile.findMany.mockImplementation((args: { where?: { teamLeaderId?: string } }) =>
      Promise.resolve(args?.where?.teamLeaderId ? [{ id: AGENT_A_ID }] : []),
    );
    db.opportunity.findMany.mockResolvedValue([]);

    await listOpportunities();

    const [call] = (db.opportunity.findMany as MockFn).mock.calls;
    const or = scopeOr(call[0].where);
    expect(or).toContainEqual({ assignedAgentId: { in: [MANAGER_ID, AGENT_A_ID] } });
    expect(or).toContainEqual({ createdById: { in: [MANAGER_ID, AGENT_A_ID] } });
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
      id: "opp-1", opportunityId: "OPP-0001", title: "Test", propertyId: null,
      dealType: null, dealSize: null, stage: "QUALIFICATION", status: "OPEN", probability: 50,
      commission: null, commissionUnit: null, paymentTerms: null, contractStart: null, contractEnd: null,
      expectedCloseAt: null, agentCommissionValue: null, agentCommissionUnit: null, notes: null, assignedAgentId: AGENT_A_ID, createdById: null,
      createdAt: new Date(), participants: [], property: null,
    });

    const res = await updateOpportunity("opp-1", {});
    expect(res.ok).toBe(true);
  });

  it("blocks MANAGER from updating an opportunity owned by an agent outside their team", async () => {
    grantAs("MANAGER", MANAGER_ID);
    // Owned by an agent who is not this Manager's direct report — team-based
    // scoping (2026-07-02) means a Manager no longer bypasses ownership entirely.
    db.opportunity.findUnique.mockResolvedValue({
      isDeleted: false, assignedAgentId: AGENT_A_ID, createdById: AGENT_A_ID,
      title: "Test", stage: "QUALIFICATION", status: "OPEN", dealSize: null,
    });

    const res = await updateOpportunity("opp-1", {});
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(403);
    expect(db.opportunity.update).not.toHaveBeenCalled();
  });

  it("allows MANAGER to update an opportunity owned by their own team member", async () => {
    grantAs("MANAGER", MANAGER_ID);
    db.profile.findMany.mockImplementation((args: { where?: { teamLeaderId?: string } }) =>
      Promise.resolve(args?.where?.teamLeaderId ? [{ id: AGENT_A_ID }] : []),
    );
    db.opportunity.findUnique.mockResolvedValue({
      isDeleted: false, assignedAgentId: AGENT_A_ID, createdById: AGENT_A_ID,
      title: "Test", stage: "QUALIFICATION", status: "OPEN", dealSize: null,
    });
    db.opportunity.update.mockResolvedValue({
      id: "opp-1", opportunityId: "OPP-0001", title: "Test", propertyId: null,
      dealType: null, dealSize: null, stage: "QUALIFICATION", status: "OPEN", probability: 50,
      commission: null, commissionUnit: null, paymentTerms: null, contractStart: null, contractEnd: null,
      expectedCloseAt: null, agentCommissionValue: null, agentCommissionUnit: null, notes: null, assignedAgentId: AGENT_A_ID, createdById: null,
      createdAt: new Date(), participants: [], property: null,
    });

    const res = await updateOpportunity("opp-1", {});
    expect(res.ok).toBe(true);
  });
});

describe("createContractFromOpportunity — Option A pre-fill draft", () => {
  const baseOpp = {
    id: "opp-1",
    opportunityId: "OPP-0001",
    title: "Sale of 123 Main St",
    participants: [
      { role: "BUYER", contactId: "contact-1", companyName: null, contact: { firstName: "John", lastName: "Buyer" } },
    ],
    propertyId: "property-1",
    property: { title: "123 Main St" },
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
    expect(or).toContainEqual({ assignedAgentId: { in: [AGENT_B_ID] } });
    expect(or).toContainEqual({ createdById: { in: [AGENT_B_ID] } });
  });

  it("builds a draft from a Closed Won opportunity with the right field mapping", async () => {
    grantAs("AGENT", AGENT_A_ID);
    db.opportunity.findFirst.mockResolvedValue(baseOpp);

    const res = await createContractFromOpportunity("opp-1");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.draft).toEqual({
      title: "Sale of 123 Main St",
      participants: [
        { role: "BUYER", contactId: "contact-1", contactName: "John Buyer", companyName: null },
      ],
      propertyIds: ["property-1"],
      propertyTitles: ["123 Main St"],
      assignedAgentId: AGENT_A_ID,
      opportunityId: "opp-1",
      opportunityNumber: "OPP-0001",
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
    expect(or).toContainEqual({ assignedAgentId: { in: [AGENT_A_ID] } });
    expect(or).toContainEqual({ createdById: { in: [AGENT_A_ID] } });
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
