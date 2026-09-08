import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SingleBlogPageContent } from "@/features/blog/SingleBlogPage";
import { getPublishedBlogPostBySlug, getRelatedBlogPosts } from "@/services/blog.service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    return { title: "Blog Post — Mobi Prop" };
  }

  const description =
    post.excerpt || post.content.replace(/<[^>]*>/g, "").trim().slice(0, 160);

  return {
    title: `${post.title} — Mobi Prop`,
    description,
    openGraph: {
      title: post.title,
      description,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
      type: "article",
    },
  };
}

export default async function SingleBlogPage({ params }: Params) {
  const { slug } = await params;

  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedBlogPosts(post.slug, post.category, 3);

  return <SingleBlogPageContent post={post} related={related} />;
}
