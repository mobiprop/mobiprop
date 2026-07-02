import type { ContactType, OpportunityStage, OpportunityStatus, ContractType, ContractStatus, LeadSource, LeadTemperature, LeadLifecycleStatus, TourStatus } from "@/generated/prisma/enums";
export type { LeadSource, LeadTemperature, LeadLifecycleStatus, TourStatus };

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
  both: number;
  withListings: number;
  withOpportunities: number;
};

// ── Opportunity ───────────────────────────────────────────────────────────────

export type OpportunityParticipantRole = "BUYER" | "SELLER" | "AGENCY";

export type OpportunityParticipantDto = {
  id: string;
  role: OpportunityParticipantRole;
  /** Set for BUYER/SELLER rows (a linked Contact); null for AGENCY rows. */
  contactId: string | null;
  contactName: string | null;
  /** Set for AGENCY rows only — free text, no Contact record. */
  companyName: string | null;
};

export type OpportunityDto = {
  id: string;
  opportunityId: string;
  title: string;
  participants: OpportunityParticipantDto[];
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
  /** Computed: commissionUnit === "%" ? dealSize * commission / 100 : commission. */
  commissionAmount: number | null;
  paymentTerms: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  expectedCloseAt: string | null;
  agentCommissionValue: number | null;
  agentCommissionUnit: string | null;
  /** Computed the same way as commissionAmount, against dealSize. */
  agentCommissionAmount: number | null;
  notes: string | null;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  createdById: string | null;
  createdAt: string;
};

export type OpportunityMetrics = {
  total: number;
  open: number;
  closedWon: number;
  closedLost: number;
  totalValue: number;
  /** Sum of resolved commission amounts for CLOSED_WON opportunities — the
   * brokerage's actual revenue, not the raw deal size. */
  totalRevenue: number;
};

// ── Contract ──────────────────────────────────────────────────────────────────

export type ContractDocumentDto = {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type ContractDto = {
  id: string;
  contractId: string;
  title: string;
  contactId: string | null;
  contactName: string | null;
  propertyId: string | null;
  propertyTitle: string | null;
  propertySlug: string | null;
  opportunityId: string | null;
  opportunityNumber: string | null;
  type: ContractType;
  status: ContractStatus;
  value: number | null;
  startDate: string | null;
  endDate: string | null;
  signedAt: string | null;
  terms: string | null;
  notes: string | null;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  createdById: string | null;
  documents: ContractDocumentDto[];
  createdAt: string;
};

export type ContractMetrics = {
  total: number;
  active: number;
  pending: number;
  completed: number;
  totalValue: number;
};

// ── Lead ──────────────────────────────────────────────────────────────────────

export type LeadListingSnapshotDto = {
  id: string;
  listingId: string;
  title: string;
  location: string;
  slug: string;
  coverUrl: string | null;
  type: string;
  operationType: string;
  status: string;
  salePrice: number | null;
  rentPrice: number | null;
};

export type LeadAgentDto = {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
};

export type LeadContactDto = {
  id: string;
  contactId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  type: ContactType;
};

export type LeadDto = {
  id: string;
  leadNumber: string;
  contactId: string;
  contact: LeadContactDto;
  primaryListingId: string | null;
  primaryListing: LeadListingSnapshotDto | null;
  assignedAgentId: string | null;
  assignedAgent: LeadAgentDto | null;
  createdById: string | null;
  convertedOpportunityId: string | null;
  convertedAt: string | null;
  submittedName: string;
  submittedEmail: string | null;
  submittedPhone: string | null;
  submittedLocation: string | null;
  source: LeadSource;
  sourceDetail: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  score: number;
  temperature: LeadTemperature;
  lifecycleStatus: LeadLifecycleStatus;
  notes: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  closedAt: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadNoteDto = {
  id: string;
  leadId: string;
  authorId: string;
  authorName: string | null;
  authorAvatar: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadActivityDto = {
  id: string;
  leadId: string;
  actorId: string | null;
  actorName: string | null;
  type: string;
  fieldName: string | null;
  oldValue: unknown;
  newValue: unknown;
  metadata: unknown;
  createdAt: string;
};

export type LeadMetrics = {
  total: number;
  hot: number;
  conversionRate: number;
  averageScore: number;
};

// ── Tour ──────────────────────────────────────────────────────────────────────

export type TourContactDto = {
  id: string;
  contactId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
};

export type TourListingDto = {
  id: string;
  listingId: string;
  title: string;
  location: string;
  slug: string;
  coverUrl: string | null;
};

export type TourAgentDto = {
  id: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
};

export type TourDto = {
  id: string;
  tourNumber: string;
  submittedName: string;
  submittedEmail: string | null;
  submittedPhone: string | null;
  submittedMessage: string | null;
  contactId: string;
  contact: TourContactDto;
  propertyId: string | null;
  property: TourListingDto | null;
  leadId: string | null;
  assignedAgentId: string | null;
  assignedAgent: TourAgentDto | null;
  createdById: string | null;
  status: TourStatus;
  scheduledAt: string;
  durationMinutes: number;
  confirmationNote: string | null;
  rescheduleNote: string | null;
  cancellationReason: string | null;
  completionNote: string | null;
  rescheduledFrom: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type TourMetrics = {
  total: number;
  requested: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  upcoming: number;
};

// Lean version for the user's "My Tours" account page
export type MyTourDto = {
  id: string;
  tourNumber: string;
  status: TourStatus;
  scheduledAt: string;
  durationMinutes: number;
  property: TourListingDto | null;
  assignedAgent: TourAgentDto | null;
  cancellationReason: string | null;
  createdAt: string;
};
