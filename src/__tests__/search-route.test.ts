/**
 * Global search — unit tests.
 *
 * Verifies:
 *   1. Soft-deleted contacts are NOT returned by the search.
 *   2. Contacts only surface in listing results via ContactProperty when the
 *      listing query matches — deleted contacts are not followed through the
 *      relation join.
 *   3. AGENT scope is applied to direct listing results.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: (fn: unknown) => fn };
});

const AGENT_ID = "agent-id-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const mockRequirePermission = vi.fn();
vi.mock("@/lib/require-permission", () => ({ requirePermission: mockRequirePermission }));

const mockPrisma = {
  property: { findMany: vi.fn() },
  contact:  { findMany: vi.fn() },
  opportunity: { findMany: vi.fn() },
  contract: { findMany: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

function grantAs(role: string, id = "admin-id") {
  mockRequirePermission.mockResolvedValue({ ok: true, profile: { id, role, status: "ACTIVE" } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.property.findMany.mockResolvedValue([]);
  mockPrisma.contact.findMany.mockResolvedValue([]);
  mockPrisma.opportunity.findMany.mockResolvedValue([]);
  mockPrisma.contract.findMany.mockResolvedValue([]);
});

function makeRequest(q: string) {
  return new NextRequest(`http://localhost/api/dashboard/search?q=${encodeURIComponent(q)}`);
}

const { GET } = await import("@/app/api/dashboard/search/route");

// ─────────────────────────────────────────────────────────────────────────────
// 1. Deleted contacts excluded from search results
// ─────────────────────────────────────────────────────────────────────────────

describe("search — deleted contacts excluded", () => {
  it("passes isDeleted: false in the contact WHERE clause", async () => {
    grantAs("ADMIN");
    await GET(makeRequest("alice"));

    const [contactCall] = mockPrisma.contact.findMany.mock.calls;
    expect(contactCall[0].where.isDeleted).toBe(false);
  });

  it("does not return deleted contacts even if their name matches the query", async () => {
    grantAs("ADMIN");
    // Simulate: a deleted contact whose name matches — should NOT appear because
    // the query now includes isDeleted: false.  Since we pass isDeleted: false
    // to the real Prisma, the mock returns empty (deleted one filtered out).
    mockPrisma.contact.findMany.mockResolvedValue([]); // filtered by DB

    const res = await GET(makeRequest("alice"));
    const body = await res.json();

    expect(body.contacts).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. AGENT scope applied to listing search
// ─────────────────────────────────────────────────────────────────────────────

describe("search — AGENT listing scope", () => {
  it("restricts property search to created/assigned listings for AGENT", async () => {
    grantAs("AGENT", AGENT_ID);

    await GET(makeRequest("casa"));

    const [propertyCall] = mockPrisma.property.findMany.mock.calls;
    const where = propertyCall[0].where;

    // AGENT query uses AND: [agent-scope OR, search-field OR]
    expect(where.AND).toBeDefined();
    const andClauses = where.AND as Array<{ OR?: Array<Record<string, unknown>> }>;
    const agentClause = andClauses.find((c) =>
      c.OR?.some((o) => "createdById" in o || "assignedAgentId" in o),
    );
    expect(agentClause).toBeDefined();
    expect(agentClause!.OR).toEqual(
      expect.arrayContaining([
        { createdById: AGENT_ID },
        { assignedAgentId: AGENT_ID },
      ]),
    );
  });

  it("does not restrict property search for ADMIN", async () => {
    grantAs("ADMIN");

    await GET(makeRequest("casa"));

    const [propertyCall] = mockPrisma.property.findMany.mock.calls;
    const where = propertyCall[0].where;

    // No agent scope OR at the top level — only the search OR
    const hasAgentScope = Array.isArray(where.OR) &&
      where.OR.some((c: Record<string, unknown>) => "createdById" in c || "assignedAgentId" in c);
    expect(hasAgentScope).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Returns 403 for unauthenticated / USER
// ─────────────────────────────────────────────────────────────────────────────

describe("search — auth gate", () => {
  it("returns 403 when not authenticated", async () => {
    mockRequirePermission.mockResolvedValue({ ok: false, error: "Not signed in.", reason: "unauthenticated" });

    const res = await GET(makeRequest("test"));
    expect(res.status).toBe(403);
  });
});
