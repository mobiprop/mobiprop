"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { ContactDto, OpportunityDto, ContractDto } from "@/features/crm/types/crm-dto";

// ── Contacts ──────────────────────────────────────────────────────────────────

async function postContact(body: unknown): Promise<{ contact: ContactDto }> {
  const res = await fetch("/api/dashboard/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create contact");
  return data;
}

export function useCreateContactMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postContact,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dashboardContacts() }),
  });
}

async function patchContact({ id, body }: { id: string; body: unknown }): Promise<{ contact: ContactDto }> {
  const res = await fetch(`/api/dashboard/contacts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to update contact");
  return data;
}

export function useUpdateContactMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dashboardContacts() });
      // Lead list and detail pages embed contact name/email — refresh them too.
      qc.invalidateQueries({ queryKey: queryKeys.leads() });
    },
  });
}

async function deleteContactReq(id: string): Promise<{ id: string }> {
  const res = await fetch(`/api/dashboard/contacts/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to delete contact");
  return data;
}

export function useDeleteContactMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteContactReq,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dashboardContacts() });
      qc.invalidateQueries({ queryKey: queryKeys.leads() });
    },
  });
}

// ── Opportunities ─────────────────────────────────────────────────────────────

async function postOpportunity(body: unknown): Promise<{ opportunity: OpportunityDto }> {
  const res = await fetch("/api/dashboard/opportunities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create opportunity");
  return data;
}

export function useCreateOpportunityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postOpportunity,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dashboardOpportunities() }),
  });
}

// ── Contracts ─────────────────────────────────────────────────────────────────

async function postContract(body: unknown): Promise<{ contract: ContractDto }> {
  const res = await fetch("/api/dashboard/contracts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create contract");
  return data;
}

export function useCreateContractMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postContract,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dashboardContracts() }),
  });
}
