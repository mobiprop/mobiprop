"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import type { DocusignEnvelopeDto, DocusignSettingsDto, SendForSignatureInput, SendCustomContractInput, AttachSignedContractInput } from "@/features/integrations/docusign-actions";

type SendEnvelopeBody = ({ source: "TEMPLATE" } & SendForSignatureInput) | ({ source: "CUSTOM_UPLOAD" } & SendCustomContractInput);

async function postSend(body: SendEnvelopeBody): Promise<{ envelope: DocusignEnvelopeDto }> {
  const res = await fetch("/api/dashboard/docusign/envelopes/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to send envelope");
  return data;
}

export function useSendForSignatureMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postSend,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.docusignEnvelopes() }),
  });
}

async function postAttachSigned(body: AttachSignedContractInput): Promise<{ envelope: DocusignEnvelopeDto }> {
  const res = await fetch("/api/dashboard/docusign/envelopes/attach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to attach document");
  return data;
}

/** Custom upload assumed already signed outside the system — attaches it as a
 * completed contract with no DocuSign envelope, no signature request, no emails. */
export function useAttachSignedContractMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postAttachSigned,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.docusignEnvelopes() }),
  });
}

async function postVoid({ id, reason }: { id: string; reason: string }): Promise<{ id: string }> {
  const res = await fetch(`/api/dashboard/docusign/envelopes/${id}/void`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to void envelope");
  return data;
}

export function useVoidEnvelopeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postVoid,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.docusignEnvelopes() }),
  });
}

async function postResend(id: string): Promise<{ id: string }> {
  const res = await fetch(`/api/dashboard/docusign/envelopes/${id}/resend`, { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to resend envelope");
  return data;
}

export function useResendEnvelopeMutation() {
  return useMutation({ mutationFn: postResend });
}

async function patchSettings(body: Partial<DocusignSettingsDto>): Promise<{ settings: DocusignSettingsDto }> {
  const res = await fetch("/api/dashboard/docusign/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to save settings");
  return data;
}

export function useUpdateDocusignSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.docusignSettings() }),
  });
}

async function postAttach({ opportunityId, envelopeId }: { opportunityId: string; envelopeId: string }): Promise<{ id: string }> {
  const res = await fetch(`/api/dashboard/opportunities/${opportunityId}/envelope`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ envelopeId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to attach envelope");
  return data;
}

export function useAttachEnvelopeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postAttach,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.docusignEnvelopes() });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardOpportunities() });
    },
  });
}

async function postDetach({ opportunityId, envelopeId }: { opportunityId: string; envelopeId: string }): Promise<{ id: string }> {
  const res = await fetch(`/api/dashboard/opportunities/${opportunityId}/envelope`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ envelopeId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to detach envelope");
  return data;
}

export function useDetachEnvelopeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postDetach,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.docusignEnvelopes() });
      qc.invalidateQueries({ queryKey: queryKeys.dashboardOpportunities() });
    },
  });
}
