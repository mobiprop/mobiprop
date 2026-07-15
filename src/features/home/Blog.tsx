import Link from "next/link";
import { format } from "date-fns";

import { getRecentBlogPosts } from "@/services/blog.service";
import type { BlogPostDto } from "@/features/blog/types/blog-dto";
import { BlogHeader } from "@/features/home/BlogHeader";

const fallbackCovers = [
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/blogimg1.webp",
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/worker.webp",
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/woodenfloor.webp",
];

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
    <section className="bg-white py-16 lg:py-20">
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto">
        {/* Header */}
        <BlogHeader />

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
          {posts.map((post, i) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="flex min-w-0 flex-col gap-4 sm:gap-[19px] group"
            >
              {/* Image */}
              <div className="relative h-[220px] sm:h-[250px] lg:h-[296px] rounded-[18px] sm:rounded-[20px] overflow-hidden">
                <img
                  src={post.coverImageUrl || fallbackCovers[i % fallbackCovers.length]}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />

                <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                  <span
                    className="bg-white/90 px-3 py-1 rounded-[36px] text-[12px] sm:text-[13px] text-[#0d2138]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    {post.category}
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="flex min-w-0 flex-col gap-2">
                <div
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] sm:text-[14px] text-[#2b3038]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  <span>{postDate(post)}</span>
                  <div className="w-1 h-1 rounded-full bg-[#2b3038]" />
                  <span>{post.author}</span>
                </div>

                <h3
                  className="text-[17px] sm:text-[18px] lg:text-[20px] font-medium text-[#0d2138] leading-[27px] sm:leading-[30px] lg:leading-[32px] line-clamp-2"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {post.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
