"use client";

import Link from "next/link";
import { PageBackdrop } from "@/components/common/PageHero";
import { ConsultationBanner } from "@/features/home/ConsultationBanner";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { Reveal, RevealItem } from "@/components/common/Reveal";
import { SplitHeading } from "@/components/common/SplitHeading";
import type { BlogPostDto } from "@/features/blog/types/blog-dto";

const arrowRightWhite = "/assets/figma-temp/BlogPage/arrow-right-white.svg";
const blogCardImg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/blogimg1.webp";
const blogCardImg1 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/worker.webp";
const blogCardImg2 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/woodenfloor.webp";

// Fallback covers (one per column) for posts uploaded without a cover image.
const columnImages = [blogCardImg, blogCardImg1, blogCardImg2];

const paginationArrowLeft = "/assets/figma-temp/BlogPage/pagination-arrow-left.svg";
const paginationArrowRight = "/assets/figma-temp/BlogPage/pagination-arrow-right.svg";
const paginationArrowDown = "/assets/figma-temp/BlogPage/pagination-arrow-down.svg";

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

function postDate(post: BlogPostDto): string {
  const iso = post.publishedAt ?? post.createdAt;
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return "";
  }
}

function coverFor(post: BlogPostDto, index: number): string {
  return post.coverImageUrl || columnImages[index % columnImages.length];
}

/* ─── section tag (dot + label) ─── */
function SectionTag({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[7px] h-[7px] rounded-full bg-[#4896b6] shrink-0" />
      <span
        className="text-[16px] font-medium text-[#2b3038] tracking-[-0.16px] leading-[24px]"
        style={{ fontFamily: montserrat }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── Featured blog card ─── */
function FeaturedBlog({ post }: { post: BlogPostDto }) {
  const { t } = useTranslation("blog");

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="hover-shine relative block w-full h-[360px] sm:h-[420px] lg:h-[420px] rounded-[16px] sm:rounded-[24px] overflow-hidden group"
    >
      <img
        src={coverFor(post, 0)}
        alt={post.title}
        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
      />

      {/* dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
        {/* badge */}
        <span
          className="self-start bg-white/90 rounded-[36px] px-3 py-1 text-[12px] sm:text-[14px] text-[#0d2138] tracking-[-0.14px]"
          style={{ fontFamily: montserrat }}
        >
          {post.category ?? t("card.uncategorized")}
        </span>

        {/* bottom row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 sm:gap-4">
          <div className="flex flex-col gap-4 sm:gap-5 max-w-[695px]">
            <h2
              className="text-[22px] sm:text-[26px] lg:text-[28px] font-semibold text-white leading-[1.25] lg:leading-[36px] tracking-[-0.36px] line-clamp-3"
              style={{ fontFamily: poppins }}
            >
              {post.title}
            </h2>

            <span className="flex items-center gap-3 sm:gap-[24px] w-fit">
              <span
                className="text-[14px] sm:text-[16px] font-medium text-white tracking-[-0.16px]"
                style={{ fontFamily: montserrat }}
              >
                {t("card.readMore")}
              </span>
              <img src={arrowRightWhite} alt="" className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
          </div>

          <span
            className="text-[14px] sm:text-[16px] font-medium text-[#f9fafb] tracking-[-0.16px] whitespace-nowrap"
            style={{ fontFamily: montserrat }}
          >
            {postDate(post)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Blog card ─── */
function BlogCard({ post, index }: { post: BlogPostDto; index: number }) {
  const { t } = useTranslation("blog");

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="flex flex-col gap-4 sm:gap-5 cursor-pointer group"
    >
      {/* image */}
      <div className="hover-shine relative h-[220px] sm:h-[260px] lg:h-[296px] rounded-[16px] sm:rounded-[24px] overflow-hidden">
        <img
          src={coverFor(post, index)}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        <span
          className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-white/90 rounded-[36px] px-3 py-1 text-[12px] sm:text-[14px] text-[#0d2138] tracking-[-0.14px]"
          style={{ fontFamily: montserrat }}
        >
          {post.category ?? t("card.uncategorized")}
        </span>
      </div>

      {/* meta + title */}
      <div className="flex flex-col gap-2">
        <div
          className="flex items-center flex-wrap gap-y-1 text-[12px] sm:text-[14px] text-[#2b3038] tracking-[-0.14px]"
          style={{ fontFamily: montserrat }}
        >
          <span className="whitespace-nowrap">{postDate(post)}</span>
          <span className="w-[4px] h-[4px] sm:w-[5px] sm:h-[5px] rounded-full bg-[#2b3038] mx-2 shrink-0" />
          <span className="whitespace-nowrap">{post.author}</span>
        </div>

        <h3
          className="text-[18px] sm:text-[20px] font-medium text-[#0d2138] leading-[28px] sm:leading-[32px] tracking-[-0.2px] line-clamp-2"
          style={{ fontFamily: poppins }}
        >
          {post.title}
        </h3>
      </div>
    </Link>
  );
}

/* ─── Pagination ─── */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation("blog");

  const pages: (number | "...")[] =
    totalPages <= 7
      ? Array.from({ length: totalPages }, (_, i) => i + 1)
      : currentPage <= 4
      ? [1, 2, 3, 4, 5, "...", totalPages]
      : currentPage >= totalPages - 3
      ? [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
      : [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];

  return (
    <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6 w-full">
      {/* left */}
      <span
        className="lg:w-[200px] shrink-0 text-center xl:text-left text-[16px] text-[#2b3038] tracking-[-0.16px] whitespace-nowrap"
        style={{ fontFamily: montserrat }}
      >
        {t("pagination.pageOf", { current: currentPage, total: totalPages })}
      </span>

      {/* center */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label={t("pagination.previous")}
          className="w-8 h-8 rounded-lg flex items-center justify-center p-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        >
          <img src={paginationArrowLeft} alt="" className="w-5 h-5" />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`e-${i}`}
              className="w-8 h-8 flex items-center justify-center text-[14px] text-[#6a7282]"
              style={{ fontFamily: montserrat }}
            >
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className="w-8 h-8 rounded-[6px] border border-[#e6e6e6] flex items-center justify-center text-[16px] tracking-[-0.16px] transition-colors cursor-pointer"
              style={{
                fontFamily: montserrat,
                backgroundColor: currentPage === p ? "#fafafa" : "#ffffff",
                color: currentPage === p ? "#0d2138" : "#2b3038",
                boxShadow: "0px 1px 2px 0px rgba(228,229,231,0.24)",
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label={t("pagination.next")}
          className="w-8 h-8 rounded-lg flex items-center justify-center p-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        >
          <img src={paginationArrowRight} alt="" className="w-5 h-5" />
        </button>
      </div>

      {/* right */}
      <div className="lg:w-[200px] shrink-0 flex justify-center xl:justify-end">
        <div
          className="flex items-center gap-1 bg-white border border-[#e6e6e6] rounded-lg pl-3 pr-1.5 py-1.5"
          style={{ boxShadow: "0px 1px 2px 0px rgba(228,229,231,0.24)" }}
        >
          <span className="text-[16px] text-[#2b3038] tracking-[-0.16px] whitespace-nowrap" style={{ fontFamily: montserrat }}>
            {t("pagination.perPage")}
          </span>
          <img src={paginationArrowDown} alt="" className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

/* ─── main export ─── */
type BlogPageContentProps = {
  posts: BlogPostDto[];
  highlights: BlogPostDto[];
  featured: BlogPostDto | null;
  currentPage: number;
  totalPages: number;
};

export function BlogPageContent({ posts, highlights, featured, currentPage, totalPages }: BlogPageContentProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const category = params.get("category") ?? "";
  function navigate(values: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(values)) value ? next.set(key, value) : next.delete(key);
    router.push(`/blog?${next.toString()}`);
  }
  const { t } = useTranslation("blog");

  function goToPage(page: number) {
    navigate({page: page <= 1 ? "" : String(page)});
  }



  return (
    <>
      {/* ── Hero ── */}
      <section className="relative min-h-[457px] overflow-hidden border-b border-black/10">
        <PageBackdrop />
        <Reveal
          as="div"
          amount={0.6}
          className="relative min-h-[457px] flex flex-col items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 text-center"
        >
          <SectionTag label={t("listHero.badge")} />
          <SplitHeading
            as="h1"
            text={t("listHero.title")}
            className="text-[28px] sm:text-[34px] lg:text-[52px] font-medium text-[#0d2138] leading-[1.18] sm:leading-[1.25] lg:leading-[62.4px] tracking-[-0.3px] sm:tracking-[-0.44px] max-w-[340px] sm:max-w-[767px]"
            style={{ fontFamily: poppins }}
            amount={0.6}
          />
          <p
            className="text-[16px] sm:text-[18px] font-medium text-[#4f4f4f] leading-[27px] tracking-[-0.12px] sm:tracking-[-0.16px] max-w-[320px] sm:max-w-[730px]"
            style={{ fontFamily: montserrat }}
          >
            {t("listHero.subtitle")}
          </p>
        </Reveal>
      </section>

      {/* ── Content ── */}
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-64px)] lg:w-[calc(100%-128px)] max-w-[1312px] mx-auto py-12 sm:py-16 lg:py-20 flex flex-col items-center gap-7 sm:gap-10 lg:gap-12">
        {(
          <div className="flex flex-col gap-8 sm:gap-10 lg:gap-[70px] w-full">
            {featured && (
              <div className="grid gap-[30px] lg:grid-cols-[minmax(0,802fr)_minmax(0,480fr)]">
                <Reveal amount={0.2}><FeaturedBlog post={featured} /></Reveal>
                <div className="flex flex-col gap-5">
                  {highlights.map((post, index) => <Link key={post.id} href={`/blog/${post.slug}`} className="flex gap-4 border-b border-[#ebedf2] pb-4">
                    <img src={coverFor(post, index)} alt="" className="h-[72px] w-[100px] shrink-0 rounded-[10px] object-cover" />
                    <div className="min-w-0 flex flex-col gap-2">
                      <h2 className="line-clamp-2 text-[14px] font-medium leading-5 text-[#0a0d14]" style={{fontFamily:poppins}}>{post.title}</h2>
                      <p className="text-[12px] leading-[18px] text-[#4f4f4f]" style={{fontFamily:montserrat}}>{post.author} · {postDate(post)}</p>
                    </div>
                  </Link>)}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-7">
              <h2 className="text-[28px] lg:text-[36px] font-medium leading-[44px] text-[#0a0d14]" style={{fontFamily:poppins}}>{t("latest.title")}</h2>
              <div className="flex flex-col xl:flex-row gap-6 justify-between">
                <div className="flex flex-wrap gap-2">
                  {["", "Buying Guide", "Selling Tips", "Market Trends", "Investment", "Interior Design", "Luxury Living"].map((value, index) => <button key={value} aria-pressed={category === value} onClick={() => navigate({category:value,page:""})} className={`rounded-[10px] px-4 py-2 text-[14px] leading-5 border ${category === value ? "bg-[#005089] border-[#005089] text-white" : "bg-[#f0f6fa] border-[#ccdeef] text-[#4f4f4f]"}`}>{t(`latest.categories.${index}`)}</button>)}
                </div>
                <form onSubmit={(event) => {event.preventDefault();navigate({q:query.trim(),page:""});}} className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-[#e9e9e9] px-4 xl:w-[280px]">
                  <input value={query} onChange={event => setQuery(event.target.value)} placeholder={t("latest.search")} aria-label={t("latest.search")} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
                  <button type="submit" aria-label={t("latest.search")}><span aria-hidden="true" className="block size-[18px] bg-[#005089]" style={{mask: "url(/listings/search.svg) center / contain no-repeat", WebkitMask: "url(/listings/search.svg) center / contain no-repeat"}} /></button>
                </form>
              </div>
            </div>
            {posts.length > 0 && (
              <Reveal
                key={`grid-${currentPage}`}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-[30px]"
                stagger={0.1}
                amount={0.1}
              >
                {posts.map((post, i) => (
                  <RevealItem key={post.id}>
                    <BlogCard post={post} index={i} />
                  </RevealItem>
                ))}
              </Reveal>
            )}

            {posts.length === 0 && <div className="py-16 text-center text-[#6a7282]"><p>{t("emptyState")}</p>{(category || params.get("q")) && <button type="button" className="mt-4 rounded-xl border border-[#ccdeef] px-5 py-3 text-[#005089]" onClick={() => { setQuery(""); navigate({ category: "", q: "", page: "" }); }}>{t("clearFilters")}</button>}</div>}
            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
            )}
          </div>
        )}
      </div>
      <ConsultationBanner />
    </>
  );
}
