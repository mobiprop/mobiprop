-- Secure agent/manager invitation flow (spec: ulrich-propiedades invite rework).
--
-- 1. Rename UserRole.CLIENT -> UserRole.USER. This is metadata-only: existing
--    rows/defaults referencing 'CLIENT' transparently resolve to 'USER',
--    no data rewrite needed.
ALTER TYPE "UserRole" RENAME VALUE 'CLIENT' TO 'USER';

-- 2. Rename AgentInvitationStatus -> InvitationStatus and CANCELLED -> REVOKED
--    to match the new invite flow's terminology.
ALTER TYPE "AgentInvitationStatus" RENAME TO "InvitationStatus";
ALTER TYPE "InvitationStatus" RENAME VALUE 'CANCELLED' TO 'REVOKED';

-- 3. Extend agent_invitations to capture the richer invite-creation form
--    (firstName/lastName/phone/location/notes) and an updatedAt timestamp.
--    invited_by_id is relaxed to optional.
ALTER TABLE "public"."agent_invitations"
  ALTER COLUMN "invited_by_id" DROP NOT NULL,
  ADD COLUMN "first_name" TEXT,
  ADD COLUMN "last_name" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "location" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "agent_invitations_email_idx" ON "public"."agent_invitations"("email");
CREATE INDEX "agent_invitations_status_idx" ON "public"."agent_invitations"("status");
CREATE INDEX "agent_invitations_expires_at_idx" ON "public"."agent_invitations"("expires_at");

-- Prisma's @updatedAt is set by the client on every write, not by a DB default.
ALTER TABLE "public"."agent_invitations" ALTER COLUMN "updated_at" DROP DEFAULT;
