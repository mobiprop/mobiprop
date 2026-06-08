"use client";

import { useState } from "react";
import Link from "next/link";

const heroBg = "/assets/figma-temp/BlogPage/hero-bg.png";
const heroBgOverlay = "/assets/figma-temp/BlogPage/hero-bg-overlay.png";
const featuredBlogImg = "/assets/figma-temp/BlogPage/featured-blog-img.png";
const arrowRightWhite = "/assets/figma-temp/BlogPage/arrow-right-white.svg";
const blogCardImg = "/assets/figma-temp/BlogPage/blog-card-img.png";
const blogCardImg1 = "/assets/figma-temp/BlogPage/blog-card-img.png";
const blogCardImg2 = "/assets/figma-temp/BlogPage/blog-card-img.png";

const paginationArrowLeft = "/assets/figma-temp/BlogPage/pagination-arrow-left.svg";
const paginationArrowRight = "/assets/figma-temp/BlogPage/pagination-arrow-right.svg";
const paginationArrowDown = "/assets/figma-temp/BlogPage/pagination-arrow-down.svg";

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

interface BlogPost {
  id: number;
  slug: string;
  category: string;
  date: string;
  author: string;
  title: string;
  img: string;
}

const BLOG_POSTS: BlogPost[] = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  slug: [
    "future-of-sustainable-architecture",
    "minimalist-interiors-luxury-living",
    "top-5-investment-locations-2025",
    "natural-light-modern-architecture",
    "sustainable-materials-home-construction",
    "property-market-cycles-investment",
    "aesthetics-functionality-open-plan-living",
    "location-shapes-property-value",
    "designing-for-wellness-home-building",
  ][i],
  category: ["Architecture", "Interior", "Real Estate", "Design", "Investment", "Lifestyle"][i % 6],
  date: [
    "Jun 9, 2025", "Jul 14, 2025", "Aug 3, 2025", "Sep 22, 2025", "Oct 5, 2025",
    "Nov 18, 2025", "Dec 1, 2025", "Jan 12, 2026", "Feb 28, 2026",
  ][i],
  author: [
    "Jane Li", "Mark Davis", "Sara Kim", "Tom Allen", "Priya Patel",
    "Luis Gomez", "Amy Chen", "Ben Foster", "Nora Webb",
  ][i],
  title: [
    "Discover how smart design transforms daily life for the better",
    "How minimalist interiors are redefining luxury living spaces",
    "Top 5 investment locations for property buyers in 2025",
    "The role of natural light in modern architectural design",
    "Why sustainable materials are the future of home construction",
    "Understanding property market cycles for smarter investment",
    "Balancing aesthetics and functionality in open-plan living",
    "How location shapes property value over the long term",
    "Designing for wellness — the new standard in home building",
  ][i],
  img: blogCardImg,
 
}));

const TOTAL_PAGES = 16;

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
function FeaturedBlog() {
  return (
    <div className="relative w-full h-[420px] lg:h-[539px] rounded-[20px] overflow-hidden">
      <img src={featuredBlogImg} alt="Featured blog" className="absolute object-top inset-0 w-full h-full object-cover" />
      {/* dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0) 41%, rgba(0,0,0,0.95) 100%)" }}
      />
      <div className="absolute inset-0 flex flex-col justify-between p-6 lg:p-10">
        {/* badge */}
        <span
          className="self-start bg-white/90 rounded-[36px] px-3 py-1 text-[14px] text-[#0d2138] tracking-[-0.14px]"
          style={{ fontFamily: montserrat }}
        >
          Architecture
        </span>

        {/* bottom row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex flex-col gap-5 max-w-[695px]">
            <h2
              className="text-[26px] lg:text-[36px] font-semibold text-white leading-[1.25] lg:leading-[48px] tracking-[-0.36px]"
              style={{ fontFamily: poppins }}
            >
              The Future of Sustainable Architecture: Trends to Watch in 2025
            </h2>
            <button className="flex items-center gap-2 cursor-pointer">
              <span className="text-[16px] font-medium text-white tracking-[-0.16px]" style={{ fontFamily: montserrat }}>
                Read More
              </span>
              <img src={arrowRightWhite} alt="" className="w-6 h-6" />
            </button>
          </div>
          <span
            className="text-[16px] font-medium text-[#f9fafb] tracking-[-0.16px] whitespace-nowrap"
            style={{ fontFamily: montserrat }}
          >
            March 5, 2026
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Blog card ─── */
function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="flex flex-col gap-5 cursor-pointer group">
      {/* image */}
      <div className="relative h-[296px] rounded-[20px] overflow-hidden">
        <img
          src={post.img}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span
          className="absolute top-4 left-4 bg-white/90 rounded-[36px] px-3 py-1 text-[14px] text-[#0d2138] tracking-[-0.14px]"
          style={{ fontFamily: montserrat }}
        >
          {post.category}
        </span>
      </div>

      {/* meta + title */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center text-[14px] text-[#2b3038] tracking-[-0.14px]" style={{ fontFamily: montserrat }}>
          <span className="whitespace-nowrap">{post.date}</span>
          <span className="w-[5px] h-[5px] rounded-full bg-[#2b3038] mx-2 shrink-0" />
          <span className="whitespace-nowrap">{post.author}</span>
        </div>
        <h3
          className="text-[20px] font-medium text-[#0d2138] leading-[32px] tracking-[-0.2px] line-clamp-2"
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
  const pages: (number | "...")[] =
    currentPage <= 4
      ? [1, 2, 3, 4, 5, "...", totalPages]
      : currentPage >= totalPages - 3
      ? [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
      : [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full">
      {/* left */}
      <span
        className="sm:w-[200px] shrink-0 text-[16px] text-[#2b3038] tracking-[-0.16px] whitespace-nowrap"
        style={{ fontFamily: montserrat }}
      >
        Page {currentPage} of {totalPages}
      </span>

      {/* center */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="w-8 h-8 rounded-lg flex items-center justify-center p-1.5 disabled:opacity-40"
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
              className="w-8 h-8 rounded-[6px] border border-[#e6e6e6] flex items-center justify-center text-[16px] tracking-[-0.16px] transition-colors"
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
          aria-label="Next page"
          className="w-8 h-8 rounded-lg flex items-center justify-center p-1.5 disabled:opacity-40"
        >
          <img src={paginationArrowRight} alt="" className="w-5 h-5" />
        </button>
      </div>

      {/* right */}
      <div className="sm:w-[200px] shrink-0 flex sm:justify-end">
        <div
          className="flex items-center gap-1 bg-white border border-[#e6e6e6] rounded-lg pl-3 pr-1.5 py-1.5 cursor-pointer"
          style={{ boxShadow: "0px 1px 2px 0px rgba(228,229,231,0.24)" }}
        >
          <span className="text-[16px] text-[#2b3038] tracking-[-0.16px] whitespace-nowrap" style={{ fontFamily: montserrat }}>
            9 / page
          </span>
          <img src={paginationArrowDown} alt="" className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

/* ─── main export ─── */
export function BlogPageContent() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative h-[360px] lg:h-[408px] overflow-hidden border-b border-black/10">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <img src={heroBgOverlay} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(167,189,221,0.97) 0%, rgba(255,255,255,0.77) 45%, white 63%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #EDF6FF 100%)" }}
        />
        <div className="relative h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
          <SectionTag label="Blog Page" />
          <h1
            className="text-[32px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.25] lg:leading-[56px] tracking-[-0.44px] max-w-[644px]"
            style={{ fontFamily: poppins }}
          >
            Insights for the Modern Property Market
          </h1>
          <p
            className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px] max-w-[560px]"
            style={{ fontFamily: montserrat }}
          >
            Stay ahead of the curve with expert analysis, local market trends, and comprehensive guides for buyers, sellers, and investors.
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-[60px] pb-16 lg:pb-20">
        <div className="flex flex-col gap-[60px]">
          <FeaturedBlog />

          {/* 3-column grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-[30px]">
            {BLOG_POSTS.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={TOTAL_PAGES} onPageChange={setCurrentPage} />
        </div>
      </div>
    </>
  );
}
