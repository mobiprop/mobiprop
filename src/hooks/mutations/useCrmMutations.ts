"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { ContactDto, OpportunityDto, ContractDto, ContractDocumentDto } from "@/features/crm/types/crm-dto";
import type { ContractDraft } from "@/features/crm/opportunity-actions";
import { uploadContractDocument } from "@/lib/client-upload";

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

async function postCreateContractFromOpportunity(opportunityId: string): Promise<{ draft: ContractDraft }> {
  const res = await fetch(`/api/dashboard/opportunities/${opportunityId}/create-contract`, { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to prepare contract draft");
  return data;
}

export function useCreateContractFromOpportunityMutation() {
  return useMutation({ mutationFn: postCreateContractFromOpportunity });
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

async function patchContract({ id, body }: { id: string; body: unknown }): Promise<{ contract: ContractDto }> {
  const res = await fetch(`/api/dashboard/contracts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to update contract");
  return data;
}

export function useUpdateContractMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchContract,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dashboardContracts() }),
  });
}

async function deleteContractReq(id: string): Promise<{ id: string }> {
  const res = await fetch(`/api/dashboard/contracts/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to delete contract");
  return data;
}

export function useDeleteContractMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteContractReq,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dashboardContracts() }),
  });
}

async function uploadDocument({ contractId, file }: { contractId: string; file: File }): Promise<ContractDocumentDto> {
  return uploadContractDocument(contractId, file);
}

export function useUploadContractDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dashboardContracts() }),
  });
}

async function removeDocument({ contractId, documentId }: { contractId: string; documentId: string }): Promise<{ id: string }> {
  const res = await fetch(`/api/dashboard/contracts/${contractId}/documents/${documentId}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to remove document");
  return data;
}

export function useRemoveContractDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeDocument,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dashboardContracts() }),
  });
}
