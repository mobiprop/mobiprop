import type { Metadata } from "next";
import { SingleBlogPageContent } from "@/features/blog/SingleBlogPage";

export const metadata: Metadata = {
  title: "Blog Post — Ulrich Propiedades",
  description:
    "Explore our latest blog posts, where we share insights, market trends, and thoughtful perspectives on real estate.",
};

export default function SingleBlogPage({ params }: { params: { slug: string } }) {
  return <SingleBlogPageContent />;
}
