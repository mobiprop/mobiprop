"use client";

import { useRef, useState } from "react";
import { X, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { BLOG_CATEGORIES } from "@/schemas/blog.schema";
import { BlogStatus } from "@/generated/prisma/enums";
import { uploadBlogCover } from "@/lib/blog-cover-upload";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import type { BlogPostDto } from "@/features/blog/types/blog-dto";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type BlogFormValues = {
  title: string;
  category: string;
  excerpt: string;
  author: string;
  content: string;
  coverImageUrl: string;
  status: BlogStatus;
};

type BlogEditorModalProps = {
  post?: BlogPostDto | null;
  canPublish: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: BlogFormValues) => void;
};

const inputClass =
  "w-full min-w-0 h-10 px-3.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0a0a0a] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 transition-colors";
const labelClass = "text-[12px] text-[#1f2937] font-medium";

export function BlogEditorModal({ post, canPublish, submitting, onClose, onSubmit }: BlogEditorModalProps) {
  const isEdit = Boolean(post);

  const [title, setTitle] = useState(post?.title ?? "");
  const [category, setCategory] = useState<string>(post?.category ?? BLOG_CATEGORIES[0]);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [author, setAuthor] = useState(post?.author ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wasPublished = post?.status === BlogStatus.PUBLISHED;

  function validate(): boolean {
    if (!title.trim()) {
      toast.error("Title is required");
      return false;
    }
    if (!author.trim()) {
      toast.error("Author is required");
      return false;
    }
    if (content.replace(/<[^>]*>/g, "").trim().length === 0) {
      toast.error("Content is required");
      return false;
    }
    return true;
  }

  function submitWith(status: BlogStatus) {
    if (submitting || uploadingCover) return;
    if (!validate()) return;
    onSubmit({
      title: title.trim(),
      category,
      excerpt: excerpt.trim(),
      author: author.trim(),
      content,
      coverImageUrl,
      status,
    });
  }

  async function handleCoverFile(file: File) {
    setUploadingCover(true);
    try {
      const url = await uploadBlogCover(file);
      setCoverImageUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload cover image");
    } finally {
      setUploadingCover(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blog-modal-title"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative z-10 flex w-full max-w-[720px] max-h-[calc(100dvh-24px)] flex-col overflow-hidden rounded-[18px] bg-white shadow-xl sm:max-h-[92dvh] sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e5e7eb] bg-white px-5 py-4">
          <div className="min-w-0">
            <p id="blog-modal-title" className="text-[16px] font-semibold text-[#1f2937]" style={mont}>
              {isEdit ? "Edit Blog Post" : "New Blog Post"}
            </p>
            <p className="mt-0.5 text-[12px] text-[#6a7282]" style={mont}>
              {isEdit ? "Update this article." : "Draft a new article for the blog."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-[#6a7282] hover:bg-[#f3f4f6]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={mont}>
          <div className="flex flex-col gap-4">
            {/* Cover image */}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Cover image</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleCoverFile(file);
                }}
              />
              {coverImageUrl ? (
                <div className="relative overflow-hidden rounded-[12px] border border-[#e5e7eb]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImageUrl} alt="Cover preview" className="h-44 w-full object-cover" />
                  <div className="absolute right-2 top-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-[8px] bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#1f2937] shadow-sm hover:bg-white"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl("")}
                      className="flex items-center gap-1 rounded-[8px] bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#dc2626] shadow-sm hover:bg-white"
                    >
                      <Trash2 className="size-3" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#d1d5db] bg-[#fafbfc] text-[#6a7282] transition-colors hover:border-[#1e4f86] hover:text-[#1e4f86] disabled:opacity-60"
                >
                  {uploadingCover ? (
                    <>
                      <Loader2 className="size-6 animate-spin" />
                      <span className="text-[12px]">Uploading…</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="size-6" />
                      <span className="text-[12px]">Click to upload a cover (JPG, PNG, WEBP)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="blog-title">Title</label>
              <input
                id="blog-title"
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="How minimalist interiors are redefining luxury living"
              />
            </div>

            {/* Category + Author */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="blog-category">Category</label>
                <select
                  id="blog-category"
                  className={`${inputClass} appearance-none`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {BLOG_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="blog-author">Author</label>
                <input
                  id="blog-author"
                  className={inputClass}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Jane Li"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} htmlFor="blog-excerpt">Excerpt <span className="text-[#9ca3af]">(optional)</span></label>
              <textarea
                id="blog-excerpt"
                className="min-h-[64px] w-full rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-2.5 text-[12px] text-[#0a0a0a] outline-none placeholder:text-[#6a7282] focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A short summary shown in blog cards and previews."
              />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Content</label>
              <RichTextEditor value={content} onChange={setContent} placeholder="Write your article…" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#e5e7eb] bg-white px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-[10px] px-4 text-[12px] font-medium text-[#374151] hover:bg-[#f3f4f6]"
          >
            Cancel
          </button>

          {wasPublished ? (
            <>
              {canPublish && (
                <button
                  type="button"
                  onClick={() => submitWith(BlogStatus.DRAFT)}
                  disabled={submitting || uploadingCover}
                  className="h-9 rounded-[10px] border border-[#e5e7eb] px-4 text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb] disabled:opacity-60"
                >
                  Move to draft
                </button>
              )}
              <button
                type="button"
                onClick={() => submitWith(BlogStatus.PUBLISHED)}
                disabled={submitting || uploadingCover}
                className="flex h-9 items-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[12px] font-medium text-white hover:bg-[#1a4574] disabled:opacity-60"
              >
                {submitting && <Loader2 className="size-3.5 animate-spin" />}
                Save changes
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => submitWith(BlogStatus.DRAFT)}
                disabled={submitting || uploadingCover}
                className="h-9 rounded-[10px] border border-[#e5e7eb] px-4 text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb] disabled:opacity-60"
              >
                Save as draft
              </button>
              {canPublish && (
                <button
                  type="button"
                  onClick={() => submitWith(BlogStatus.PUBLISHED)}
                  disabled={submitting || uploadingCover}
                  className="flex h-9 items-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[12px] font-medium text-white hover:bg-[#1a4574] disabled:opacity-60"
                >
                  {submitting && <Loader2 className="size-3.5 animate-spin" />}
                  Publish
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
