-- Agent edit-modal parity: private admin notes, team-leader hierarchy, and
-- invite-scoped avatar staging (no Profile exists yet at invite time).
ALTER TABLE "profiles" ADD COLUMN "notes" TEXT;
ALTER TABLE "profiles" ADD COLUMN "team_leader_id" UUID;

ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_team_leader_id_fkey"
  FOREIGN KEY ("team_leader_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "profiles_team_leader_idx" ON "profiles"("team_leader_id");

ALTER TABLE "agent_invitations" ADD COLUMN "team_leader_id" UUID;
ALTER TABLE "agent_invitations" ADD COLUMN "avatar_path" TEXT;

ALTER TABLE "agent_invitations"
  ADD CONSTRAINT "agent_invitations_team_leader_id_fkey"
  FOREIGN KEY ("team_leader_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "agent_invitations_team_leader_idx" ON "agent_invitations"("team_leader_id");
