import type { ContactType, OpportunityStage, OpportunityStatus, ContractType, ContractStatus } from "@/generated/prisma/enums";

// ── Contact ───────────────────────────────────────────────────────────────────

export type ContactPropertyDto = {
  id: string;
  listingId: string;
  title: string;
  location: string;
  slug: string;
  role: string;
};

export type ContactDto = {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  address: string | null;
  type: ContactType;
  notes: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  assignedAgentId: string | null;
  properties: ContactPropertyDto[];
  createdAt: string;
  updatedAt: string;
};

export type ContactMetrics = {
  total: number;
  buyers: number;
  sellers: number;
  withListings: number;
};

// ── Opportunity ───────────────────────────────────────────────────────────────

export type OpportunityDto = {
  id: string;
  opportunityId: string;
  title: string;
  contactId: string | null;
  contactName: string | null;
  contactType: ContactType | null;
  propertyId: string | null;
  propertyTitle: string | null;
  propertySlug: string | null;
  dealType: string | null;
  dealSize: number | null;
  stage: OpportunityStage;
  status: OpportunityStatus;
  probability: number;
  commission: number | null;
  commissionUnit: string | null;
  paymentTerms: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  expectedCloseAt: string | null;
  agentCommission: string | null;
  notes: string | null;
  createdAt: string;
};

export type OpportunityMetrics = {
  total: number;
  open: number;
  closedWon: number;
  closedLost: number;
  totalValue: number;
};

// ── Contract ──────────────────────────────────────────────────────────────────

export type ContractDto = {
  id: string;
  contractId: string;
  title: string;
  contactId: string | null;
  contactName: string | null;
  propertyId: string | null;
  propertyTitle: string | null;
  propertySlug: string | null;
  type: ContractType;
  status: ContractStatus;
  value: number | null;
  startDate: string | null;
  endDate: string | null;
  signedAt: string | null;
  terms: string | null;
  notes: string | null;
  createdAt: string;
};

export type ContractMetrics = {
  total: number;
  active: number;
  pending: number;
  completed: number;
  totalValue: number;
};
