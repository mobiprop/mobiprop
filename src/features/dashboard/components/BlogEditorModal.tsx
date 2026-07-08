"use client";

import { useRef, useState } from "react";
import { X, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { BlogStatus } from "@/generated/prisma/enums";
import { uploadBlogCover } from "@/lib/blog-cover-upload";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import type { BlogPostDto, BlogCategoryDto } from "@/features/blog/types/blog-dto";
import { SearchableSelect } from "./SearchableSelect";
import { DatePickerField } from "./DatePickerField";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type BlogFormValues = {
  title: string;
  category: string;
  slug: string;
  excerpt: string;
  author: string;
  content: string;
  tags: string[];
  coverImageUrl: string;
  status: BlogStatus;
  /** ISO datetime string, required when status is SCHEDULED. */
  scheduledAt: string;
};

type BlogEditorModalProps = {
  post?: BlogPostDto | null;
  canPublish: boolean;
  submitting: boolean;
  categories: BlogCategoryDto[];
  onClose: () => void;
  onSubmit: (values: BlogFormValues) => void;
};

const inputClass =
  "w-full min-w-0 h-10 px-3.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0a0a0a] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 transition-colors";
const labelClass = "text-[12px] text-[#1f2937] font-medium";

/** yyyy-mm-dd (DatePickerField's format) from an ISO datetime, or "" if unset. */
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

/** yyyy-mm-dd -> a full ISO datetime (fixed 09:00 local, no time picker in this design). */
function fromDateInput(date: string): string {
  if (!date) return "";
  return new Date(`${date}T09:00:00`).toISOString();
}

export function BlogEditorModal({ post, canPublish, submitting, categories, onClose, onSubmit }: BlogEditorModalProps) {
  const isEdit = Boolean(post);

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [category, setCategory] = useState<string>(post?.category ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [author, setAuthor] = useState(post?.author ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [tagsInput, setTagsInput] = useState((post?.tags ?? []).join(", "));
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [status, setStatus] = useState<BlogStatus>(post?.status ?? BlogStatus.DRAFT);
  const [scheduledDate, setScheduledDate] = useState(toDateInput(post?.scheduledAt ?? null));
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function parseTags(): string[] {
    return tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  function submitWith(nextStatus: BlogStatus) {
    if (submitting || uploadingCover) return;
    if (!validateForStatus(nextStatus)) return;
    onSubmit({
      title: title.trim(),
      category,
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      author: author.trim(),
      content,
      tags: parseTags(),
      coverImageUrl,
      status: nextStatus,
      scheduledAt: nextStatus === BlogStatus.SCHEDULED ? fromDateInput(scheduledDate) : "",
    });
  }

  function validateForStatus(nextStatus: BlogStatus): boolean {
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
    if (nextStatus === BlogStatus.SCHEDULED && new Date(fromDateInput(scheduledDate)).getTime() <= Date.now()) {
      toast.error("Publish date must be in the future");
      return false;
    }
    return true;
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

  const busy = submitting || uploadingCover;

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
        className="relative z-10 flex w-full max-w-[1000px] max-h-[calc(100dvh-24px)] flex-col overflow-hidden rounded-[18px] bg-white shadow-xl sm:max-h-[92dvh] sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e5e7eb] bg-white px-5 py-4">
          <div className="min-w-0">
            <p id="blog-modal-title" className="text-[16px] font-semibold text-[#1f2937]" style={mont}>
              {isEdit ? "Edit Blog Post" : "Create New Post"}
            </p>
            <p className="mt-0.5 text-[12px] text-[#6a7282]" style={mont}>
              {isEdit ? "Update this article." : "Fill in the details to publish your article."}
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

        {/* Body — 2 columns: Content (left) + Settings (right) */}
        <div className="flex-1 overflow-y-auto" style={mont}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px]">
            {/* Content column */}
            <div className="flex flex-col gap-4 border-b border-[#e5e7eb] px-5 py-4 lg:border-b-0 lg:border-r">
              <p className="text-[13px] font-semibold text-[#1f2937]">Content</p>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="blog-title">Post Title *</label>
                <input
                  id="blog-title"
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Top Real Estate Trends in Buenos Aires"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="blog-slug">URL Slug</label>
                <div className="flex h-10 w-full min-w-0 items-center overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] focus-within:border-[#1e4f86]">
                  <span className="shrink-0 pl-3.5 text-[12px] text-[#9ca3af]">/blog/</span>
                  <input
                    id="blog-slug"
                    className="h-full w-full min-w-0 bg-transparent px-1 text-[12px] text-[#0a0a0a] outline-none placeholder:text-[#6a7282]"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="auto-generated-from-title"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="blog-excerpt">Excerpt / Summary</label>
                <textarea
                  id="blog-excerpt"
                  className="min-h-[64px] w-full rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-2.5 text-[12px] text-[#0a0a0a] outline-none placeholder:text-[#6a7282] focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Short description shown in post listings…"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Article Content</label>
                <RichTextEditor value={content} onChange={setContent} placeholder="Write your article…" />
              </div>
            </div>

            {/* Settings column */}
            <div className="flex flex-col gap-4 bg-[#fafbfc] px-5 py-4">
              <p className="text-[13px] font-semibold text-[#1f2937]">Settings</p>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="blog-author">Author *</label>
                <input
                  id="blog-author"
                  className={`${inputClass} bg-white`}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Full name"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Category</label>
                <SearchableSelect
                  size="sm"
                  searchable={false}
                  value={category}
                  onChange={setCategory}
                  options={[
                    { value: "", label: "Uncategorized" },
                    ...categories.map((c) => ({ value: c.name, label: c.name })),
                  ]}
                  placeholder="Select category"
                  ariaLabel="Category"
                  className="bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Status</label>
                <SearchableSelect
                  size="sm"
                  searchable={false}
                  value={status}
                  onChange={(next) => setStatus(next as BlogStatus)}
                  options={[
                    { value: BlogStatus.DRAFT, label: "Draft" },
                    ...(canPublish
                      ? [
                          { value: BlogStatus.SCHEDULED, label: "Scheduled" },
                          { value: BlogStatus.PUBLISHED, label: "Published" },
                        ]
                      : []),
                  ]}
                  placeholder="Select status"
                  ariaLabel="Status"
                  className="bg-white"
                />
              </div>

              {status === BlogStatus.SCHEDULED && (
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Publish Date *</label>
                  <DatePickerField
                    value={scheduledDate}
                    onChange={setScheduledDate}
                    minDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                    placeholder="mm/dd/yy"
                    className="[&>button]:bg-white"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className={labelClass} htmlFor="blog-tags">Tags</label>
                <input
                  id="blog-tags"
                  className={`${inputClass} bg-white`}
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="investment, tips, 2024"
                />
                <p className="text-[11px] text-[#9ca3af]">Comma separated</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Featured Image</label>
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
                    <img src={coverImageUrl} alt="Cover preview" className="h-32 w-full object-cover" />
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
                    className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#d1d5db] bg-white text-[#6a7282] transition-colors hover:border-[#1e4f86] hover:text-[#1e4f86] disabled:opacity-60"
                  >
                    {uploadingCover ? (
                      <>
                        <Loader2 className="size-6 animate-spin" />
                        <span className="text-[12px]">Uploading…</span>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="size-6" />
                        <span className="text-[12px]">Click to upload or drag &amp; drop</span>
                        <span className="text-[11px] text-[#9ca3af]">PNG, JPG, WEBP up to 10MB</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer — a single primary action driven entirely by the Status dropdown
            above (Draft/Scheduled/Published), matching the Figma "Save Post" button.
            Two independent controls submitting different statuses (buttons here +
            the dropdown) is what caused the "Schedule" button to fire before the
            Publish Date field was even shown. */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#e5e7eb] bg-white px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-[10px] px-4 text-[12px] font-medium text-[#374151] hover:bg-[#f3f4f6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => submitWith(status)}
            disabled={busy}
            className="flex h-9 items-center gap-2 rounded-[10px] bg-[#1e4f86] px-4 text-[12px] font-medium text-white hover:bg-[#1a4574] disabled:opacity-60"
          >
            {busy && <Loader2 className="size-3.5 animate-spin" />}
            {isEdit ? "Save Changes" : "Save Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
