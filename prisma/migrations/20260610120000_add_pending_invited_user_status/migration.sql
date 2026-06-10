-- Extend UserStatus with the onboarding states from the role-access spec:
--   PENDING — account created but not yet verified/approved
--   INVITED — staff profile pre-created from an invitation, not yet accepted
-- Additive only; existing rows keep their current status. Note enum order:
-- new values are appended before SUSPENDED to match the spec's ordering.
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'PENDING' BEFORE 'SUSPENDED';
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'INVITED' BEFORE 'SUSPENDED';
