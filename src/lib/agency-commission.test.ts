import { expect, test } from "vitest";
import { calculateAgencyCommission, resolveCompanyRevenue, resolveAgentEarnings, resolveNetCompanyRevenue, resolveNetCompanyRevenueUsd } from "./commission";
import { createOpportunitySchema, updateOpportunitySchema } from "@/schemas/opportunity.schema";

const deal = { dealSize: 200000, commission: 3, commissionUnit: "%", agentCommissionValue: 20, agentCommissionUnit: "%" };
const agency = (value: number, unit = "%") => ({ role: "AGENCY", commissionValue: value, commissionUnit: unit });
test("50/50 sharing deducts the partner before the agent percentage", () => {
  const opportunity = { ...deal, agencyCommissionTotal: calculateAgencyCommission(6000, [agency(50)]) };
  expect(resolveCompanyRevenue(opportunity)).toBe(3000);
  expect(resolveAgentEarnings(opportunity)).toBe(600);
  expect(resolveNetCompanyRevenue(opportunity)).toBe(2400);
});
test("fixed fees and multiple percentages use the same total", () => {
  expect(calculateAgencyCommission(6000, [agency(25), agency(25), agency(100, "$")])).toBe(3100);
  expect(calculateAgencyCommission(6000, [{ role: "BUYER", commissionValue: 50 }])).toBe(0);
});
test("existing opportunities and agencies without a fee keep their revenue", () => {
  expect(calculateAgencyCommission(6000, [{ role: "AGENCY" }])).toBe(0);
  expect(resolveCompanyRevenue(deal)).toBe(6000);
  expect(resolveAgentEarnings(deal)).toBe(1200);
  expect(resolveNetCompanyRevenue({ ...deal, agencyCommissionTotal: 0 })).toBe(4800);
});
test("full sharing leaves no percentage earnings; excessive sharing is rejected", () => {
  expect(resolveAgentEarnings({ ...deal, agencyCommissionTotal: 6000 })).toBe(0);
  expect(() => calculateAgencyCommission(6000, [agency(60), agency(50)])).toThrow();
  expect(() => calculateAgencyCommission(6000, [agency(6001, "$")])).toThrow();
});
test("net reports apply the frozen currency rate after both deductions", () => {
  expect(resolveNetCompanyRevenueUsd({ ...deal, currency: "ARS", exchangeRate: 1000, agencyCommissionTotal: 3000 }, 1200)).toBe(2.4);
});
test("API rejects invalid individual shares and preserves omitted update fields", () => {
  const input = { title: "Shared sale", participants: [{ role: "BUYER", contactId: "client" }, { ...agency(101), companyName: "Partner" }] };
  expect(createOpportunitySchema.safeParse(input).success).toBe(false);
  expect(createOpportunitySchema.safeParse({ ...input, participants: [{ role: "BUYER", contactId: "client" }, { ...agency(-1, "$"), companyName: "Partner" }] }).success).toBe(false);
  expect(updateOpportunitySchema.parse({ status: "CLOSED_WON" })).not.toHaveProperty("participants");
  expect(updateOpportunitySchema.parse({ title: "Updated", createdAt: "2020-01-01" })).not.toHaveProperty("createdAt");
});
