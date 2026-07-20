"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, FileText, ImageIcon, Loader2, Paperclip, Send, WifiOff, X } from "lucide-react";

import { formatFileSize } from "@/features/messages/lib/format";
import { useIsOnline } from "@/features/messages/lib/use-is-online";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const MAX_TEXTAREA_HEIGHT = 120;

function PendingAttachmentCard({ file, uploading, onRemove }: { file: File; uploading: boolean; onRemove: () => void }) {
  const { t } = useTranslation("messages");
  const previewUrl = useMemo(() => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-dashed border-[#c2dcff] bg-[#f5f9ff] px-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={file.name} className="size-8 shrink-0 rounded-[6px] object-cover" />
        ) : (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[6px] bg-[#dbeafe]">
            <FileText size={16} className="text-[#1e4f86]" />
          </div>
        )}

        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#0d2138]" style={mont}>
          {file.name}
        </span>

        {uploading ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#dbeafe] px-2 py-0.5 text-[10px] font-medium text-[#1e4f86]" style={mont}>
            <Loader2 size={10} className="animate-spin" />
            {t("composer.uploading")}
          </span>
        ) : (
          <span className="shrink-0 text-[11px] text-[#99a1af]" style={mont}>
            {formatFileSize(file.size)}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        disabled={uploading}
        aria-label={t("composer.removeAria", { name: file.name })}
        title={t("composer.removeTitle")}
        className="flex size-7 shrink-0 items-center justify-center rounded-[8px] text-[#6a7282] transition-colors hover:bg-red-50 hover:text-[#e7000b] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function MessageComposer({
  draft,
  onDraftChange,
  pendingFiles,
  onAddFiles,
  onRemoveFile,
  onSend,
  sending,
  sendError,
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  pendingFiles: File[];
  onAddFiles: (files: FileList | null) => void;
  onRemoveFile: (index: number) => void;
  onSend: () => void;
  sending: boolean;
  sendError: string | null;
}) {
  const { t } = useTranslation("messages");
  const isOnline = useIsOnline();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [draft]);

  const canSend = (draft.trim().length > 0 || pendingFiles.length > 0) && !sending && isOnline;

  return (
    <div className="shrink-0 border-t border-[#e5e7eb] bg-white p-3 sm:p-4 lg:px-6 lg:py-4">
      {!isOnline && (
        <div className="mb-2.5 flex items-center gap-2 rounded-[10px] bg-[#fff7e6] px-3 py-2 text-[11px] font-medium text-[#a16207]" style={mont}>
          <WifiOff size={14} className="shrink-0" />
          {t("composer.offlineNotice")}
        </div>
      )}

      {sendError && (
        <div className="mb-2.5 flex items-center gap-2 rounded-[10px] bg-[#fff1f2] px-3 py-2 text-[11px] font-medium text-[#e7000b]" style={mont}>
          <AlertCircle size={14} className="shrink-0" />
          {sendError}
        </div>
      )}

      {pendingFiles.length > 0 && (
        <div className="mb-2.5 flex flex-col gap-2">
          {pendingFiles.map((file, index) => (
            <PendingAttachmentCard
              key={`${file.name}-${file.lastModified}-${index}`}
              file={file}
              uploading={sending}
              onRemove={() => onRemoveFile(index)}
            />
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            onAddFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            onAddFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <div className="flex min-w-0 flex-1 items-end rounded-[16px] border border-[#dfe3e8] bg-[#f8fafc] px-2 py-1.5 transition-colors focus-within:border-[#1e4f86]/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1e4f86]/15 sm:px-2.5">
          <button
            type="button"
            aria-label={t("composer.attachFileAria")}
            title={t("composer.attachFileAria")}
            disabled={sending}
            onClick={() => fileInputRef.current?.click()}
            className="flex size-8 shrink-0 items-center justify-center self-end rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#eef2f6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Paperclip size={17} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            aria-label={t("composer.attachImageAria")}
            title={t("composer.attachImageAria")}
            disabled={sending}
            onClick={() => imageInputRef.current?.click()}
            className="flex size-8 shrink-0 items-center justify-center self-end rounded-[8px] text-[#6a7282] transition-colors hover:bg-[#eef2f6] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImageIcon size={17} strokeWidth={1.8} />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={t("composer.messagePlaceholder")}
            aria-label={t("composer.messageAria")}
            className="min-h-[32px] min-w-0 flex-1 resize-none bg-transparent px-2 py-1.5 text-[12px] leading-5 text-[#0d2138] outline-none placeholder:text-[#99a1af] sm:text-[13px]"
            style={{ ...poppins, maxHeight: MAX_TEXTAREA_HEIGHT }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
          />
        </div>

        <button
          type="button"
          disabled={!canSend}
          aria-label={t("composer.sendAria")}
          onClick={onSend}
          className="
            flex h-11 shrink-0
            items-center justify-center
            gap-2
            rounded-[14px]
            bg-[#1e4f86]
            px-4
            text-white
            outline-none
            transition-colors
            hover:bg-[#173d69]
            focus-visible:ring-2 focus-visible:ring-[#1e4f86]/40
            disabled:cursor-not-allowed
            disabled:bg-[#dbe3ec]
            disabled:text-[#99a1af]
            sm:px-6
          "
          style={mont}
        >
          {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} strokeWidth={1.8} />}
          <span className="hidden text-[13.5px] font-semibold sm:inline">{sending ? t("composer.sending") : t("composer.send")}</span>
        </button>
      </div>
    </div>
  );
}
