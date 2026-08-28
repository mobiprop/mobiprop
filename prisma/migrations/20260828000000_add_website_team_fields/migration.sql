-- Admin-managed public "Nuestro Equipo" section (home + about pages).
--
-- Before this, the team was a hardcoded list in src/i18n/locales/*/home.json
-- and avatars were matched to profiles by name. Admins can now pick who
-- appears from the Agents page instead. Titles are per-language because the
-- public site is bilingual (ES/EN).
ALTER TABLE "profiles" ADD COLUMN "show_on_website" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN "website_title_es" TEXT;
ALTER TABLE "profiles" ADD COLUMN "website_title_en" TEXT;
ALTER TABLE "profiles" ADD COLUMN "website_order" INTEGER NOT NULL DEFAULT 0;

-- Backfill the team that is live today so the public section does not go
-- blank the moment this deploys. Values mirror the hardcoded home.json entries
-- being removed in the same change.
--
-- Names can appear on more than one profile (duplicate/test accounts), so each
-- name resolves to a single row: the most senior role wins, then the oldest
-- account. This mirrors the ROLE_RANK tie-break in the old getTeamAvatars().
WITH ranked AS (
  SELECT
    id,
    lower(trim(full_name)) AS normalized_name,
    ROW_NUMBER() OVER (
      PARTITION BY lower(trim(full_name))
      ORDER BY
        CASE "role"::text
          WHEN 'ADMIN'   THEN 0
          WHEN 'MANAGER' THEN 1
          WHEN 'AGENT'   THEN 2
          ELSE 3
        END,
        created_at
    ) AS rank
  FROM "profiles"
  WHERE full_name IS NOT NULL
    AND lower(trim(full_name)) IN ('rodolfo ulrich', 'carola buscaglia')
),
team AS (
  SELECT * FROM (VALUES
    ('rodolfo ulrich',   'Martillero y Corredor Público Responsable', 'Licensed Auctioneer & Responsible Real Estate Broker', 0),
    ('carola buscaglia', 'Asesor Inmobiliario',                       'Real Estate Advisor',                                 1)
  ) AS t(normalized_name, title_es, title_en, sort_order)
)
UPDATE "profiles" p
SET
  "show_on_website"  = true,
  "website_title_es" = team.title_es,
  "website_title_en" = team.title_en,
  "website_order"    = team.sort_order
FROM ranked
JOIN team ON team.normalized_name = ranked.normalized_name
WHERE p.id = ranked.id
  AND ranked.rank = 1;

-- Public pages filter on this flag and sort by website_order on every render.
CREATE INDEX "profiles_website_team_idx"
  ON "profiles" ("show_on_website", "website_order");
