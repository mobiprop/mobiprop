"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { ContactDto, OpportunityDto } from "@/features/crm/types/crm-dto";

// ── Contacts ──────────────────────────────────────────────────────────────────

export type ExistingContactRef = { id: string; contactId: string; fullName: string };

/** Thrown when createContact rejects a duplicate email/phone match (409). */
export class ContactConflictError extends Error {
  existingContact: ExistingContactRef;
  constructor(message: string, existingContact: ExistingContactRef) {
    super(message);
    this.name = "ContactConflictError";
    this.existingContact = existingContact;
  }
}

async function postContact(body: unknown): Promise<{ contact: ContactDto }> {
  const res = await fetch("/api/dashboard/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 409 && data.existingContact) {
      throw new ContactConflictError(data.error ?? "A matching contact already exists.", data.existingContact);
    }
    throw new Error(data.error ?? "Failed to create contact");
  }
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

export type ImportContactsResult = {
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

async function postImportContacts(rows: Record<string, unknown>[]): Promise<ImportContactsResult> {
  const res = await fetch("/api/dashboard/contacts/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to import contacts");
  return data;
}

export function useImportContactsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postImportContacts,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dashboardContacts() }),
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

async function patchOpportunity({ id, body }: { id: string; body: unknown }): Promise<{ opportunity: OpportunityDto }> {
  const res = await fetch(`/api/dashboard/opportunities/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to update opportunity");
  return data;
}

export function useUpdateOpportunityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchOpportunity,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dashboardOpportunities() });
      // Closing/editing an opportunity can change an agent's computed earnings.
      qc.invalidateQueries({ queryKey: queryKeys.agents() });
    },
  });
}

async function deleteOpportunityReq(id: string): Promise<{ id: string }> {
  const res = await fetch(`/api/dashboard/opportunities/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to delete opportunity");
  return data;
}

export function useDeleteOpportunityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteOpportunityReq,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dashboardOpportunities() }),
  });
}

