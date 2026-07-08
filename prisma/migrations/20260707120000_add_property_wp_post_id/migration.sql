-- Track which properties came from the WordPress migration (original WP post
-- id) vs. were created in-app (NULL). Lets us sanitize test data before
-- production without guessing.
ALTER TABLE "properties" ADD COLUMN "wp_post_id" TEXT;

CREATE UNIQUE INDEX "properties_wp_post_id_key" ON "properties"("wp_post_id");
