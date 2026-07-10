import "server-only";

import { createSign } from "crypto";

// Server-side DocuSign eSignature client (JWT grant). No SDK — raw fetch,
// same convention as src/lib/maps.ts and src/lib/email.ts. Credentials are
// env-var only (no DB-backed credential storage precedent in this codebase);
// see [[docusign-credentials]].
//
// One-time setup on the DocuSign side before this works:
// 1. Create an Integration Key (Client ID) in the DocuSign developer console.
// 2. Generate an RSA keypair for it; store the private key in
//    DOCUSIGN_PRIVATE_KEY.
// 3. Grant JWT consent once, logged in as the impersonated user, by visiting:
//    https://{DOCUSIGN_AUTH_SERVER}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id={DOCUSIGN_INTEGRATION_KEY}&redirect_uri={any registered URI}

const AUTH_SERVER = process.env.DOCUSIGN_AUTH_SERVER || "account-d.docusign.com";
const BASE_PATH = process.env.DOCUSIGN_BASE_PATH || "https://demo.docusign.net/restapi";
const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;
const USER_ID = process.env.DOCUSIGN_USER_ID;
const ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;
const PRIVATE_KEY = process.env.DOCUSIGN_PRIVATE_KEY;

export function isDocusignConfigured(): boolean {
  return Boolean(INTEGRATION_KEY && USER_ID && ACCOUNT_ID && PRIVATE_KEY);
}

export type DocusignConfigStatus = {
  integrationKey: boolean;
  userId: boolean;
  accountId: boolean;
  privateKey: boolean;
  authServer: string;
  basePath: string;
};

/** Non-secret configured/not-configured status for the Settings tab's read-only display. */
export function getDocusignConfigStatus(): DocusignConfigStatus {
  return {
    integrationKey: Boolean(INTEGRATION_KEY),
    userId: Boolean(USER_ID),
    accountId: Boolean(ACCOUNT_ID),
    privateKey: Boolean(PRIVATE_KEY),
    authServer: AUTH_SERVER,
    basePath: BASE_PATH,
  };
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** Normalizes a PEM private key that may have been pasted with literal `\n` escapes (common in .env files). */
function normalizePrivateKey(key: string): string {
  return key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
}

function buildJwtAssertion(): string {
  if (!INTEGRATION_KEY || !USER_ID || !PRIVATE_KEY) {
    throw new Error("DocuSign is not configured — missing Integration Key, User ID, or Private Key.");
  }
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: INTEGRATION_KEY,
    sub: USER_ID,
    aud: AUTH_SERVER,
    iat: now,
    exp: now + 3600,
    scope: "signature impersonation",
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;

  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(normalizePrivateKey(PRIVATE_KEY)).toString("base64url");

  return `${signingInput}.${signature}`;
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Refresh a minute before real expiry so an in-flight request never gets a
  // token that dies mid-call.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const response = await fetch(`https://${AUTH_SERVER}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: buildJwtAssertion(),
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`DocuSign auth failed (${response.status}): ${text || response.statusText}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

async function docusignFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!ACCOUNT_ID) throw new Error("DocuSign is not configured — missing Account ID.");
  const token = await getAccessToken();

  const response = await fetch(`${BASE_PATH}/v2.1/accounts/${ACCOUNT_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`DocuSign API error (${response.status}): ${text || response.statusText}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// ── Templates ────────────────────────────────────────────────────────────────

export type DocusignTemplateSummary = {
  templateId: string;
  name: string;
  description: string | null;
  emailSubject: string | null;
};

type RawTemplateListItem = {
  templateId: string;
  name: string;
  description?: string;
  emailSubject?: string;
};

/**
 * Lists templates live from DocuSign — no local cache/model. The Templates
 * tab shows name/description; page/field counts aren't in this list endpoint
 * and per-template detail fetches are deliberately skipped to avoid N+1 calls
 * (out of scope per the migration plan).
 */
export async function listTemplates(): Promise<DocusignTemplateSummary[]> {
  const data = await docusignFetch<{ envelopeTemplates?: RawTemplateListItem[] }>(
    "/templates?order_by=name&order=asc",
  );
  return (data.envelopeTemplates ?? []).map((t) => ({
    templateId: t.templateId,
    name: t.name,
    description: t.description ?? null,
    emailSubject: t.emailSubject ?? null,
  }));
}

/** The template's first signer role name — required to fill `templateRoles` when creating an envelope. */
async function getFirstTemplateRoleName(templateId: string): Promise<string> {
  const data = await docusignFetch<{ signers?: { roleName?: string }[] }>(
    `/templates/${templateId}/recipients`,
  );
  const roleName = data.signers?.[0]?.roleName;
  if (!roleName) throw new Error("This DocuSign template has no signer role configured.");
  return roleName;
}

// ── Envelopes ────────────────────────────────────────────────────────────────

export type CreateEnvelopeInput = {
  templateId: string;
  recipientName: string;
  recipientEmail: string;
  propertyReference?: string;
  expiresInDays?: number;
  message?: string;
};

export type CreatedEnvelope = { envelopeId: string; status: string };

export async function createEnvelopeFromTemplate(input: CreateEnvelopeInput): Promise<CreatedEnvelope> {
  const roleName = await getFirstTemplateRoleName(input.templateId);

  const body: Record<string, unknown> = {
    templateId: input.templateId,
    templateRoles: [
      {
        email: input.recipientEmail,
        name: input.recipientName,
        roleName,
      },
    ],
    emailSubject: input.message?.trim() || "Please review and sign this document",
    status: "sent",
  };
  if (input.expiresInDays) {
    body.expirationSettings = { expireEnabled: "true", expireAfter: String(input.expiresInDays) };
  }

  return docusignFetch<CreatedEnvelope>("/envelopes", { method: "POST", body: JSON.stringify(body) });
}

export async function getEnvelope(envelopeId: string): Promise<{ envelopeId: string; status: string }> {
  return docusignFetch(`/envelopes/${envelopeId}`);
}

export async function voidEnvelope(envelopeId: string, reason: string): Promise<void> {
  await docusignFetch(`/envelopes/${envelopeId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "voided", voidedReason: reason }),
  });
}

/** Triggers DocuSign to resend the signing-request email to every pending recipient. */
export async function resendEnvelope(envelopeId: string): Promise<void> {
  // resend_envelope=true requires the recipients to resend to in the body —
  // an empty body is rejected with "No recipients specified".
  const recipients = await docusignFetch<{ signers?: { recipientId?: string }[] }>(
    `/envelopes/${envelopeId}/recipients`,
  );
  const signers = (recipients.signers ?? [])
    .filter((s) => s.recipientId)
    .map((s) => ({ recipientId: s.recipientId }));
  if (signers.length === 0) throw new Error("This envelope has no signers to resend to.");

  await docusignFetch(`/envelopes/${envelopeId}/recipients?resend_envelope=true`, {
    method: "PUT",
    body: JSON.stringify({ signers }),
  });
}
