"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ListingImageDto } from "../types/listing-dto";

/**
 * Full-screen image viewer for a listing gallery. Renders through a portal,
 * locks body scroll while open, and supports keyboard (← → Esc), on-screen
 * arrows, a thumbnail strip, and swipe gestures on touch devices.
 *
 * Controlled via `startIndex` (the image to show first). `startIndex === null`
 * keeps the lightbox closed.
 */
export function ImageLightbox({
  images,
  startIndex,
  onClose,
  title,
}: {
  images: ListingImageDto[];
  startIndex: number | null;
  onClose: () => void;
  title: string;
}) {
  const open = startIndex !== null;
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Sync the active image whenever the lightbox is (re)opened at a new index
  // (syncing from the startIndex prop, an external input).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (startIndex !== null) setIndex(startIndex);
  }, [startIndex]);

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + images.length) % images.length);
    },
    [images.length],
  );

  // Keyboard navigation + body scroll lock while open.
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

  if (!open || images.length === 0) return null;

  const current = images[index];
  const hasMultiple = images.length > 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} — image ${index + 1} of ${images.length}`}
      onClick={onClose}
    >
      {/* Top bar: counter + close */}
      <div
        className="flex items-center justify-between px-4 py-4 sm:px-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[14px] sm:text-[15px]" style={{ fontFamily: "Montserrat, sans-serif" }}>
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar galería"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
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
        {hasMultiple ? (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Imagen anterior"
            className="absolute left-2 sm:left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.altText ?? `${title} — image ${index + 1}`}
          className="max-h-full max-w-full rounded-[8px] object-contain select-none"
          draggable={false}
        />

        {hasMultiple ? (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Imagen siguiente"
            className="absolute right-2 sm:right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : null}
      </div>

      {/* Thumbnail strip */}
      {hasMultiple ? (
        <div
          className="flex gap-2 overflow-x-auto px-4 py-4 sm:px-6"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === index}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-[8px] transition-opacity sm:h-16 sm:w-24 ${
                i === index ? "ring-2 ring-white" : "opacity-50 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
