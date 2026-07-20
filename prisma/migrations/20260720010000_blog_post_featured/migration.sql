-- Adds a manual "featured" pin to blog posts, used to rank a specific post
-- at the top of the public /blog page instead of always the newest one.
-- Hand-written (shadow-db workaround) — apply with `migrate deploy`.

ALTER TABLE "blog_posts" ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "blog_posts_is_featured_idx" ON "blog_posts"("is_featured");
