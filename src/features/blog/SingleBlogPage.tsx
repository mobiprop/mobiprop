import Link from "next/link";
import { format } from "date-fns";

import type { BlogPostDto } from "@/features/blog/types/blog-dto";

const heroBg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/Listings/topimg2.webp";
const heroBgOverlay = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/224a1a87c6d1fc7b05e65142626032911210d860.webp";
const blogCardImg1 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/blogimg1.webp";
const blogCardImg2 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/worker.webp";
const blogCardImg3 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/woodenfloor.webp";

const fallbackCovers = [blogCardImg1, blogCardImg2, blogCardImg3];

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

function postDate(post: BlogPostDto): string {
  const iso = post.publishedAt ?? post.createdAt;
  try {
    return format(new Date(iso), "MMMM d, yyyy");
  } catch {
    return "";
  }
}

function coverFor(post: BlogPostDto, index = 0): string {
  return post.coverImageUrl || fallbackCovers[index % fallbackCovers.length];
}

/* ─── SectionTag ─── */
function SectionTag({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[7px] h-[7px] rounded-full bg-[#4896b6] shrink-0" />
      <span
        className="text-[16px] font-medium leading-[24px] tracking-[-0.16px]"
        style={{ fontFamily: montserrat, color: muted ? "#6a7282" : "#2b3038" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── BlogCard (reused in Continue Reading) ─── */
function BlogCard({ post, index }: { post: BlogPostDto; index: number }) {
  return (
    <Link href={`/blog/${post.slug}`} className="flex flex-col gap-5 group cursor-pointer">
      <div className="relative h-[296px] rounded-[20px] overflow-hidden shrink-0">
        <img
          src={coverFor(post, index)}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span
          className="absolute top-4 left-4 bg-white/90 rounded-[36px] px-3 py-1 text-[14px] text-[#0d2138] tracking-[-0.14px]"
          style={{ fontFamily: montserrat }}
        >
          {post.category ?? "Uncategorized"}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <div
          className="flex items-center text-[14px] text-[#2b3038] tracking-[-0.14px]"
          style={{ fontFamily: montserrat }}
        >
          <span className="whitespace-nowrap">{postDate(post)}</span>
          <span className="w-[5px] h-[5px] rounded-full bg-[#2b3038] mx-2 shrink-0" />
          <span className="whitespace-nowrap">{post.author}</span>
        </div>
        <h3
          className="text-[18px] sm:text-[20px] font-medium text-[#0d2138] leading-[26px] sm:leading-[32px] tracking-[-0.18px] sm:tracking-[-0.2px] line-clamp-2"
          style={{ fontFamily: poppins }}
        >
          {post.title}
        </h3>
      </div>
    </Link>
  );
}

/* ─── Hero banner ─── */
function HeroBanner() {
  return (
    <section className="relative h-[360px] lg:h-[408px] overflow-hidden border-b border-black/10">
      <div className="absolute inset-0 overflow-hidden">
        <img src={heroBg} alt="" className="absolute w-full h-[110%] -top-[10%] object-cover" />
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(167,189,221,0.97) 0%, rgba(255,255,255,0.77) 45%, white 63%)",
        }}
      />

      <div className="absolute inset-0 opacity-40 overflow-hidden pointer-events-none">
        <img src={heroBgOverlay} alt="" className="absolute w-full h-full object-cover" />
      </div>

      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #EDF6FF 100%)" }}
      />

      <div className="relative h-full flex flex-col items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 text-center">
        <SectionTag label="Blog Post" />

        <h1
          className="text-[28px] sm:text-[34px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.18] sm:leading-[1.25] lg:leading-[56px] tracking-[-0.3px] sm:tracking-[-0.44px] max-w-[340px] sm:max-w-[644px]"
          style={{ fontFamily: poppins }}
        >
          Our Blog Posts
        </h1>

        <p
          className="text-[14px] sm:text-[16px] text-[#2b3038] leading-[21px] sm:leading-[24px] tracking-[-0.12px] sm:tracking-[-0.16px] max-w-[320px] sm:max-w-[560px]"
          style={{ fontFamily: montserrat }}
        >
          Explore our latest blog posts, where we share insights, market trends, and thoughtful
          perspectives on real estate.
        </p>
      </div>
    </section>
  );
}

/* ─── Article body ─── */
function ArticleContent({ post }: { post: BlogPostDto }) {
  return (
    <article className="flex flex-col gap-8 sm:gap-10 lg:gap-[48px]">
      {/* header: back + date + category + title */}
      <div className="flex flex-col gap-5 sm:gap-6 lg:gap-[24px] max-w-[866px] w-full">
        <Link
          href="/blog"
          className="flex items-center gap-2.5 sm:gap-3 text-[14px] sm:text-[16px] text-[#0d2138] tracking-[-0.14px] sm:tracking-[-0.16px] w-fit"
          style={{ fontFamily: montserrat }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0 sm:w-6 sm:h-6">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="#0d2138"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Link>

        <div className="flex flex-col gap-3 sm:gap-[14px]">
          <div
            className="flex items-center flex-wrap gap-y-1 text-[14px] sm:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[24px] tracking-[-0.14px] sm:tracking-[-0.16px]"
            style={{ fontFamily: montserrat }}
          >
            <span>{postDate(post)}</span>
            <span className="w-[5px] h-[5px] rounded-full bg-[#2b3038] mx-2 shrink-0" />
            <span>{post.author}</span>
            <span className="w-[5px] h-[5px] rounded-full bg-[#2b3038] mx-2 shrink-0" />
            <span>{post.category ?? "Uncategorized"}</span>
          </div>

          <h2
            className="text-[26px] sm:text-[36px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.25] sm:leading-[1.22] lg:leading-[56px] tracking-[-0.28px] sm:tracking-[-0.36px] lg:tracking-[-0.44px]"
            style={{ fontFamily: poppins }}
          >
            {post.title}
          </h2>
        </div>
      </div>

      {/* full-width cover image */}
      <div className="h-[260px] sm:h-[400px] lg:h-[560px] rounded-[14px] sm:rounded-[20px] overflow-hidden w-full">
        <img src={coverFor(post)} alt={post.title} className="w-full h-full object-cover" />
      </div>

      {/* rendered rich-text body (Tiptap HTML authored in the dashboard) */}
      <div
        className="blog-article max-w-[866px] w-full"
        style={{ fontFamily: montserrat }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}

/* ─── Continue Reading ─── */
function ContinueReading({ posts }: { posts: BlogPostDto[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="flex flex-col gap-8 sm:gap-10 lg:gap-[44px] items-center w-full">
      <div className="flex flex-col gap-2 sm:gap-2.5 items-center">
        <SectionTag label="More Posts" muted />

        <h2
          className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.25] sm:leading-[1.22] lg:leading-[56px] tracking-[-0.28px] sm:tracking-[-0.36px] lg:tracking-[-0.44px] text-center"
          style={{ fontFamily: poppins }}
        >
          Continue Reading
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 sm:gap-x-6 gap-y-6 sm:gap-y-8 w-full">
        {posts.map((post, i) => (
          <BlogCard key={post.id} post={post} index={i} />
        ))}
      </div>
    </section>
  );
}

/* ─── main export ─── */
export function SingleBlogPageContent({
  post,
  related,
}: {
  post: BlogPostDto;
  related: BlogPostDto[];
}) {
  return (
    <>
      <HeroBanner />

      <div className="w-[calc(100%-28px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto py-12 sm:py-16 lg:py-20 flex flex-col items-center gap-7 sm:gap-10 lg:gap-12">
        <div className="flex flex-col gap-[68px] w-full items-center">
          <ArticleContent post={post} />
          <ContinueReading posts={related} />
        </div>
      </div>
    </>
  );
}
