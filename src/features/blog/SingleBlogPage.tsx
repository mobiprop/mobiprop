"use client";

import Link from "next/link";
import { PageBackdrop } from "@/components/common/PageHero";
import { ConsultationBanner } from "@/features/home/ConsultationBanner";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import type { BlogPostDto } from "@/features/blog/types/blog-dto";

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

/* ─── BlogCard (reused in Continue Reading) ─── */
function BlogCard({ post, index }: { post: BlogPostDto; index: number }) {
  const { t } = useTranslation("blog");

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
          {post.category ?? t("card.uncategorized")}
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
function HeroBanner({post}: {post: BlogPostDto}) {
 const {t}=useTranslation('blog');
 return <section className="relative isolate overflow-hidden px-4 py-12 sm:px-8 min-h-[457px] lg:px-16 lg:pt-14 lg:pb-16">
  <PageBackdrop />
  <div className="relative mx-auto max-w-[1312px]">
   <nav className="mb-10 flex flex-wrap gap-2 text-xs text-[#4f4f4f]" aria-label={t('back')}><Link href="/">{t('home')}</Link><span>/</span><Link href="/blog">Blog</Link><span>/</span><span>{post.category??t('card.uncategorized')}</span></nav>
   <div className="max-w-[866px]">
    <span className="rounded-full border border-[#ccdeef] bg-[#f0f6fa] px-3 py-1 text-xs text-[#005089]">{post.category??t('card.uncategorized')}</span>
    <h1 className="mt-5 text-[32px] font-medium leading-[1.2] tracking-[-1px] text-[#101010] sm:text-[40px] lg:text-[44px]" style={{fontFamily:poppins}}>{post.title}</h1>
    {post.excerpt&&<p className="mt-5 text-base leading-[27px] text-[#4f4f4f] lg:text-lg" style={{fontFamily:montserrat}}>{post.excerpt}</p>}
    <div className="mt-8 flex items-center gap-3"><span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e1edf5] font-medium text-[#005089]">{post.author.charAt(0)}</span><div><p className="text-sm font-medium text-[#232323]">{post.author}</p><p className="text-xs text-[#4f4f4f]">{postDate(post)} · {t('readingMinutes',{count:Math.max(1,Math.ceil(post.content.replace(/<[^>]*>/g,' ').split(/\s+/).length/200))})}</p></div></div>
   </div>
  </div>
 </section>;
}

/* ─── Article body ─── */
function ArticleContent({ post }: { post: BlogPostDto }) {
  return (
    <article className="flex flex-col gap-8 sm:gap-10 lg:gap-[48px]">
      {/* full-width cover image */}
      <div className="h-[240px] sm:h-[360px] lg:h-[440px] rounded-[16px] overflow-hidden w-full">
        <img src={coverFor(post)} alt={post.title} className="w-full h-full object-cover" />
      </div>

      {/* rendered rich-text body (Tiptap HTML authored in the dashboard) */}
      <div
        className="blog-article w-full [&_blockquote]:border-[#005089] [&_blockquote]:bg-[#f0f6fa] [&_blockquote]:p-5 [&_blockquote]:text-lg [&_blockquote]:leading-7"
        style={{ fontFamily: montserrat }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
      <div className="flex items-center gap-5 rounded-2xl border border-[#e9e9e9] bg-[#fafafa] p-6"><span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[#e1edf5] text-2xl text-[#005089]">{post.author.charAt(0)}</span><p className="font-medium text-[#232323]" style={{fontFamily:poppins}}>{post.author}</p></div>
    </article>
  );
}

/* ─── Continue Reading ─── */
function ContinueReading({ posts }: { posts: BlogPostDto[] }) {
  const { t } = useTranslation("blog");

  if (posts.length === 0) return null;

  return (
    <section className="flex flex-col gap-8 sm:gap-10 lg:gap-[44px] items-center w-full">
      <div className="flex w-full items-center justify-between gap-5"><h2 className="text-[26px] font-medium leading-[1.4] text-[#00223a] lg:text-[32px]" style={{fontFamily:poppins}}>{t('latestInsights')}</h2><Link href="/blog" className="shrink-0 text-sm text-[#005089]">{t('viewAll')} →</Link></div>

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
      <HeroBanner post={post} />

      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-64px)] lg:w-[calc(100%-128px)] max-w-[1312px] mx-auto pt-[50px] pb-20 lg:pb-[130px] flex flex-col items-center gap-7 sm:gap-10 lg:gap-12">
        <div className="flex flex-col gap-[130px] w-full items-center">
          <ArticleContent post={post} />
          <ContinueReading posts={related} />
        </div>
      </div>
      <ConsultationBanner />
    </>
  );
}
