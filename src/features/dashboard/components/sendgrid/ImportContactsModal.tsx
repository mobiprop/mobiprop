"use client";

import { useMemo, useRef, useState } from "react";
import { X, Check, Upload, FileText, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { parseCsv } from "@/lib/csv";
import type { EmailListDto, ImportPreview, ImportRow } from "@/features/integrations/sendgrid-actions";
import { usePreviewImportMutation, useCommitImportMutation } from "@/hooks/mutations/useSendgridMutations";
import { Toggle } from "@/features/dashboard/components/settings/Toggle";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const MAX_FILE_BYTES = 25 * 1024 * 1024;

type Step = 1 | 2 | 3;
type Method = "csv" | "paste";

type ImportContactsModalProps = {
  lists: EmailListDto[];
  /** Preselected target list (opened from a specific list), if any. */
  initialListId?: string;
  onClose: () => void;
};

function StepDot({ step, current, label }: { step: Step; current: Step; label: string }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
          done ? "bg-[#16a34a] text-white" : active ? "bg-[#1e4f86] text-white" : "bg-[#f3f4f6] text-[#9ca3af]"
        }`}
        style={mont}
      >
        {done ? <Check size={14} /> : step}
      </span>
      <span className={`truncate text-[13px] font-medium ${done ? "text-[#374151]" : active ? "text-[#1e4f86]" : "text-[#9ca3af]"}`} style={mont}>
        {label}
      </span>
    </div>
  );
}

/** Maps parsed CSV rows (header included) to ImportRow[] by header names. */
function rowsFromCsv(cells: string[][]): { rows: ImportRow[]; missingEmailColumn: boolean } {
  if (cells.length === 0) return { rows: [], missingEmailColumn: true };
  const header = cells[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const emailIdx = header.findIndex((h) => h === "email" || h === "email_address" || h === "e-mail");
  if (emailIdx === -1) return { rows: [], missingEmailColumn: true };
  const firstIdx = header.findIndex((h) => h === "first_name" || h === "firstname" || h === "first");
  const lastIdx = header.findIndex((h) => h === "last_name" || h === "lastname" || h === "last");
  const phoneIdx = header.findIndex((h) => h === "phone" || h === "phone_number" || h === "telephone");

  const rows: ImportRow[] = cells.slice(1).map((row) => ({
    email: row[emailIdx] ?? "",
    firstName: firstIdx >= 0 ? row[firstIdx] : undefined,
    lastName: lastIdx >= 0 ? row[lastIdx] : undefined,
    phone: phoneIdx >= 0 ? row[phoneIdx] : undefined,
  }));
  return { rows: rows.filter((r) => r.email?.trim()), missingEmailColumn: false };
}

export function ImportContactsModal({ lists, initialListId, onClose }: ImportContactsModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<Method>("csv");
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<ImportRow[]>([]);
  const [pasted, setPasted] = useState("");
  const [listId, setListId] = useState(initialListId ?? lists.find((l) => l.isSystem)?.id ?? "");
  const [duplicateMode, setDuplicateMode] = useState<"update" | "skip">("update");
  const [skipUnsubscribed, setSkipUnsubscribed] = useState(true);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewMutation = usePreviewImportMutation();
  const commitMutation = useCommitImportMutation();

  const rows: ImportRow[] = useMemo(() => {
    if (method === "csv") return csvRows;
    return pasted
      .split(/[\s,;]+/)
      .filter(Boolean)
      .map((email) => ({ email }));
  }, [method, csvRows, pasted]);

  const selectedList = lists.find((l) => l.id === listId);

  async function readFile(file: File) {
    setError(null);
    if (file.size > MAX_FILE_BYTES) {
      setError("File is larger than 25 MB.");
      return;
    }
    const text = await file.text();
    const parsed = rowsFromCsv(parseCsv(text));
    if (parsed.missingEmailColumn) {
      setError('The CSV needs an "email" column (optional: first_name, last_name, phone).');
      setCsvRows([]);
      setFileName(null);
      return;
    }
    if (parsed.rows.length === 0) {
      setError("No rows with an email value were found in the file.");
      setCsvRows([]);
      setFileName(null);
      return;
    }
    setCsvRows(parsed.rows);
    setFileName(file.name);
  }

  async function handleContinueToReview() {
    if (!listId) {
      setError("Select a target list.");
      return;
    }
    setError(null);
    try {
      const result = await previewMutation.mutateAsync({ listId, rows });
      setPreview(result.preview);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not analyse the import.");
    }
  }

  async function handleImport() {
    if (commitMutation.isPending) return;
    try {
      const result = await commitMutation.mutateAsync({ listId, rows, duplicateMode, skipUnsubscribed, method });
      toast.success(
        `Imported ${result.imported} new contact${result.imported === 1 ? "" : "s"}` +
          (result.updated > 0 ? `, updated ${result.updated}` : "") +
          (result.skipped > 0 ? `, skipped ${result.skipped}` : ""),
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    }
  }

  const stepLabel = step === 1 ? "Choose Method" : step === 2 ? "Configure" : "Review & Import";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:items-center sm:p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative z-10 flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[18px] bg-white shadow-xl sm:rounded-[14px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[#e5e7eb] px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-[17px] font-semibold text-[#0d2138]" style={poppins}>Import Contacts</p>
              <p className="text-[12px] text-[#6a7282]" style={mont}>Step {step} of 3 — {stepLabel}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138]">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-5 py-4">
          <StepDot step={1} current={step} label="Choose Method" />
          <span className="h-px flex-1 bg-[#e5e7eb]" />
          <StepDot step={2} current={step} label="Configure" />
          <span className="h-px flex-1 bg-[#e5e7eb]" />
          <StepDot step={3} current={step} label="Review & Import" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-[14px] text-[#374151]" style={mont}>How would you like to add contacts?</p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMethod("csv")}
                  className={`flex flex-col gap-2 rounded-[12px] border p-5 text-left transition-colors ${
                    method === "csv" ? "border-[#1e4f86] bg-[#eff6ff]" : "border-[#e5e7eb] bg-white hover:border-[#c9d6e5]"
                  }`}
                >
                  <span className="flex size-11 items-center justify-center rounded-[10px] bg-white border border-[#e5e7eb]">
                    <Upload size={18} className="text-[#1e4f86]" />
                  </span>
                  <span className="text-[15px] font-semibold text-[#0d2138]" style={mont}>Upload CSV</span>
                  <span className="text-[12px] leading-5 text-[#6a7282]" style={mont}>
                    Import a spreadsheet with name, email and phone
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("paste")}
                  className={`flex flex-col gap-2 rounded-[12px] border p-5 text-left transition-colors ${
                    method === "paste" ? "border-[#1e4f86] bg-[#eff6ff]" : "border-[#e5e7eb] bg-white hover:border-[#c9d6e5]"
                  }`}
                >
                  <span className="flex size-11 items-center justify-center rounded-[10px] bg-white border border-[#e5e7eb]">
                    <FileText size={18} className="text-[#1e4f86]" />
                  </span>
                  <span className="text-[15px] font-semibold text-[#0d2138]" style={mont}>Paste Emails</span>
                  <span className="text-[12px] leading-5 text-[#6a7282]" style={mont}>
                    Paste a list of email addresses, one per line
                  </span>
                </button>
              </div>

              {method === "csv" ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) void readFile(file);
                  }}
                  className={`flex flex-col items-center gap-3 rounded-[12px] border border-dashed p-8 text-center transition-colors ${
                    dragOver ? "border-[#1e4f86] bg-[#eff6ff]" : "border-[#c9d6e5] bg-[#fafbfc]"
                  }`}
                >
                  <span className="flex size-12 items-center justify-center rounded-[12px] bg-[#f3f4f6]">
                    <Upload size={20} className="text-[#6a7282]" />
                  </span>
                  {fileName ? (
                    <>
                      <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{fileName}</p>
                      <p className="text-[12px] text-[#16a34a]" style={mont}>{csvRows.length} rows detected</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Drop your CSV file here</p>
                      <p className="text-[12px] text-[#6a7282]" style={mont}>or click to browse — max 25 MB</p>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[38px] rounded-[10px] border border-[#e5e7eb] bg-white px-4 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb]"
                    style={mont}
                  >
                    Browse Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void readFile(file);
                      e.target.value = "";
                    }}
                  />
                  <p className="text-[11px] text-[#9ca3af]" style={mont}>
                    Required column: email · Optional: first_name, last_name, phone
                  </p>
                </div>
              ) : (
                <textarea
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  rows={8}
                  placeholder={"maria@example.com\njuan@example.com"}
                  className="w-full resize-y rounded-[12px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 py-3 text-[13px] text-[#0d2138] placeholder:text-[#9ca3af] focus:border-[#1e4f86] focus:outline-none"
                  style={mont}
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-[14px] text-[#374151]" style={mont}>Configure import settings and target list</p>

              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>
                  Add contacts to list <span className="text-[#dc2626]">*</span>
                </span>
                <select
                  value={listId}
                  onChange={(e) => setListId(e.target.value)}
                  className="min-h-[44px] w-full rounded-[10px] border border-[#e5e7eb] bg-[#fafbfc] px-3.5 text-[13px] text-[#0d2138] focus:border-[#1e4f86] focus:outline-none"
                  style={mont}
                >
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.memberCount})
                    </option>
                  ))}
                </select>
                {!selectedList?.isSystem && (
                  <p className="text-[12px] text-[#6a7282]" style={mont}>
                    Contacts will also be added to All Contacts automatically
                  </p>
                )}
              </div>

              <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>If a contact already exists</span>
              {(
                [
                  ["update", "Update existing contact", "Merge imported fields with existing contact data"],
                  ["skip", "Skip duplicates", "Leave existing contacts unchanged, only add new ones"],
                ] as const
              ).map(([mode, title, sub]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDuplicateMode(mode)}
                  className={`flex items-start gap-3 rounded-[12px] border p-4 text-left transition-colors ${
                    duplicateMode === mode ? "border-[#1e4f86]" : "border-[#e5e7eb] hover:border-[#c9d6e5]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
                      duplicateMode === mode ? "border-[#1e4f86]" : "border-[#c9d6e5]"
                    }`}
                  >
                    {duplicateMode === mode && <span className="size-2 rounded-full bg-[#1e4f86]" />}
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[14px] font-semibold text-[#0d2138]" style={mont}>{title}</span>
                    <span className="text-[12px] text-[#6a7282]" style={mont}>{sub}</span>
                  </span>
                </button>
              ))}

              <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#e5e7eb] p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Skip unsubscribed contacts</span>
                  <span className="text-[12px] text-[#6a7282]" style={mont}>Do not re-add contacts who have previously unsubscribed</span>
                </div>
                <Toggle checked={skipUnsubscribed} onChange={setSkipUnsubscribed} label="Skip unsubscribed contacts" />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#e5e7eb] p-4 opacity-60">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-semibold text-[#0d2138]" style={mont}>Send double opt-in confirmation</span>
                  <span className="text-[12px] text-[#6a7282]" style={mont}>Coming soon — confirmation emails are not sent yet</span>
                </div>
                <Toggle checked={false} onChange={() => {}} disabled label="Double opt-in (coming soon)" />
              </div>
            </div>
          )}

          {step === 3 && preview && (
            <div className="flex flex-col gap-4">
              <p className="text-[14px] text-[#374151]" style={mont}>Review the import summary before confirming</p>

              <div className="overflow-hidden rounded-[12px] border border-[#e5e7eb]">
                <div className="border-b border-[#e5e7eb] bg-[#f8fafc] px-4 py-3">
                  <span className="text-[13px] font-semibold text-[#0d2138]" style={mont}>Import Summary</span>
                </div>
                {[
                  ["Import method", method === "csv" ? `CSV file${fileName ? ` (${fileName})` : ""}` : "Pasted email addresses"],
                  ["Target list", selectedList?.name ?? "—"],
                  ["Contacts to import", String(preview.newCount)],
                  ["Duplicates found", `${preview.duplicateCount} (${duplicateMode === "update" ? "will be updated" : "will be skipped"})`],
                  ["Invalid entries", String(preview.invalidCount)],
                  ...(preview.unsubscribedCount > 0
                    ? [["Unsubscribed/bounced", `${preview.unsubscribedCount} (${skipUnsubscribed ? "will be skipped" : "added to list, stay opted out"})`] as [string, string]]
                    : []),
                ].map(([label, value], i) => (
                  <div key={label} className={`flex gap-4 px-4 py-3 ${i > 0 ? "border-t border-[#f3f4f6]" : ""}`}>
                    <span className="w-[160px] shrink-0 text-[13px] text-[#6a7282]" style={mont}>{label}</span>
                    <span className="min-w-0 flex-1 text-[13px] font-semibold text-[#0d2138]" style={mont}>{value}</span>
                  </div>
                ))}
              </div>

              {preview.invalidCount > 0 && (
                <div className="flex items-start gap-2.5 rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#b45309]" />
                  <p className="text-[12px] leading-5 text-[#b45309]" style={mont}>
                    {preview.invalidCount} row{preview.invalidCount === 1 ? " has" : "s have"} an invalid email and will
                    be skipped{preview.invalidSamples.length > 0 ? ` (e.g. ${preview.invalidSamples.slice(0, 3).join(", ")})` : ""}.
                  </p>
                </div>
              )}

              {preview.valid > 0 ? (
                <div className="flex items-start gap-2.5 rounded-[12px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3.5">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#16a34a]" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold text-[#15803d]" style={mont}>Ready to import</span>
                    <span className="text-[12px] leading-5 text-[#15803d]" style={mont}>
                      Contacts will be added to {selectedList?.name}
                      {selectedList?.isSystem ? "" : " and to your All Contacts master list"}.
                      {skipUnsubscribed ? " Unsubscribed contacts will be skipped automatically." : ""}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-[12px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3.5">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#dc2626]" />
                  <span className="text-[12px] leading-5 text-[#dc2626]" style={mont}>
                    Nothing to import — no valid email addresses were found.
                  </span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#dc2626]" />
              <p className="text-[12px] leading-5 text-[#dc2626]" style={mont}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center gap-2.5 border-t border-[#e5e7eb] px-5 py-4">
          {step > 1 && (
            <button
              type="button"
              onClick={() => { setError(null); setStep((s) => (s - 1) as Step); }}
              className="min-h-[42px] rounded-[10px] border border-[#e5e7eb] px-5 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb]"
              style={mont}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] rounded-[10px] border border-[#e5e7eb] px-5 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb]"
            style={mont}
          >
            Cancel
          </button>
          <div className="flex-1" />
          {step === 1 && (
            <button
              type="button"
              onClick={() => {
                if (rows.length === 0) {
                  setError(method === "csv" ? "Upload a CSV file first." : "Paste at least one email address.");
                  return;
                }
                setError(null);
                setStep(2);
              }}
              className="min-h-[42px] rounded-[10px] bg-[#1e4f86] px-10 text-[13px] font-medium text-white hover:bg-[#1b487a]"
              style={mont}
            >
              Continue
            </button>
          )}
          {step === 2 && (
            <button
              type="button"
              onClick={handleContinueToReview}
              disabled={previewMutation.isPending}
              className="flex min-h-[42px] items-center gap-2 rounded-[10px] bg-[#1e4f86] px-10 text-[13px] font-medium text-white hover:bg-[#1b487a] disabled:opacity-50"
              style={mont}
            >
              {previewMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Continue
            </button>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={handleImport}
              disabled={commitMutation.isPending || (preview?.valid ?? 0) === 0}
              className="flex min-h-[42px] items-center gap-2 rounded-[10px] bg-[#1e4f86] px-8 text-[13px] font-medium text-white hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-50"
              style={mont}
            >
              {commitMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {commitMutation.isPending ? "Importing…" : "Import Contacts"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
