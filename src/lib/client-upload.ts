import { createClient } from "@/lib/supabase/client";
import { optimizeImagesForUpload } from "@/lib/client-image";
import type { ListingImageDescriptor } from "@/schemas/listing.schema";

// Must match PROPERTY_IMAGES_BUCKET in src/lib/supabase/storage.ts.
const PROPERTY_IMAGES_BUCKET = "property-images";
// Must match CONTRACT_DOCUMENTS_BUCKET in src/lib/supabase/storage.ts.
const CONTRACT_DOCUMENTS_BUCKET = "contract-documents";

type UploadTicket = { imageId: string; storagePath: string; token: string };

/** Run async work over a list with bounded concurrency. */
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

async function postJson(url: string, body: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(data?.error ?? "Failed to prepare image upload");
  }
  return data;
}

/**
 * Uploads each optimized file directly to storage using its signed-URL ticket,
 * then returns the descriptors (in input order) to send to the create/add API.
 */
async function uploadWithTickets(
  tickets: UploadTicket[],
  optimized: { file: File; width: number | null; height: number | null }[],
  originalNames: string[],
): Promise<ListingImageDescriptor[]> {
  const supabase = createClient();

  await runWithConcurrency(tickets, 4, async (ticket, index) => {
    const file = optimized[index].file;
    const { error } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .uploadToSignedUrl(ticket.storagePath, ticket.token, file, { contentType: file.type });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
  });

  return tickets.map((ticket, index) => ({
    imageId: ticket.imageId,
    storagePath: ticket.storagePath,
    originalFileName: originalNames[index],
    mimeType: optimized[index].file.type,
    width: optimized[index].width,
    height: optimized[index].height,
  }));
}

/**
 * Optimize + upload images for a brand-new listing. Returns the server-issued
 * `propertyId` (pass it back to POST /api/listings so paths line up) and the
 * image descriptors. Empty input is valid (e.g. a draft with no images).
 */
export async function uploadImagesForNewListing(
  files: File[],
): Promise<{ propertyId: string | null; descriptors: ListingImageDescriptor[] }> {
  if (files.length === 0) return { propertyId: null, descriptors: [] };

  const optimized = await optimizeImagesForUpload(files);
  const ticketReq = {
    files: optimized.map((o) => ({ name: o.file.name, type: o.file.type, size: o.file.size })),
  };

  const data = await postJson("/api/listings/uploads", ticketReq);
  const propertyId = String(data.propertyId);
  const tickets = data.tickets as UploadTicket[];

  const descriptors = await uploadWithTickets(
    tickets,
    optimized,
    files.map((f) => f.name),
  );
  return { propertyId, descriptors };
}

/** Optimize + upload images to add to an existing listing. */
export async function uploadImagesForExistingListing(
  listingId: string,
  files: File[],
): Promise<ListingImageDescriptor[]> {
  if (files.length === 0) return [];

  const optimized = await optimizeImagesForUpload(files);
  const ticketReq = {
    files: optimized.map((o) => ({ name: o.file.name, type: o.file.type, size: o.file.size })),
  };

  const data = await postJson(`/api/listings/${listingId}/images/uploads`, ticketReq);
  const tickets = data.tickets as UploadTicket[];

  return uploadWithTickets(tickets, optimized, files.map((f) => f.name));
}

// ── Contract documents ──────────────────────────────────────────────────────

type ContractDocumentTicket = { documentId: string; storagePath: string; token: string };

/**
 * Uploads a single PDF/DOC/DOCX directly to storage via a signed URL, then
 * finalizes it against the contract record. Returns the saved document row.
 */
export async function uploadContractDocument(
  contractId: string,
  file: File,
): Promise<{ id: string; fileName: string; url: string; mimeType: string; sizeBytes: number; createdAt: string }> {
  const ticketData = await postJson(`/api/dashboard/contracts/${contractId}/documents/upload-ticket`, {
    name: file.name,
    type: file.type,
  });
  const ticket = ticketData.ticket as ContractDocumentTicket;

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(CONTRACT_DOCUMENTS_BUCKET)
    .uploadToSignedUrl(ticket.storagePath, ticket.token, file, { contentType: file.type });
  if (error) throw new Error(`Document upload failed: ${error.message}`);

  const finalized = await postJson(`/api/dashboard/contracts/${contractId}/documents`, {
    storagePath: ticket.storagePath,
    fileName: file.name,
  });
  return finalized.document as {
    id: string; fileName: string; url: string; mimeType: string; sizeBytes: number; createdAt: string;
  };
}
