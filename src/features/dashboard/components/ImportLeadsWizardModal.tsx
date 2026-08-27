"use client";

import { useRef, useState } from "react";
import { X, Upload, ArrowLeft, ArrowRight, Loader2, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LeadSource } from "@/generated/prisma/enums";
import { importLeadRowSchema } from "@/schemas/lead.schema";
import { parseSpreadsheetFile } from "@/lib/spreadsheet";
import { SearchableSelect } from "./SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };

type TargetField =
  | "submittedName"
  | "submittedEmail"
  | "submittedPhone"
  | "submittedLocation"
  | "budgetMin"
  | "budgetMax"
  | "notes"
  | "__ignore__";

const TARGET_FIELD_ORDER: TargetField[] = [
  "submittedName",
  "submittedEmail",
  "submittedPhone",
  "submittedLocation",
  "budgetMin",
  "budgetMax",
  "notes",
  "__ignore__",
];

// Same normalization/aliases as the quick-fix importer already shipped in
// LeadsPage.tsx — a file that maps cleanly there pre-fills identically here.
const HEADER_ALIASES: Record<string, TargetField> = {
  name: "submittedName",
  fullname: "submittedName",
  submittedname: "submittedName",
  nombreyapellido: "submittedName",
  email: "submittedEmail",
  emailaddress: "submittedEmail",
  phone: "submittedPhone",
  phonenumber: "submittedPhone",
  telfono: "submittedPhone",
  location: "submittedLocation",
  barrio: "submittedLocation",
  budgetmin: "budgetMin",
  budgetmax: "budgetMax",
  notes: "notes",
  mensaje: "notes",
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z]/g, "");
}

const IMPORT_SOURCE_OPTIONS: LeadSource[] = [LeadSource.IMPORT, LeadSource.ZONAPROP, LeadSource.EXTERNAL_API, LeadSource.OTHER];

type WizardStep = "upload" | "map" | "preview" | "done";

export type ImportLeadsRunResult = { created: number; skipped: number; errors: { row: number; message: string }[] };

type ImportLeadsWizardModalProps = {
  onClose: () => void;
  onImport: (rows: Record<string, unknown>[], source: LeadSource) => Promise<ImportLeadsRunResult>;
};

const PREVIEW_ROW_LIMIT = 50;

export function ImportLeadsWizardModal({ onClose, onImport }: ImportLeadsWizardModalProps) {
  const { t } = useTranslation("leads");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<WizardStep>("upload");
  const [fileName, setFileName] = useState("");
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, TargetField>>({});
  const [source, setSource] = useState<LeadSource>(LeadSource.IMPORT);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ImportLeadsRunResult | null>(null);

  async function handleFile(file: File) {
    setParseError(null);
    try {
      const parsed = await parseSpreadsheetFile(file);
      if (parsed.length === 0) {
        setParseError(t("importWizard.noRows"));
        return;
      }

      const headerSet = new Set<string>();
      parsed.forEach((row) => Object.keys(row).forEach((k) => headerSet.add(k)));
      const detectedHeaders = [...headerSet];

      const initialMapping: Record<string, TargetField> = {};
      for (const header of detectedHeaders) {
        initialMapping[header] = HEADER_ALIASES[normalizeHeader(header)] ?? "__ignore__";
      }

      setFileName(file.name);
      setRecords(parsed);
      setHeaders(detectedHeaders);
      setMapping(initialMapping);
      setStep("map");
    } catch {
      setParseError(t("importWizard.parseFailed"));
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  }

  function buildMappedRows(): Record<string, string>[] {
    return records.map((record) => {
      const mapped: Record<string, string> = {};
      for (const header of headers) {
        const field = mapping[header];
        const value = record[header];
        // First non-empty source column mapped to a field wins — mirrors
        // the quick-fix importer (two columns can map to the same field).
        if (field && field !== "__ignore__" && value && !mapped[field]) mapped[field] = value;
      }
      return mapped;
    });
  }

  const mappedRows = step === "preview" || step === "done" ? buildMappedRows() : [];
  const validation = mappedRows.map((row) => {
    const parsed = importLeadRowSchema.safeParse(row);
    return { row, valid: parsed.success, error: parsed.success ? null : (parsed.error.issues[0]?.message ?? t("importWizard.invalidRow")) };
  });
  const validRows = validation.filter((v) => v.valid).map((v) => v.row);
  const invalidCount = validation.length - validRows.length;
  const nameIsMapped = Object.values(mapping).includes("submittedName");

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      const res = await onImport(validRows, source);
      setResult(res);
      setStep("done");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative flex max-h-[90vh] w-full max-w-[820px] flex-col overflow-hidden rounded-[16px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-[#e5e7eb] px-6 pb-[18px] pt-6">
          <div>
            <p className="text-[16px] font-semibold leading-6 text-[#0d2138]" style={mont}>{t("importWizard.title")}</p>
            <p className="mt-0.5 text-[12px] text-[#6a7282]" style={mont}>
              {step === "upload" && t("importWizard.stepUpload")}
              {step === "map" && t("importWizard.stepMap")}
              {step === "preview" && t("importWizard.stepPreview")}
              {step === "done" && t("importWizard.stepDone")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] p-2 text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
          >
            <X size={19} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "upload" && (
            <div className="flex flex-col items-center gap-4 rounded-[14px] border-2 border-dashed border-[#d1d5dc] bg-[#fafbfc] px-6 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-[#eff6ff]">
                <Upload size={22} className="text-[#1e4f86]" />
              </span>
              <div>
                <p className="text-[14px] font-medium text-[#0d2138]" style={mont}>{t("importWizard.dropTitle")}</p>
                <p className="mt-1 text-[12px] text-[#6a7282]" style={mont}>{t("importWizard.dropHint")}</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-[10px] bg-[#1e4f86] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1b487a]"
                style={mont}
              >
                {t("importWizard.chooseFile")}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileInputChange}
              />
              {parseError && (
                <p className="flex items-center gap-1.5 text-[12px] text-[#d4183d]" style={mont}>
                  <AlertTriangle size={13} className="shrink-0" /> {parseError}
                </p>
              )}
            </div>
          )}

          {step === "map" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 rounded-[10px] bg-[#f8fafc] px-3.5 py-2.5">
                <FileSpreadsheet size={15} className="shrink-0 text-[#1a5ea8]" />
                <p className="min-w-0 truncate text-[12px] text-[#0d2138]" style={mont}>{fileName}</p>
                <span className="ml-auto shrink-0 text-[12px] text-[#6a7282]" style={mont}>
                  {t("importWizard.rowCount", { count: records.length })}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#1f2937]" style={mont}>{t("importWizard.sourceLabel")}</label>
                <SearchableSelect
                  size="sm"
                  searchable={false}
                  value={source}
                  onChange={(next) => setSource(next as LeadSource)}
                  options={IMPORT_SOURCE_OPTIONS.map((value) => ({
                    value,
                    label: t(`source.${value}`),
                  }))}
                  placeholder={t("importWizard.sourceLabel")}
                  className="max-w-[260px]"
                />
                <p className="text-[11px] text-[#6a7282]" style={mont}>{t("importWizard.sourceHint")}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-[12px] font-medium text-[#1f2937]" style={mont}>{t("importWizard.mapTitle")}</p>
                <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb]">
                  <div className="grid grid-cols-2 bg-[#f8fafc] px-3.5 py-2 text-[11px] font-medium uppercase tracking-wide text-[#6a7282]" style={mont}>
                    <span>{t("importWizard.sourceColumn")}</span>
                    <span>{t("importWizard.targetField")}</span>
                  </div>
                  <div className="flex max-h-[280px] flex-col divide-y divide-[#f3f4f6] overflow-y-auto">
                    {headers.map((header) => (
                      <div key={header} className="grid grid-cols-2 items-center gap-2 px-3.5 py-2.5">
                        <span className="min-w-0 truncate text-[12px] text-[#0d2138]" style={mont} title={header}>{header}</span>
                        <SearchableSelect
                          size="sm"
                          searchable={false}
                          value={mapping[header] ?? "__ignore__"}
                          onChange={(next) => setMapping((prev) => ({ ...prev, [header]: next as TargetField }))}
                          options={TARGET_FIELD_ORDER.map((field) => ({
                            value: field,
                            label: t(`importWizard.fields.${field}`),
                          }))}
                          placeholder={t("importWizard.fields.__ignore__")}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {!nameIsMapped && (
                  <p className="flex items-center gap-1.5 text-[12px] text-[#b45309]" style={mont}>
                    <AlertTriangle size={13} className="shrink-0" /> {t("importWizard.nameRequired")}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3 rounded-[10px] bg-[#f8fafc] px-3.5 py-2.5 text-[12px]" style={mont}>
                <span className="flex items-center gap-1.5 text-[#008236]">
                  <CheckCircle2 size={14} className="shrink-0" /> {t("importWizard.validCount", { count: validRows.length })}
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1.5 text-[#d4183d]">
                    <AlertTriangle size={14} className="shrink-0" /> {t("importWizard.invalidCount", { count: invalidCount })}
                  </span>
                )}
                <span className="ml-auto text-[#6a7282]">
                  {t("importWizard.sourceLabel")}: {t(`source.${source}`)}
                </span>
              </div>

              <div className="overflow-x-auto rounded-[10px] border border-[#e5e7eb]">
                <table className="w-full min-w-[560px] text-[12px]" style={mont}>
                  <thead className="bg-[#f8fafc] text-left text-[11px] font-medium uppercase tracking-wide text-[#6a7282]">
                    <tr>
                      <th className="px-3 py-2">{t("importWizard.fields.submittedName")}</th>
                      <th className="px-3 py-2">{t("importWizard.fields.submittedEmail")}</th>
                      <th className="px-3 py-2">{t("importWizard.fields.submittedPhone")}</th>
                      <th className="px-3 py-2">{t("importWizard.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3f4f6]">
                    {validation.slice(0, PREVIEW_ROW_LIMIT).map((v, i) => (
                      <tr key={i} className={v.valid ? undefined : "bg-[#fef2f2]"}>
                        <td className="px-3 py-2 text-[#0d2138]">{v.row.submittedName || "—"}</td>
                        <td className="px-3 py-2 text-[#0d2138]">{v.row.submittedEmail || "—"}</td>
                        <td className="px-3 py-2 text-[#0d2138]">{v.row.submittedPhone || "—"}</td>
                        <td className="px-3 py-2">
                          {v.valid ? (
                            <span className="text-[#008236]">{t("importWizard.ok")}</span>
                          ) : (
                            <span className="text-[#d4183d]" title={v.error ?? undefined}>{v.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {validation.length > PREVIEW_ROW_LIMIT && (
                  <p className="border-t border-[#e5e7eb] px-3 py-2 text-[11px] text-[#6a7282]" style={mont}>
                    {t("importWizard.previewTruncated", { shown: PREVIEW_ROW_LIMIT, total: validation.length })}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === "done" && result && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-[#dcfce7]">
                <CheckCircle2 size={24} className="text-[#008236]" />
              </span>
              <p className="text-[15px] font-medium text-[#0d2138]" style={mont}>
                {t("importWizard.doneSummary", { created: result.created, skipped: result.skipped })}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2 w-full max-w-[480px] rounded-[10px] border border-[#fde68a] bg-[#fffbeb] px-3.5 py-3 text-left text-[12px] text-[#92400e]" style={mont}>
                  {result.errors.slice(0, 5).map((err) => (
                    <p key={err.row}>{t("importWizard.rowError", { row: err.row, message: err.message })}</p>
                  ))}
                  {result.errors.length > 5 && <p>{t("importWizard.moreErrors", { count: result.errors.length - 5 })}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-[#e5e7eb] px-6 py-4">
          {step === "done" ? (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto h-10 rounded-[10px] bg-[#1e4f86] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#1b487a]"
              style={mont}
            >
              {t("importWizard.finish")}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => (step === "map" ? setStep("upload") : step === "preview" ? setStep("map") : onClose())}
                className="flex h-10 items-center gap-1.5 rounded-[10px] border border-[#e5e7eb] px-4 text-[13px] font-medium text-[#4a5565] transition-colors hover:bg-[#f9fafb]"
                style={mont}
              >
                <ArrowLeft size={15} /> {step === "upload" ? t("importWizard.cancel") : t("importWizard.back")}
              </button>

              {step === "map" && (
                <button
                  type="button"
                  onClick={() => setStep("preview")}
                  disabled={!nameIsMapped}
                  className="flex h-10 items-center gap-1.5 rounded-[10px] bg-[#1e4f86] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-60"
                  style={mont}
                >
                  {t("importWizard.next")} <ArrowRight size={15} />
                </button>
              )}

              {step === "preview" && (
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting || validRows.length === 0}
                  className="flex h-10 items-center gap-1.5 rounded-[10px] bg-[#1e4f86] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-60"
                  style={mont}
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : null}
                  {t("importWizard.confirmImport", { count: validRows.length })}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
