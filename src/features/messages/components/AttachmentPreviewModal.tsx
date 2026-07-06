"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, FileText, X } from "lucide-react";
import type { MessageAttachmentDto } from "../types/message-dto";

const mont = { fontFamily: "'Montserrat', sans-serif" };

/**
 * Full-screen previewer for chat attachments (images + PDFs) so they no
 * longer redirect to a new tab. Mirrors listings' ImageLightbox (portal, body
 * scroll lock, ← → Esc, swipe) but also renders PDFs via <iframe> and can
 * step through every previewable attachment in the open thread, not just the
 * ones on a single message.
 */
export function AttachmentPreviewModal({
  attachments,
  startIndex,
  onClose,
}: {
  attachments: MessageAttachmentDto[];
  startIndex: number | null;
  onClose: () => void;
}) {
  const open = startIndex !== null;
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (startIndex !== null) setIndex(startIndex);
  }, [startIndex]);

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + attachments.length) % attachments.length);
    },
    [attachments.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, go, onClose]);

  if (!open || attachments.length === 0) return null;

  const current = attachments[index];
  const hasMultiple = attachments.length > 1;
  const isImage = current.mimeType.startsWith("image/");
  const isPdf = current.mimeType === "application/pdf";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${current.fileName} — attachment ${index + 1} of ${attachments.length}`}
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-4 text-white sm:px-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-[13px] sm:text-[14px]" style={mont}>
            {current.fileName}
          </span>
          {hasMultiple && (
            <span className="shrink-0 text-[12px] text-white/60" style={mont}>
              {index + 1} / {attachments.length}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={current.url}
            download={current.fileName}
            target="_blank"
            rel="noreferrer"
            aria-label="Download attachment"
            title="Download attachment"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
          >
            <Download size={18} />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            title="Close preview"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Stage */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-4 sm:px-16"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touchStartX.current = null;
        }}
      >
        {hasMultiple && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous attachment"
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:left-4"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={current.fileName}
            className="max-h-full max-w-full select-none rounded-[8px] object-contain"
            draggable={false}
          />
        ) : isPdf ? (
          <iframe
            src={current.url}
            title={current.fileName}
            className="h-full w-full max-w-[900px] rounded-[8px] bg-white"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-white">
            <FileText size={48} className="text-white/70" />
            <p className="text-[13px]" style={mont}>
              No in-browser preview for this file type.
            </p>
            <a
              href={current.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-[10px] bg-white/10 px-4 py-2 text-[12px] font-medium transition-colors hover:bg-white/20"
              style={mont}
            >
              Open in new tab
            </a>
          </div>
        )}

        {hasMultiple && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next attachment"
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:right-4"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
