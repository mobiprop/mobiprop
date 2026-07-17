"use client";

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type NewIntegrationRequest = {
  name: string;
  url: string;
  description: string;
  useCase: string;
};

type RequestIntegrationModalProps = {
  onClose: () => void;
  onSubmit?: (request: NewIntegrationRequest) => void;
};

const inputClass =
  "w-full min-w-0 h-10 px-3.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0a0a0a] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 transition-colors";

const textareaClass =
  "w-full min-w-0 px-3.5 py-2.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] leading-5 text-[#0a0a0a] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 transition-colors resize-none";

const labelClass = "text-[12px] text-[#1f2937]";

export function RequestIntegrationModal({
  onClose,
  onSubmit,
}: RequestIntegrationModalProps) {
  const { t } = useTranslation("integrations");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit?.({
      name: name.trim(),
      url: url.trim(),
      description: description.trim(),
      useCase: useCase.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-integration-title"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal */}
      <div
        className="relative z-10 flex w-full max-w-[650px] max-h-[calc(100dvh-24px)] flex-col overflow-hidden rounded-[18px] bg-white shadow-xl sm:max-h-[92dvh] sm:rounded-[14px]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p
                id="request-integration-title"
                className="break-words text-[15px] font-semibold leading-6 text-[#1f2937] sm:text-[16px]"
                style={mont}
              >
                {t("requestModal.title")}
              </p>

              <p
                className="mt-0.5 break-words text-[11px] leading-5 text-[#6a7282] sm:text-[12px]"
                style={mont}
              >
                {t("requestModal.subtitle")}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t("requestModal.closeAria")}
              className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* Scrollable content */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
            <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
              {/* Integration name */}
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="integration-name"
                  className={labelClass}
                  style={mont}
                >
                  {t("requestModal.nameLabel")}
                </label>

                <input
                  id="integration-name"
                  required
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder={t("requestModal.namePlaceholder")}
                  className={inputClass}
                  style={mont}
                />
              </div>

              {/* Website URL */}
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="integration-url"
                  className={labelClass}
                  style={mont}
                >
                  {t("requestModal.urlLabel")}
                </label>

                <input
                  id="integration-url"
                  type="url"
                  value={url}
                  onChange={(event) =>
                    setUrl(event.target.value)
                  }
                  placeholder={t("requestModal.urlPlaceholder")}
                  className={inputClass}
                  style={mont}
                />
              </div>

              {/* Description */}
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="integration-description"
                  className={labelClass}
                  style={mont}
                >
                  {t("requestModal.descriptionLabel")}
                </label>

                <textarea
                  id="integration-description"
                  required
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder={t("requestModal.descriptionPlaceholder")}
                  rows={3}
                  className={`${textareaClass} min-h-[96px]`}
                  style={mont}
                />
              </div>

              {/* Use case */}
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="integration-use-case"
                  className={labelClass}
                  style={mont}
                >
                  {t("requestModal.useCaseLabel")}
                </label>

                <textarea
                  id="integration-use-case"
                  required
                  value={useCase}
                  onChange={(event) =>
                    setUseCase(event.target.value)
                  }
                  placeholder={t("requestModal.useCasePlaceholder")}
                  rows={4}
                  className={`${textareaClass} min-h-[120px]`}
                  style={mont}
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="shrink-0 border-t border-[#e5e7eb] bg-white p-4 sm:px-6 sm:py-5">
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="min-h-10 w-full flex-1 rounded-[10px] border border-[#e5e7eb] bg-white px-5 text-[12px] font-medium text-[#6b7280] transition-colors hover:bg-[#f3f4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/20"
                style={mont}
              >
                {t("requestModal.cancel")}
              </button>

              <button
                type="submit"
                className="min-h-10 w-full flex-1 rounded-[10px] bg-[#1e4f86] px-5 text-[12px] font-medium text-white transition-colors hover:bg-[#1b487a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30"
                style={mont}
              >
                {t("requestModal.submit")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}