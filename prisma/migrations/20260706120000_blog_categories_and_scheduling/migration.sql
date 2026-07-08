-- AlterEnum
ALTER TYPE "BlogStatus" ADD VALUE 'SCHEDULED';

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

-- RowLevelSecurity
-- Same policy as blog_posts: deny all direct client access, server-side Prisma only.
ALTER TABLE "public"."blog_categories" ENABLE ROW LEVEL SECURITY;

-- AlterTable
ALTER TABLE "blog_posts" ALTER COLUMN "category" DROP NOT NULL;
ALTER TABLE "blog_posts" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "blog_posts" ADD COLUMN "scheduled_at" TIMESTAMP(3);

-- Seed the existing fixed taxonomy as real, editable rows so current posts'
-- category text stays valid and the Manage Categories list isn't empty.
INSERT INTO "blog_categories" ("id", "name", "slug", "description", "created_at", "updated_at") VALUES
    (gen_random_uuid()::text, 'Architecture', 'architecture', 'Architecture and building design.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Interior', 'interior', 'Interior design and decor.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Real Estate', 'real-estate', 'General real estate news and guides.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Design', 'design', 'Design trends and inspiration.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Investment', 'investment', 'Property investment strategies and tips.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Lifestyle', 'lifestyle', 'Lifestyle and living.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
