import type { Metadata } from "next";
import { BlogPageContent } from "@/features/blog/BlogPage";

export const metadata: Metadata = {
  title: "Blog — Ulrich Propiedades",
  description:
    "Insights for the modern property market: expert analysis, local market trends, and guides for buyers, sellers, and investors.",
};

export default function BlogPage() {
  return <BlogPageContent />;
}
