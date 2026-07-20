import { useTranslation } from "react-i18next";
import { Download, ExternalLink, FileText } from "lucide-react";

import { formatFileSize } from "@/features/messages/lib/format";
import type { MessageAttachmentDto } from "@/features/messages/types/message-dto";

const mont = { fontFamily: "'Montserrat', sans-serif" };

/** One attachment inside a sent message bubble — image, PDF (previewable), or generic file (opens externally). */
export function AttachmentCard({
  attachment,
  isOwn,
  onPreview,
}: {
  attachment: MessageAttachmentDto;
  isOwn: boolean;
  onPreview: () => void;
}) {
  const { t } = useTranslation("messages");
  if (attachment.mimeType.startsWith("image/")) {
    return (
      <div className="group/att relative inline-block max-w-[260px]">
        <button type="button" onClick={onPreview} className="block overflow-hidden rounded-[8px]" aria-label={t("attachmentCard.viewImageAria", { name: attachment.fileName })}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.url}
            alt={attachment.fileName}
            className="max-h-[240px] max-w-[260px] rounded-[8px] object-cover transition-transform duration-200 group-hover/att:scale-[1.02]"
          />
        </button>
        <a
          href={attachment.url}
          download={attachment.fileName}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          aria-label={t("attachmentCard.downloadAria", { name: attachment.fileName })}
          title={t("attachmentCard.downloadTitle")}
          className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/att:opacity-100"
        >
          <Download size={14} />
        </a>
      </div>
    );
  }

  const isPdf = attachment.mimeType === "application/pdf";
  const cardTone = isOwn ? "bg-white/15 hover:bg-white/20" : "border border-[#e5e7eb] bg-white hover:bg-[#f8fafc]";
  const iconTone = isOwn ? "text-white/80" : "text-[#6a7282]";
  const nameColor = isOwn ? "#ffffff" : "#0d2138";
  const sizeColor = isOwn ? "rgba(255,255,255,0.7)" : "#99a1af";

  const content = (
    <>
      <FileText size={18} className={`shrink-0 ${iconTone}`} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[11px] font-medium" style={{ color: nameColor, ...mont }}>
          {attachment.fileName}
        </span>
        <span className="text-[10px]" style={{ color: sizeColor, ...mont }}>
          {formatFileSize(attachment.sizeBytes)}
        </span>
      </div>
      {isPdf ? (
        <Download size={14} className={`shrink-0 ${iconTone}`} aria-hidden="true" />
      ) : (
        <ExternalLink size={14} className={`shrink-0 ${iconTone}`} aria-hidden="true" />
      )}
    </>
  );

  if (isPdf) {
    return (
      <button
        type="button"
        onClick={onPreview}
        aria-label={t("attachmentCard.previewAria", { name: attachment.fileName })}
        className={`flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left transition-colors ${cardTone}`}
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      aria-label={t("attachmentCard.openInNewTabAria", { name: attachment.fileName })}
      className={`flex items-center gap-2 rounded-[10px] px-3 py-2 transition-colors ${cardTone}`}
    >
      {content}
    </a>
  );
}
