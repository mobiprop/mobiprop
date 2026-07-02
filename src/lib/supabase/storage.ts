import "server-only";

import { randomUUID } from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { LISTING_IMAGE_MAX_BYTES } from "@/schemas/listing.schema";
import { BLOG_COVER_MAX_BYTES } from "@/schemas/blog.schema";

const AVATAR_BUCKET = "avatars";
const PROPERTY_IMAGES_BUCKET = "property-images";
const CONTRACT_DOCUMENTS_BUCKET = "contract-documents";
const BLOG_IMAGES_BUCKET = "blog-images";

export const CONTRACT_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024; // 10MB, matches the upload UI's stated cap
const CONTRACT_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function extensionForContractDocument(mimeType: string, fileName: string): string {
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

// ── Contract documents ──────────────────────────────────────────────────────
//
// Same signed-upload-URL pattern as property images: a 10MB PDF would risk
// hitting the serverless function's request-body limit if it passed through
// a Next.js API route, so the browser uploads directly to storage and the
// server only mints the ticket beforehand and verifies the result after.

let contractDocumentsBucketReady = false;

async function ensureContractDocumentsBucket(): Promise<void> {
  if (contractDocumentsBucketReady) return;

  const supabase = createAdminClient();
  // Private bucket — unlike listing images, contract documents are not public.
  // Reads go through getPublicUrl() below only because this bucket also sets
  // `public: false`; callers fetch through a signed read instead.
  const desiredOptions = {
    public: false,
    fileSizeLimit: CONTRACT_DOCUMENT_MAX_BYTES,
    allowedMimeTypes: CONTRACT_DOCUMENT_MIME_TYPES,
  };

  const { data: existing } = await supabase.storage.getBucket(CONTRACT_DOCUMENTS_BUCKET);
  if (existing) {
    const { error: updateError } = await supabase.storage.updateBucket(CONTRACT_DOCUMENTS_BUCKET, desiredOptions);
    if (updateError) {
      console.error("[storage] could not raise contract-documents bucket limits", updateError.message);
    }
    contractDocumentsBucketReady = true;
    return;
  }

  let { error } = await supabase.storage.createBucket(CONTRACT_DOCUMENTS_BUCKET, desiredOptions);
  if (error && !/already exists/i.test(error.message)) {
    ({ error } = await supabase.storage.createBucket(CONTRACT_DOCUMENTS_BUCKET, {
      public: false,
      allowedMimeTypes: CONTRACT_DOCUMENT_MIME_TYPES,
    }));
  }
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Failed to create ${CONTRACT_DOCUMENTS_BUCKET} bucket: ${error.message}`);
  }
  contractDocumentsBucketReady = true;
}

export type ContractDocumentUploadTicket = {
  documentId: string;
  storagePath: string;
  signedUrl: string;
  token: string;
};

/** Mints a signed upload URL under `{contractId}/{documentId}.{ext}`. */
export async function mintContractDocumentUploadTicket(
  contractId: string,
  file: { name: string; type: string },
): Promise<ContractDocumentUploadTicket> {
  if (!CONTRACT_DOCUMENT_MIME_TYPES.includes(file.type)) {
    throw new Error("Only PDF, DOC, and DOCX files are supported.");
  }

  await ensureContractDocumentsBucket();
  const supabase = createAdminClient();

  const documentId = randomUUID();
  const storagePath = `${contractId}/${documentId}.${extensionForContractDocument(file.type, file.name)}`;
  const { data, error } = await supabase.storage.from(CONTRACT_DOCUMENTS_BUCKET).createSignedUploadUrl(storagePath);
  if (error || !data) {
    throw new Error(`Failed to create upload URL: ${error?.message ?? "unknown error"}`);
  }

  return { documentId, storagePath, signedUrl: data.signedUrl, token: data.token };
}

export type VerifiedContractDocument = {
  storagePath: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
};

/** Confirms the upload landed in storage and reads its authoritative size/type — never trusts the client. */
export async function verifyUploadedContractDocument(
  contractId: string,
  storagePath: string,
): Promise<VerifiedContractDocument> {
  if (!storagePath.startsWith(`${contractId}/`)) {
    throw new Error("Document path does not belong to this contract.");
  }
  const supabase = createAdminClient();

  const name = storagePath.slice(contractId.length + 1);
  const { data: objects, error } = await supabase.storage.from(CONTRACT_DOCUMENTS_BUCKET).list(contractId, { limit: 1000 });
  if (error) throw new Error(`Failed to verify uploaded document: ${error.message}`);

  const object = objects?.find((o) => o.name === name);
  if (!object) throw new Error("Uploaded document is missing from storage.");

  const sizeBytes = Number(object.metadata?.size ?? 0);
  const mimeType = String(object.metadata?.mimetype ?? "");
  if (!CONTRACT_DOCUMENT_MIME_TYPES.includes(mimeType)) {
    throw new Error("Uploaded document has an unsupported type.");
  }
  if (sizeBytes <= 0 || sizeBytes > CONTRACT_DOCUMENT_MAX_BYTES) {
    throw new Error("Uploaded document violates the size limit.");
  }

  // Bucket is private — mint a long-lived signed URL rather than a public one.
  const { data: signed, error: signError } = await supabase.storage
    .from(CONTRACT_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
  if (signError || !signed) throw new Error(`Failed to sign document URL: ${signError?.message ?? "unknown error"}`);

  return { storagePath, url: signed.signedUrl, sizeBytes, mimeType };
}

/** Removes a single contract document object. Best-effort: errors are logged. */
export async function removeContractDocumentObject(storagePath: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(CONTRACT_DOCUMENTS_BUCKET).remove([storagePath]);
  if (error) console.error("[storage] failed to remove contract document", error.message);
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
