import { BlogStatus } from "@/generated/prisma/enums";
import type { BlogPostDto, BlogMetrics } from "./types/blog-dto";

// Placeholder content shown in the dashboard Blog list while the `blog_posts`
// table hasn't been migrated yet. Mirrors the static posts the public blog
// renders (src/features/blog/BlogPage.tsx) so the two stay visually consistent.
// Once the migration is applied, real DB rows replace these automatically
// (see the fallback in listBlogPosts / getBlogMetrics).

const IMG_BASE =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal";
const COVERS = [`${IMG_BASE}/blogimg1.webp`, `${IMG_BASE}/worker.webp`, `${IMG_BASE}/woodenfloor.webp`];

const CATEGORIES = ["Architecture", "Interior", "Real Estate", "Design", "Investment", "Lifestyle"];

const SEED = [
  { slug: "future-of-sustainable-architecture", author: "Jane Li", date: "2025-06-09", title: "Discover how smart design transforms daily life for the better", status: BlogStatus.PUBLISHED },
  { slug: "minimalist-interiors-luxury-living", author: "Mark Davis", date: "2025-07-14", title: "How minimalist interiors are redefining luxury living spaces", status: BlogStatus.PUBLISHED },
  { slug: "top-5-investment-locations-2025", author: "Sara Kim", date: "2025-08-03", title: "Top 5 investment locations for property buyers in 2025", status: BlogStatus.PUBLISHED },
  { slug: "natural-light-modern-architecture", author: "Tom Allen", date: "2025-09-22", title: "The role of natural light in modern architectural design", status: BlogStatus.PUBLISHED },
  { slug: "sustainable-materials-home-construction", author: "Priya Patel", date: "2025-10-05", title: "Why sustainable materials are the future of home construction", status: BlogStatus.DRAFT },
  { slug: "property-market-cycles-investment", author: "Luis Gomez", date: "2025-11-18", title: "Understanding property market cycles for smarter investment", status: BlogStatus.PUBLISHED },
  { slug: "aesthetics-functionality-open-plan-living", author: "Amy Chen", date: "2025-12-01", title: "Balancing aesthetics and functionality in open-plan living", status: BlogStatus.PUBLISHED },
  { slug: "location-shapes-property-value", author: "Ben Foster", date: "2026-01-12", title: "How location shapes property value over the long term", status: BlogStatus.DRAFT },
  { slug: "designing-for-wellness-home-building", author: "Nora Webb", date: "2026-02-28", title: "Designing for wellness — the new standard in home building", status: BlogStatus.PUBLISHED },
];

export const DUMMY_BLOG_POSTS: BlogPostDto[] = SEED.map((s, i) => {
  const iso = new Date(`${s.date}T09:00:00.000Z`).toISOString();
  return {
    id: `dummy-${i + 1}`,
    slug: s.slug,
    title: s.title,
    category: CATEGORIES[i % CATEGORIES.length],
    excerpt:
      "Sample excerpt — placeholder content shown until the blog table is migrated and real posts are created.",
    content: `<p>${s.title}.</p><p>This is placeholder body content for preview purposes. Replace it with a real article once the blog module is connected to the database.</p><ul><li>Key point one</li><li>Key point two</li><li>Key point three</li></ul>`,
    coverImageUrl: COVERS[i % COVERS.length],
    author: s.author,
    tags: [],
    status: s.status,
    isFeatured: false,
    scheduledAt: null,
    publishedAt: s.status === BlogStatus.PUBLISHED ? iso : null,
    createdById: null,
    createdAt: iso,
    updatedAt: iso,
  };
});

/** Applies the same status/category/search filters the DB list supports. */
export function filterDummyBlogPosts(filters: Record<string, string> = {}): BlogPostDto[] {
  let posts = DUMMY_BLOG_POSTS;

  if (filters.status === "DRAFT" || filters.status === "PUBLISHED") {
    posts = posts.filter((p) => p.status === filters.status);
  }
  if (filters.category) {
    posts = posts.filter((p) => p.category === filters.category);
  }
  const search = filters.search?.trim().toLowerCase();
  if (search) {
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        p.author.toLowerCase().includes(search) ||
        (p.excerpt?.toLowerCase().includes(search) ?? false),
    );
  }
  // Newest first, mirroring the DB order (updatedAt desc).
  return [...posts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function dummyBlogMetrics(): BlogMetrics {
  const published = DUMMY_BLOG_POSTS.filter((p) => p.status === BlogStatus.PUBLISHED).length;
  return {
    total: DUMMY_BLOG_POSTS.length,
    published,
    drafts: DUMMY_BLOG_POSTS.length - published,
    categories: new Set(DUMMY_BLOG_POSTS.map((p) => p.category)).size,
  };
}
