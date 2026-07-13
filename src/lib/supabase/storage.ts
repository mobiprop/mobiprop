import "server-only";

import { randomUUID } from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { LISTING_IMAGE_MAX_BYTES } from "@/schemas/listing.schema";
import { BLOG_COVER_MAX_BYTES } from "@/schemas/blog.schema";

const AVATAR_BUCKET = "avatars";
const PROPERTY_IMAGES_BUCKET = "property-images";
const OPPORTUNITY_DOCUMENTS_BUCKET = "opportunity-documents";
const BLOG_IMAGES_BUCKET = "blog-images";
const CHAT_ATTACHMENTS_BUCKET = "chat-attachments";

export const OPPORTUNITY_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024; // 10MB, matches the upload UI's stated cap
export const OPPORTUNITY_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function extensionForDocumentFile(mimeType: string, fileName: string): string {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "application/msword") return "doc";
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  return fileName.split(".").pop()?.toLowerCase() || "bin";
}

// Keep the bucket's hard cap in step with the per-file schema limit. Note:
// Supabase also enforces a project-wide upload size limit (Dashboard →
// Storage → Settings) which a bucket limit can't exceed — raise that too if
// you need files larger than the project default.
const PROPERTY_IMAGES_FILE_LIMIT = LISTING_IMAGE_MAX_BYTES;
const PROPERTY_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

function extensionForMime(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

/**
 * Uploads a new avatar for the user, replacing any existing one so a user
 * never has more than one stored profile picture at a time.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createAdminClient();

  await removeAvatar(userId);

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(`Failed to upload photo: ${error.message}`);

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  // Cache-bust so the new image shows immediately even though the path is stable.
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Removes any stored avatar(s) for the user. */
export async function removeAvatar(userId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase.storage.from(AVATAR_BUCKET).list(userId);
  if (existing?.length) {
    await supabase.storage
      .from(AVATAR_BUCKET)
      .remove(existing.map((f) => `${userId}/${f.name}`));
  }
}

/**
 * Stages a photo picked before an invite is accepted — no Profile id exists
 * yet, so it can't live at its final `${userId}/avatar.*` path. Returns the
 * storage path (not a public URL); promoted via promoteInvitationAvatar once
 * the invite is accepted.
 */
export async function uploadInvitationAvatar(invitationId: string, file: File): Promise<string> {
  const supabase = createAdminClient();

  await removeInvitationAvatar(invitationId);

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `invites/${invitationId}/avatar.${ext}`;

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(`Failed to upload photo: ${error.message}`);

  return path;
}

/** Removes any staged invitation avatar(s). */
export async function removeInvitationAvatar(invitationId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase.storage.from(AVATAR_BUCKET).list(`invites/${invitationId}`);
  if (existing?.length) {
    await supabase.storage
      .from(AVATAR_BUCKET)
      .remove(existing.map((f) => `invites/${invitationId}/${f.name}`));
  }
}

/**
 * Moves a staged invitation avatar to the new Profile's permanent path once
 * the invite is accepted. Best-effort: a failure here never blocks account
 * creation — the agent can just re-upload their photo from Edit Agent.
 */
export async function promoteInvitationAvatar(
  avatarPath: string,
  profileId: string,
): Promise<string | null> {
  const supabase = createAdminClient();
  const ext = avatarPath.split(".").pop()?.toLowerCase() || "jpg";
  const newPath = `${profileId}/avatar.${ext}`;

  const { error: copyError } = await supabase.storage.from(AVATAR_BUCKET).copy(avatarPath, newPath);
  if (copyError) {
    console.error("[storage] failed to promote invitation avatar", copyError);
    return null;
  }
  await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath]);

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(newPath);
  return `${data.publicUrl}?v=${Date.now()}`;
}

// ── Property images ───────────────────────────────────────────────────────────
//
// Listings are public, so the bucket is public-read; writes only ever happen
// here (service role) after the caller passed the listings permission checks.

let propertyBucketReady = false;

/**
 * Ensures the property-images bucket exists (idempotent per process). It is
 * public-read; writes happen via short-lived signed upload URLs minted below.
 *
 * Raising the bucket's fileSizeLimit/allowedMimeTypes is best-effort: Supabase
 * rejects a bucket limit above the project-wide upload limit (Dashboard →
 * Storage → Settings). Such a rejection must never break uploads — the bucket
 * simply keeps whatever limit the project allows — so we log and carry on.
 */
async function ensurePropertyImagesBucket(): Promise<void> {
  if (propertyBucketReady) return;

  const supabase = createAdminClient();
  const desiredOptions = {
    public: true,
    fileSizeLimit: PROPERTY_IMAGES_FILE_LIMIT,
    allowedMimeTypes: PROPERTY_IMAGE_MIME_TYPES,
  };

  const { data: existing } = await supabase.storage.getBucket(PROPERTY_IMAGES_BUCKET);
  if (existing) {
    const { error: updateError } = await supabase.storage.updateBucket(
      PROPERTY_IMAGES_BUCKET,
      desiredOptions,
    );
    if (updateError) {
      console.error("[storage] could not raise property-images bucket limits", updateError.message);
    }
    propertyBucketReady = true;
    return;
  }

  // Bucket doesn't exist — create it. If the desired fileSizeLimit exceeds the
  // project cap, retry without an explicit limit so it still gets created.
  let { error } = await supabase.storage.createBucket(PROPERTY_IMAGES_BUCKET, desiredOptions);
  if (error && !/already exists/i.test(error.message)) {
    ({ error } = await supabase.storage.createBucket(PROPERTY_IMAGES_BUCKET, {
      public: true,
      allowedMimeTypes: PROPERTY_IMAGE_MIME_TYPES,
    }));
  }
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Failed to create ${PROPERTY_IMAGES_BUCKET} bucket: ${error.message}`);
  }
  propertyBucketReady = true;
}

export type PropertyImageUploadTicket = {
  imageId: string;
  storagePath: string;
  signedUrl: string;
  token: string;
  originalFileName: string;
  mimeType: string;
};

/**
 * Mints one signed upload URL per file under `{propertyId}/{imageId}.{ext}`.
 * The browser uploads directly to these paths, so the bytes never pass through
 * the serverless function (no request-body size limit). Paths and ids are
 * server-generated — the client never chooses where its file lands.
 */
export async function mintPropertyImageUploadTickets(
  propertyId: string,
  files: { name: string; type: string }[],
): Promise<PropertyImageUploadTicket[]> {
  await ensurePropertyImagesBucket();
  const supabase = createAdminClient();

  const tickets: PropertyImageUploadTicket[] = [];
  for (const file of files) {
    const imageId = randomUUID();
    const storagePath = `${propertyId}/${imageId}.${extensionForMime(file.type)}`;
    const { data, error } = await supabase.storage
      .from(PROPERTY_IMAGES_BUCKET)
      .createSignedUploadUrl(storagePath);
    if (error || !data) {
      throw new Error(`Failed to create upload URL: ${error?.message ?? "unknown error"}`);
    }
    tickets.push({
      imageId,
      storagePath,
      signedUrl: data.signedUrl,
      token: data.token,
      originalFileName: file.name,
      mimeType: file.type,
    });
  }
  return tickets;
}

export type VerifiedPropertyImage = {
  storagePath: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
};

/**
 * Confirms that every expected object was actually uploaded under `propertyId`,
 * reading the authoritative size + mime type from storage (never trusting the
 * client). Returns the verified objects with their public URLs, or throws if
 * any object is missing or violates the size/type limits.
 */
export async function verifyUploadedPropertyImages(
  propertyId: string,
  storagePaths: string[],
): Promise<VerifiedPropertyImage[]> {
  if (storagePaths.length === 0) return [];
  const supabase = createAdminClient();

  const { data: objects, error } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .list(propertyId, { limit: 1000 });
  if (error) throw new Error(`Failed to verify uploaded images: ${error.message}`);

  const byName = new Map(objects?.map((object) => [object.name, object]) ?? []);

  return storagePaths.map((storagePath) => {
    if (!storagePath.startsWith(`${propertyId}/`)) {
      throw new Error("Image path does not belong to this listing.");
    }
    const name = storagePath.slice(propertyId.length + 1);
    const object = byName.get(name);
    if (!object) throw new Error("An uploaded image is missing from storage.");

    const sizeBytes = Number(object.metadata?.size ?? 0);
    const mimeType = String(object.metadata?.mimetype ?? "");
    if (!PROPERTY_IMAGE_MIME_TYPES.includes(mimeType)) {
      throw new Error("An uploaded image has an unsupported type.");
    }
    if (sizeBytes <= 0 || sizeBytes > LISTING_IMAGE_MAX_BYTES) {
      throw new Error("An uploaded image violates the size limit.");
    }

    const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(storagePath);
    return { storagePath, url: data.publicUrl, sizeBytes, mimeType };
  });
}

/** Removes the given listing image objects. Best-effort: errors are logged. */
export async function removePropertyImages(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return;
  const supabase = createAdminClient();

  const { error } = await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove(storagePaths);
  if (error) console.error("[storage] failed to remove listing images", error.message);
}

// ── Opportunity documents ───────────────────────────────────────────────────
//
// Signed-upload-URL, private bucket, server-authoritative verification — a
// file an agent attaches by hand to an Opportunity. Distinct from a DocuSign
// envelope's tracked signing flow.

let opportunityDocumentsBucketReady = false;

async function ensureOpportunityDocumentsBucket(): Promise<void> {
  if (opportunityDocumentsBucketReady) return;

  const supabase = createAdminClient();
  const desiredOptions = {
    public: false,
    fileSizeLimit: OPPORTUNITY_DOCUMENT_MAX_BYTES,
    allowedMimeTypes: OPPORTUNITY_DOCUMENT_MIME_TYPES,
  };

  const { data: existing } = await supabase.storage.getBucket(OPPORTUNITY_DOCUMENTS_BUCKET);
  if (existing) {
    const { error: updateError } = await supabase.storage.updateBucket(OPPORTUNITY_DOCUMENTS_BUCKET, desiredOptions);
    if (updateError) {
      console.error("[storage] could not raise opportunity-documents bucket limits", updateError.message);
    }
    opportunityDocumentsBucketReady = true;
    return;
  }

  let { error } = await supabase.storage.createBucket(OPPORTUNITY_DOCUMENTS_BUCKET, desiredOptions);
  if (error && !/already exists/i.test(error.message)) {
    ({ error } = await supabase.storage.createBucket(OPPORTUNITY_DOCUMENTS_BUCKET, {
      public: false,
      allowedMimeTypes: OPPORTUNITY_DOCUMENT_MIME_TYPES,
    }));
  }
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Failed to create ${OPPORTUNITY_DOCUMENTS_BUCKET} bucket: ${error.message}`);
  }
  opportunityDocumentsBucketReady = true;
}

export type OpportunityDocumentUploadTicket = {
  documentId: string;
  storagePath: string;
  signedUrl: string;
  token: string;
};

/** Mints a signed upload URL under `{opportunityId}/{documentId}.{ext}`. */
export async function mintOpportunityDocumentUploadTicket(
  opportunityId: string,
  file: { name: string; type: string },
): Promise<OpportunityDocumentUploadTicket> {
  if (!OPPORTUNITY_DOCUMENT_MIME_TYPES.includes(file.type)) {
    throw new Error("Only PDF, DOC, and DOCX files are supported.");
  }

  await ensureOpportunityDocumentsBucket();
  const supabase = createAdminClient();

  const documentId = randomUUID();
  const storagePath = `${opportunityId}/${documentId}.${extensionForDocumentFile(file.type, file.name)}`;
  const { data, error } = await supabase.storage.from(OPPORTUNITY_DOCUMENTS_BUCKET).createSignedUploadUrl(storagePath);
  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message ?? "unknown error"}`);
  }

  return { documentId, storagePath, signedUrl: data.signedUrl, token: data.token };
}

export type VerifiedOpportunityDocument = {
  storagePath: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
};

/** Confirms the upload landed in storage and reads its authoritative size/type — never trusts the client. */
export async function verifyUploadedOpportunityDocument(
  opportunityId: string,
  storagePath: string,
): Promise<VerifiedOpportunityDocument> {
  if (!storagePath.startsWith(`${opportunityId}/`)) {
    throw new Error("Document path does not belong to this opportunity.");
  }
  const supabase = createAdminClient();

  const name = storagePath.slice(opportunityId.length + 1);
  const { data: objects, error } = await supabase.storage.from(OPPORTUNITY_DOCUMENTS_BUCKET).list(opportunityId, { limit: 1000 });
  if (error) throw new Error(`Failed to verify uploaded document: ${error.message}`);

  const object = objects?.find((o) => o.name === name);
  if (!object) throw new Error("Uploaded document is missing from storage.");

  const sizeBytes = Number(object.metadata?.size ?? 0);
  const mimeType = String(object.metadata?.mimetype ?? "");
  if (!OPPORTUNITY_DOCUMENT_MIME_TYPES.includes(mimeType)) {
    throw new Error("Uploaded document has an unsupported type.");
  }
  if (sizeBytes <= 0 || sizeBytes > OPPORTUNITY_DOCUMENT_MAX_BYTES) {
    throw new Error("Uploaded document violates the size limit.");
  }

  // Bucket is private — mint a long-lived signed URL rather than a public one.
  const { data: signed, error: signError } = await supabase.storage
    .from(OPPORTUNITY_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
  if (signError || !signed) throw new Error(`Failed to sign document URL: ${signError?.message ?? "unknown error"}`);

  return { storagePath, url: signed.signedUrl, sizeBytes, mimeType };
}

/** Removes a single opportunity document object. Best-effort: errors are logged. */
export async function removeOpportunityDocumentObject(storagePath: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(OPPORTUNITY_DOCUMENTS_BUCKET).remove([storagePath]);
  if (error) console.error("[storage] failed to remove opportunity document", error.message);
}

// ── DocuSign custom contract documents ──────────────────────────────────────
//
// Signed-upload-URL, private bucket, server-authoritative verification — an
// ad-hoc PDF/DOC/DOCX a staff member uploads to send via DocuSign's "Upload
// Custom Contract" flow (as opposed to a reusable DocuSign template). Kept
// separate from OPPORTUNITY_DOCUMENTS_BUCKET because a custom contract can
// be sent standalone with no Opportunity yet, so there's no opportunityId to
// scope the path by at upload time (mirrors how sending from a template
// works today). Same mime allowlist/size cap as opportunity documents.

const DOCUSIGN_DOCUMENTS_BUCKET = "docusign-documents";
let docusignDocumentsBucketReady = false;

async function ensureDocusignDocumentsBucket(): Promise<void> {
  if (docusignDocumentsBucketReady) return;

  const supabase = createAdminClient();
  const desiredOptions = {
    public: false,
    fileSizeLimit: OPPORTUNITY_DOCUMENT_MAX_BYTES,
    allowedMimeTypes: OPPORTUNITY_DOCUMENT_MIME_TYPES,
  };

  const { data: existing } = await supabase.storage.getBucket(DOCUSIGN_DOCUMENTS_BUCKET);
  if (existing) {
    const { error: updateError } = await supabase.storage.updateBucket(DOCUSIGN_DOCUMENTS_BUCKET, desiredOptions);
    if (updateError) {
      console.error("[storage] could not raise docusign-documents bucket limits", updateError.message);
    }
    docusignDocumentsBucketReady = true;
    return;
  }

  let { error } = await supabase.storage.createBucket(DOCUSIGN_DOCUMENTS_BUCKET, desiredOptions);
  if (error && !/already exists/i.test(error.message)) {
    ({ error } = await supabase.storage.createBucket(DOCUSIGN_DOCUMENTS_BUCKET, {
      public: false,
      allowedMimeTypes: OPPORTUNITY_DOCUMENT_MIME_TYPES,
    }));
  }
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Failed to create ${DOCUSIGN_DOCUMENTS_BUCKET} bucket: ${error.message}`);
  }
  docusignDocumentsBucketReady = true;
}

export type DocusignDocumentUploadTicket = {
  uploadId: string;
  storagePath: string;
  signedUrl: string;
  token: string;
};

/** Mints a signed upload URL under `pending/{uploadId}.{ext}` — no owning envelope exists yet at upload time. */
export async function mintDocusignDocumentUploadTicket(file: {
  name: string;
  type: string;
}): Promise<DocusignDocumentUploadTicket> {
  if (!OPPORTUNITY_DOCUMENT_MIME_TYPES.includes(file.type)) {
    throw new Error("Only PDF, DOC, and DOCX files are supported.");
  }

  await ensureDocusignDocumentsBucket();
  const supabase = createAdminClient();

  const uploadId = randomUUID();
  const storagePath = `pending/${uploadId}.${extensionForDocumentFile(file.type, file.name)}`;
  const { data, error } = await supabase.storage.from(DOCUSIGN_DOCUMENTS_BUCKET).createSignedUploadUrl(storagePath);
  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message ?? "unknown error"}`);
  }

  return { uploadId, storagePath, signedUrl: data.signedUrl, token: data.token };
}

export type ReadDocusignDocument = {
  url: string;
  sizeBytes: number;
  mimeType: string;
  buffer: Buffer;
};

/**
 * Verifies the upload landed in storage with an authoritative size/type
 * (never trusting the client), and downloads its bytes so the caller can
 * base64-encode them for the DocuSign "create envelope from document" call.
 */
export async function readUploadedDocusignDocument(storagePath: string): Promise<ReadDocusignDocument> {
  if (!storagePath.startsWith("pending/")) {
    throw new Error("Document path is not a pending DocuSign upload.");
  }
  const supabase = createAdminClient();

  const { data: objects, error } = await supabase.storage.from(DOCUSIGN_DOCUMENTS_BUCKET).list("pending", { limit: 1000 });
  if (error) throw new Error(`Failed to verify uploaded document: ${error.message}`);

  const name = storagePath.slice("pending/".length);
  const object = objects?.find((o) => o.name === name);
  if (!object) throw new Error("Uploaded document is missing from storage.");

  const sizeBytes = Number(object.metadata?.size ?? 0);
  const mimeType = String(object.metadata?.mimetype ?? "");
  if (!OPPORTUNITY_DOCUMENT_MIME_TYPES.includes(mimeType)) {
    throw new Error("Uploaded document has an unsupported type.");
  }
  if (sizeBytes <= 0 || sizeBytes > OPPORTUNITY_DOCUMENT_MAX_BYTES) {
    throw new Error("Uploaded document violates the size limit.");
  }

  const { data: downloaded, error: downloadError } = await supabase.storage
    .from(DOCUSIGN_DOCUMENTS_BUCKET)
    .download(storagePath);
  if (downloadError || !downloaded) {
    throw new Error(`Failed to read uploaded document: ${downloadError?.message ?? "unknown error"}`);
  }
  const buffer = Buffer.from(await downloaded.arrayBuffer());

  const { data: signed, error: signError } = await supabase.storage
    .from(DOCUSIGN_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
  if (signError || !signed) throw new Error(`Failed to sign document URL: ${signError?.message ?? "unknown error"}`);

  return { url: signed.signedUrl, sizeBytes, mimeType, buffer };
}

/** Removes a pending custom-contract upload. Best-effort: errors are logged. Called when the DocuSign send call fails after upload. */
export async function removeDocusignDocumentObject(storagePath: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(DOCUSIGN_DOCUMENTS_BUCKET).remove([storagePath]);
  if (error) console.error("[storage] failed to remove docusign document", error.message);
}

// ── Blog cover images ────────────────────────────────────────────────────────
//
// Blog covers are public (they'll render on the public site once wired), so the
// bucket is public-read and covers get a stable public URL. Same signed-upload
// pattern as property images — the browser uploads the (already client-side
// optimized) file directly to storage; the server only mints the ticket.

const BLOG_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
let blogBucketReady = false;

async function ensureBlogImagesBucket(): Promise<void> {
  if (blogBucketReady) return;

  const supabase = createAdminClient();
  const desiredOptions = {
    public: true,
    fileSizeLimit: BLOG_COVER_MAX_BYTES,
    allowedMimeTypes: BLOG_IMAGE_MIME_TYPES,
  };

  const { data: existing } = await supabase.storage.getBucket(BLOG_IMAGES_BUCKET);
  if (existing) {
    const { error: updateError } = await supabase.storage.updateBucket(BLOG_IMAGES_BUCKET, desiredOptions);
    if (updateError) {
      console.error("[storage] could not raise blog-images bucket limits", updateError.message);
    }
    blogBucketReady = true;
    return;
  }

  let { error } = await supabase.storage.createBucket(BLOG_IMAGES_BUCKET, desiredOptions);
  if (error && !/already exists/i.test(error.message)) {
    ({ error } = await supabase.storage.createBucket(BLOG_IMAGES_BUCKET, {
      public: true,
      allowedMimeTypes: BLOG_IMAGE_MIME_TYPES,
    }));
  }
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Failed to create ${BLOG_IMAGES_BUCKET} bucket: ${error.message}`);
  }
  blogBucketReady = true;
}

export type BlogCoverUploadTicket = {
  storagePath: string;
  signedUrl: string;
  token: string;
  publicUrl: string;
};

/**
 * Mints a single signed upload URL for a blog cover under `covers/{uuid}.{ext}`,
 * returning the public URL the caller stores on the post once the upload lands.
 */
export async function mintBlogCoverUploadTicket(file: {
  name: string;
  type: string;
}): Promise<BlogCoverUploadTicket> {
  await ensureBlogImagesBucket();
  const supabase = createAdminClient();

  const storagePath = `covers/${randomUUID()}.${extensionForMime(file.type)}`;
  const { data, error } = await supabase.storage
    .from(BLOG_IMAGES_BUCKET)
    .createSignedUploadUrl(storagePath);
  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message ?? "unknown error"}`);
  }

  const { data: pub } = supabase.storage.from(BLOG_IMAGES_BUCKET).getPublicUrl(storagePath);
  return { storagePath, signedUrl: data.signedUrl, token: data.token, publicUrl: pub.publicUrl };
}

// ── Chat attachments ────────────────────────────────────────────────────────
//
// Same signed-upload-URL / private-bucket / server-authoritative-verification
// pattern as contract documents, but batched (a message may carry several
// files) and covering both images and common document types.

export const CHAT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10MB per file — adjustable
export const CHAT_ATTACHMENT_MAX_COUNT = 6; // per message — adjustable
const CHAT_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

function extensionForChatAttachment(mimeType: string, fileName: string): string {
  const known: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  };
  return known[mimeType] ?? fileName.split(".").pop()?.toLowerCase() ?? "bin";
}

let chatAttachmentsBucketReady = false;

async function ensureChatAttachmentsBucket(): Promise<void> {
  if (chatAttachmentsBucketReady) return;

  const supabase = createAdminClient();
  // Private bucket — chat content is never publicly readable; reads go through
  // a signed URL minted below, same as contract documents.
  const desiredOptions = {
    public: false,
    fileSizeLimit: CHAT_ATTACHMENT_MAX_BYTES,
    allowedMimeTypes: CHAT_ATTACHMENT_MIME_TYPES,
  };

  const { data: existing } = await supabase.storage.getBucket(CHAT_ATTACHMENTS_BUCKET);
  if (existing) {
    const { error: updateError } = await supabase.storage.updateBucket(CHAT_ATTACHMENTS_BUCKET, desiredOptions);
    if (updateError) {
      console.error("[storage] could not raise chat-attachments bucket limits", updateError.message);
    }
    chatAttachmentsBucketReady = true;
    return;
  }

  let { error } = await supabase.storage.createBucket(CHAT_ATTACHMENTS_BUCKET, desiredOptions);
  if (error && !/already exists/i.test(error.message)) {
    ({ error } = await supabase.storage.createBucket(CHAT_ATTACHMENTS_BUCKET, {
      public: false,
      allowedMimeTypes: CHAT_ATTACHMENT_MIME_TYPES,
    }));
  }
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Failed to create ${CHAT_ATTACHMENTS_BUCKET} bucket: ${error.message}`);
  }
  chatAttachmentsBucketReady = true;
}

export type ChatAttachmentUploadTicket = {
  attachmentId: string;
  storagePath: string;
  signedUrl: string;
  token: string;
  originalFileName: string;
  mimeType: string;
};

/**
 * Mints one signed upload URL per file under `{conversationId}/{attachmentId}.{ext}`.
 * The browser uploads directly to these paths (bytes never pass through the
 * serverless function); paths/ids are server-generated, the client never
 * chooses where its file lands.
 */
export async function mintChatAttachmentUploadTickets(
  conversationId: string,
  files: { name: string; type: string }[],
): Promise<ChatAttachmentUploadTicket[]> {
  const invalid = files.find((f) => !CHAT_ATTACHMENT_MIME_TYPES.includes(f.type));
  if (invalid) throw new Error(`Unsupported attachment type: ${invalid.type}`);
  if (files.length > CHAT_ATTACHMENT_MAX_COUNT) {
    throw new Error(`A message can have at most ${CHAT_ATTACHMENT_MAX_COUNT} attachments.`);
  }

  await ensureChatAttachmentsBucket();
  const supabase = createAdminClient();

  const tickets: ChatAttachmentUploadTicket[] = [];
  for (const file of files) {
    const attachmentId = randomUUID();
    const storagePath = `${conversationId}/${attachmentId}.${extensionForChatAttachment(file.type, file.name)}`;
    const { data, error } = await supabase.storage.from(CHAT_ATTACHMENTS_BUCKET).createSignedUploadUrl(storagePath);
    if (error || !data) {
      throw new Error(`Failed to create upload URL: ${error?.message ?? "unknown error"}`);
    }
    tickets.push({
      attachmentId,
      storagePath,
      signedUrl: data.signedUrl,
      token: data.token,
      originalFileName: file.name,
      mimeType: file.type,
    });
  }
  return tickets;
}

export type VerifiedChatAttachment = {
  storagePath: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
};

/**
 * Confirms every expected object actually landed under `conversationId`,
 * reading authoritative size/mime type from storage (never trusting the
 * client), and mints a signed read URL for each (bucket is private).
 */
export async function verifyUploadedChatAttachments(
  conversationId: string,
  storagePaths: string[],
): Promise<VerifiedChatAttachment[]> {
  if (storagePaths.length === 0) return [];
  const supabase = createAdminClient();

  const { data: objects, error } = await supabase.storage
    .from(CHAT_ATTACHMENTS_BUCKET)
    .list(conversationId, { limit: 1000 });
  if (error) throw new Error(`Failed to verify uploaded attachments: ${error.message}`);

  const byName = new Map(objects?.map((object) => [object.name, object]) ?? []);

  const results: VerifiedChatAttachment[] = [];
  for (const storagePath of storagePaths) {
    if (!storagePath.startsWith(`${conversationId}/`)) {
      throw new Error("Attachment path does not belong to this conversation.");
    }
    const name = storagePath.slice(conversationId.length + 1);
    const object = byName.get(name);
    if (!object) throw new Error("An uploaded attachment is missing from storage.");

    const sizeBytes = Number(object.metadata?.size ?? 0);
    const mimeType = String(object.metadata?.mimetype ?? "");
    if (!CHAT_ATTACHMENT_MIME_TYPES.includes(mimeType)) {
      throw new Error("An uploaded attachment has an unsupported type.");
    }
    if (sizeBytes <= 0 || sizeBytes > CHAT_ATTACHMENT_MAX_BYTES) {
      throw new Error("An uploaded attachment violates the size limit.");
    }

    const { data: signed, error: signError } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
    if (signError || !signed) {
      throw new Error(`Failed to sign attachment URL: ${signError?.message ?? "unknown error"}`);
    }

    results.push({ storagePath, url: signed.signedUrl, sizeBytes, mimeType });
  }
  return results;
}

/** Removes the given chat attachment objects. Best-effort: errors are logged. */
export async function removeChatAttachmentObjects(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return;
  const supabase = createAdminClient();

  const { error } = await supabase.storage.from(CHAT_ATTACHMENTS_BUCKET).remove(storagePaths);
  if (error) console.error("[storage] failed to remove chat attachments", error.message);
}
