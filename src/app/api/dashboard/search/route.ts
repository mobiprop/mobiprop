import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/require-permission";
import { UserRole } from "@/generated/prisma/enums";

export const runtime = "nodejs";

// ── Result shapes ─────────────────────────────────────────────────────────────

export type SearchListingResult = {
  id: string;
  listingId: string;
  title: string;
  location: string;
  status: string;
  type: string;
  slug: string;
  coverImageUrl: string | null;
  matchedVia?: "contact";
  matchedContactName?: string;
};

export type SearchContactResult = {
  id: string;
  contactId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  type: string;
  assignedListings: number;
};

export type SearchOpportunityResult = {
  id: string;
  opportunityId: string;
  title: string;
  contactName: string | null;
  stage: string;
  status: string;
  dealSize: number | null;
};

export type SearchContractResult = {
  id: string;
  contractId: string;
  title: string;
  contactName: string | null;
  type: string;
  status: string;
  value: number | null;
};

export type GlobalSearchResults = {
  listings: SearchListingResult[];
  contacts: SearchContactResult[];
  opportunities: SearchOpportunityResult[];
  contracts: SearchContractResult[];
};

const MAX = 5;

export async function GET(req: Request) {
  const gate = await requirePermission("listings:view");
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.error }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json<{ success: true } & GlobalSearchResults>({
      success: true,
      listings: [],
      contacts: [],
      opportunities: [],
      contracts: [],
    });
  }

  const { profile } = gate;
  const isAgent = profile.role === UserRole.AGENT;
  const agentScope = isAgent
    ? { OR: [{ createdById: profile.id }, { assignedAgentId: profile.id }] as const }
    : {};

  // ── Run all queries in parallel ──────────────────────────────────────────

  const [
    directListings,
    matchedContacts,
    matchedOpportunities,
    matchedContracts,
  ] = await Promise.all([
    // 1. Listings matching by title / ID / address fields
    prisma.property.findMany({
      where: {
        ...agentScope,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { listingId: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
          { fullAddress: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { province: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true, listingId: true, title: true, location: true,
        status: true, type: true, slug: true,
        images: { where: { isCover: true }, select: { url: true }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: MAX,
    }),

    // 2. Contacts matching by name / email / phone / ID
    prisma.contact.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { contactId: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        properties: {
          include: {
            property: {
              select: {
                id: true, listingId: true, title: true, location: true,
                status: true, type: true, slug: true,
                images: { where: { isCover: true }, select: { url: true }, take: 1 },
                ...agentScope,
              },
            },
          },
        },
      },
      take: MAX,
    }),

    // 3. Opportunities matching by title / contact name
    prisma.opportunity.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { opportunityId: { contains: q, mode: "insensitive" } },
          { contact: { firstName: { contains: q, mode: "insensitive" } } },
          { contact: { lastName: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true, opportunityId: true, title: true,
        stage: true, status: true, dealSize: true,
        contact: { select: { firstName: true, lastName: true } },
      },
      take: MAX,
    }),

    // 4. Contracts matching by title / contact name / ID
    prisma.contract.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { contractId: { contains: q, mode: "insensitive" } },
          { contact: { firstName: { contains: q, mode: "insensitive" } } },
          { contact: { lastName: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true, contractId: true, title: true,
        type: true, status: true, value: true,
        contact: { select: { firstName: true, lastName: true } },
      },
      take: MAX,
    }),
  ]);

  // ── Map direct listings ───────────────────────────────────────────────────

  const directListingResults: SearchListingResult[] = directListings.map((p) => ({
    id: p.id,
    listingId: p.listingId,
    title: p.title,
    location: p.location,
    status: p.status,
    type: p.type,
    slug: p.slug,
    coverImageUrl: p.images[0]?.url ?? null,
  }));

  // ── Map contacts + derive their linked listings ───────────────────────────

  const contactResults: SearchContactResult[] = matchedContacts.map((c) => ({
    id: c.id,
    contactId: c.contactId,
    fullName: `${c.firstName} ${c.lastName}`.trim(),
    email: c.email,
    phone: c.phone,
    type: c.type,
    assignedListings: c.properties.length,
  }));

  // Listings that came in via a matched contact (relational surface)
  const contactListingIds = new Set(directListingResults.map((l) => l.id));
  const contactDerivedListings: SearchListingResult[] = [];

  for (const contact of matchedContacts) {
    const contactName = `${contact.firstName} ${contact.lastName}`.trim();
    for (const cp of contact.properties) {
      const p = cp.property;
      if (contactListingIds.has(p.id)) continue; // already in direct results
      contactListingIds.add(p.id);
      contactDerivedListings.push({
        id: p.id,
        listingId: p.listingId,
        title: p.title,
        location: p.location,
        status: p.status,
        type: p.type,
        slug: p.slug,
        coverImageUrl: p.images[0]?.url ?? null,
        matchedVia: "contact",
        matchedContactName: contactName,
      });
    }
  }

  const allListings = [...directListingResults, ...contactDerivedListings].slice(0, MAX * 2);

  // ── Map opportunities ─────────────────────────────────────────────────────

  const opportunityResults: SearchOpportunityResult[] = matchedOpportunities.map((o) => ({
    id: o.id,
    opportunityId: o.opportunityId,
    title: o.title,
    contactName: o.contact ? `${o.contact.firstName} ${o.contact.lastName}`.trim() : null,
    stage: o.stage,
    status: o.status,
    dealSize: o.dealSize !== null ? Number(o.dealSize) : null,
  }));

  // ── Map contracts ─────────────────────────────────────────────────────────

  const contractResults: SearchContractResult[] = matchedContracts.map((c) => ({
    id: c.id,
    contractId: c.contractId,
    title: c.title,
    contactName: c.contact ? `${c.contact.firstName} ${c.contact.lastName}`.trim() : null,
    type: c.type,
    status: c.status,
    value: c.value !== null ? Number(c.value) : null,
  }));

  return NextResponse.json<{ success: true } & GlobalSearchResults>({
    success: true,
    listings: allListings,
    contacts: contactResults,
    opportunities: opportunityResults,
    contracts: contractResults,
  });
}
