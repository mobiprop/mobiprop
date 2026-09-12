import { expect, test } from "vitest";
import { EMPTY_OPPORTUNITY_FILTERS, matchesOpportunityFilters, hasActiveOpportunityFilters } from "@/features/dashboard/components/OpportunityFilterModal";
import { updateOpportunitySchema } from "@/schemas/opportunity.schema";
import type { OpportunityDto } from "@/features/crm/types/crm-dto";
const opportunity = { stage: "VISITATION", status: "OPEN", commissionAmount: 5000, expectedCloseAt: null, assignedAgentId: "agent" } as OpportunityDto;
test("stage and status filters are independent and clearing restores results", () => {
  expect(matchesOpportunityFilters(opportunity, { ...EMPTY_OPPORTUNITY_FILTERS, stages: ["VISITATION"], statuses: ["OPEN"] })).toBe(true);
  expect(matchesOpportunityFilters(opportunity, { ...EMPTY_OPPORTUNITY_FILTERS, stages: ["OFFER"] })).toBe(false);
  expect(matchesOpportunityFilters(opportunity, { ...EMPTY_OPPORTUNITY_FILTERS, statuses: ["CLOSED_WON"] })).toBe(false);
  expect(matchesOpportunityFilters(opportunity, EMPTY_OPPORTUNITY_FILTERS)).toBe(true);
});
test("obsolete probability cannot filter records or overwrite historical data", () => {
  const legacyFilters = { ...EMPTY_OPPORTUNITY_FILTERS, minProbability: 100 };
  expect(hasActiveOpportunityFilters(legacyFilters)).toBe(false);
  expect(matchesOpportunityFilters(opportunity, legacyFilters)).toBe(true);
  expect(updateOpportunitySchema.parse({ title: "Updated", probability: 99 })).toEqual({ title: "Updated" });
});
