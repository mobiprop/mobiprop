import Link from "next/link";
import { format } from "date-fns";

import { getRecentBlogPosts } from "@/services/blog.service";
import type { BlogPostDto } from "@/features/blog/types/blog-dto";
import { BlogHeader } from "@/features/home/BlogHeader";
import { ReadArticleLabel, ReadMoreLabel } from "@/features/home/BlogLabels";

const fallbackCovers = [
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/blogimg1.webp",
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/worker.webp",
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/woodenfloor.webp",
];

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M3.3525 10.0192L16.6858 10.0192M11.6833 5.01917L16.6633 10L11.6833 14.9808"
        stroke="url(#blog-arrow-gradient)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="blog-arrow-gradient" x1="3.3525" y1="5.01917" x2="12.9054" y2="17.8053" gradientUnits="userSpaceOnUse">
          <stop stopColor="#005EA4" />
          <stop offset="1" stopColor="#006FC2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function postDate(post: BlogPostDto): string {
  const iso = post.publishedAt ?? post.createdAt;
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return "";
  }
}

export async function Blog() {
  const posts = await getRecentBlogPosts(3);

  // Nothing published yet — hide the section rather than show placeholders.
  if (posts.length === 0) return null;

  return (
    <section className="bg-white home-section">
      <div className="home-container flex flex-col items-center gap-10">
        <BlogHeader />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
          {posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="flex min-w-0 flex-col gap-4 group"
            >
              <div className="relative h-[220px] sm:h-[250px] lg:h-[272px] rounded-2xl overflow-hidden">
                <img
                  src={post.coverImageUrl || fallbackCovers[i % fallbackCovers.length]}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>

              <div className="flex min-w-0 flex-col gap-3">
                <div
                  className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px] sm:text-[16px] text-[#6c6c6c]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  <span>{postDate(post)}</span>
                  {post.author && (
                    <>
                      <span className="size-1 rounded-full bg-[#6c6c6c]" />
                      <span>{post.author}</span>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <h3
                    className="text-[20px] sm:text-[22px] lg:text-[24px] font-medium text-[#00223a] tracking-[-0.12px] leading-snug line-clamp-2"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p
                      className="text-[14px] sm:text-[16px] text-[#4f4f4f] leading-relaxed line-clamp-2"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </div>

              <span className="flex items-center gap-1.5">
                <span
                  className="bg-clip-text text-transparent text-[15px] sm:text-[16px] font-medium"
                  style={{
                    fontFamily: "Montserrat, sans-serif",
                    backgroundImage: "linear-gradient(90deg, #005ea4 0%, #006fc2 100%)",
                  }}
                >
                  <ReadArticleLabel />
                </span>
                <ArrowRightIcon />
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/blog"
          className="flex h-12 items-center justify-center rounded-[13px] px-7 text-[16px] font-medium text-white"
          style={{
            fontFamily: "Montserrat, sans-serif",
            background: "linear-gradient(161deg, #005ea4 0%, #006fc2 100%)",
          }}
        >
          <ReadMoreLabel />
        </Link>
      </div>
    </section>
  );
}
