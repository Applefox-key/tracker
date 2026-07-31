import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/Button";
import { TagCombobox } from "@/shared/ui/TagCombobox";
import { EntryCategory } from "@/features/entries/types";
import { useEntryCrud } from "@/hooks/useEntryCrud";
import type { BatchEntryInput } from "@/hooks/useEntryCrud";

type ColumnField = "word" | "explanation" | "example" | "skip";

const COLUMN_FIELDS: ColumnField[] = ["word", "explanation", "example", "skip"];
const DEFAULT_COLUMNS: ColumnField[] = ["word", "explanation", "example"];
const CATEGORIES: EntryCategory[] = ["word", "phrase", "grammar", "idiom", "note"];

interface ParsedRow {
  word: string;
  explanation: string;
  example: string;
}

interface ImportBundleModalProps {
  onClose: () => void;
}

export function ImportBundleModal({ onClose }: ImportBundleModalProps) {
  const { t } = useTranslation();
  const { addBatchEntries } = useEntryCrud();

  const [fileText, setFileText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [delimiter, setDelimiter] = useState(";");
  const [columns, setColumns] = useState<ColumnField[]>(DEFAULT_COLUMNS);
  const [category, setCategory] = useState<EntryCategory>("word");
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDone, setImportDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function parse(text: string, delim: string, cols: ColumnField[]): { valid: ParsedRow[]; skipped: number } {
    if (!delim) return { valid: [], skipped: 0 };
    const rows = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(delim).map((p) => p.trim().replace(/\/n/g, "\n"));
        const row: ParsedRow = { word: "", explanation: "", example: "" };
        cols.forEach((field, i) => {
          if (field !== "skip" && parts[i] !== undefined) {
            row[field] = parts[i];
          }
        });
        return row;
      });
    const valid = rows.filter((r) => r.word && r.explanation);
    return { valid, skipped: rows.length - valid.length };
  }

  const { valid: parsed, skipped: skippedCount } = fileText
    ? parse(fileText, delimiter, columns)
    : { valid: [], skipped: 0 };

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileText(await file.text());
    setImportDone(false);
    setImportError(null);
    setImportedCount(null);
  }

  function setColumn(i: number, field: ColumnField) {
    const next = [...columns];
    if (field !== "skip") {
      const prev = next.findIndex((f, idx) => idx !== i && f === field);
      if (prev !== -1) next[prev] = "skip";
    }
    next[i] = field;
    setColumns(next);
  }

  function removeColumn(i: number) {
    setColumns(columns.filter((_, idx) => idx !== i));
  }

  async function handleImport() {
    if (parsed.length === 0 || importing) return;
    setImporting(true);
    setImportError(null);
    setImportedCount(null);
    try {
      const batch: BatchEntryInput[] = parsed.map((row) => ({
        word: row.word,
        explanation: row.explanation,
        example: row.example,
        category,
        rating: 1,
        includeInPractice: true,
      }));
      const result = await addBatchEntries(batch, tagIds);
      setImportedCount(result.count);
      setImportDone(true);
    } catch {
      setImportError(t("entries.importBundle.errorOn"));
    }
    setImporting(false);
  }

  const btnActive = "bg-emerald-600 text-white border-emerald-600";
  const btnInactive =
    "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("entries.importBundle.title")}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg leading-none">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
          {/* File + Delimiter */}
          {/* Labels */}
          <div className="w-full text-sm font-medium text-gray-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400">
            {t("entries.importBundle.chooseFile")}
          </div>
          <div className="flex justify-between gap-1.5">
            {/* File */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("entries.importBundle.file")}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shrink-0">
                  {t("entries.importBundle.chooseFile")}
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {fileName || t("entries.importBundle.noFile")}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.tsv,text/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t("entries.importBundle.fileHint")}</p>
            </div>
            {/* Delimiter  */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("entries.importBundle.delimiter")}
              </label>
              <input
                type="text"
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                maxLength={5}
                className="w-20 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Preview */}
          {parsed.length > 0 && (
            <>
              <hr className="border-gray-200 dark:border-gray-700" />
              {/* Files columns */}
              <div className="flex flex-wrap gap-6 items-start">
                <div className="flex flex-col gap-1.5 flex-1 min-w-0 ">
                  <label className="text-sm font-medium text-gray-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                    {t("entries.importBundle.columns")}
                  </label>
                  <div className="flex gap-2 flex-wrap items-end">
                    {columns.map((field, i) => (
                      <div key={i} className="flex flex-col gap-1">
                        <span className="text-xs text-gray-400 dark:text-gray-500 text-center">
                          {t("entries.importBundle.col")} {i + 1}
                        </span>
                        <div className="flex gap-1">
                          <select
                            value={field}
                            onChange={(e) => setColumn(i, e.target.value as ColumnField)}
                            className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-400">
                            {COLUMN_FIELDS.map((f) => (
                              <option key={f} value={f}>
                                {t(`entries.importBundle.fields.${f}`)}
                              </option>
                            ))}
                          </select>
                          {columns.length > 1 && (
                            <button
                              onClick={() => removeColumn(i)}
                              className="text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 transition-colors text-xs px-1">
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setColumns([...columns, "skip"])}
                      className="px-2.5 py-1.5 text-xs border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors self-end">
                      {t("entries.importBundle.addCol")}
                    </button>
                  </div>
                </div>
              </div>{" "}
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap ">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ">
                    {t("entries.importBundle.preview", { count: parsed.length })}
                  </span>
                  {skippedCount > 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      {t("entries.importBundle.skipped", { count: skippedCount })}
                    </span>
                  )}
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-y-auto max-h-44">
                    <table className="w-full text-xs border-collapse">
                      <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-500 dark:text-gray-400 font-medium w-1/3">
                            {t("entries.importBundle.fields.word")}
                          </th>
                          <th className="text-left px-3 py-2 text-gray-500 dark:text-gray-400 font-medium w-1/3">
                            {t("entries.importBundle.fields.explanation")}
                          </th>
                          <th className="text-left px-3 py-2 text-gray-500 dark:text-gray-400 font-medium w-1/3">
                            {t("entries.importBundle.fields.example")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.slice(0, 30).map((row, i) => (
                          <tr
                            key={i}
                            className="border-t border-gray-100 dark:border-gray-700/50 even:bg-gray-50/50 dark:even:bg-gray-700/20">
                            <td className="px-3 py-1.5 text-gray-900 dark:text-gray-100 font-medium truncate max-w-0">
                              <span className="block truncate">{row.word}</span>
                            </td>
                            <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 truncate max-w-0">
                              <span className="block truncate">{row.explanation}</span>
                            </td>
                            <td className="px-3 py-1.5 text-gray-400 dark:text-gray-500 truncate max-w-0">
                              <span className="block truncate">{row.example}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsed.length > 30 && (
                    <div className="px-3 py-2 text-center text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-700/20">
                      {t("entries.importBundle.more", { count: parsed.length - 30 })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          <hr className="border-gray-200 dark:border-gray-700" />
          {/* Category */}
          <div className="flex flex-col gap-2 ">
            <label className="text-sm font-medium text-gray-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400">
              {t("entries.importBundle.category")}
            </label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={[
                    "px-3 py-1 rounded-lg text-xs font-medium border transition-colors",
                    category === cat ? btnActive : btnInactive,
                  ].join(" ")}>
                  {t(`dashboard.categories.${cat}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("entries.importBundle.tags")}
            </label>
            <TagCombobox selectedIds={tagIds} onChange={setTagIds} />
          </div>
          {/* Import status */}
          {importing && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <svg
                className="animate-spin h-4 w-4 text-emerald-500 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t("entries.importBundle.importing")}
            </div>
          )}

          {importError && <p className="text-sm text-red-500 dark:text-red-400">{importError}</p>}

          {importDone && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ {t("entries.importBundle.success", { count: importedCount ?? parsed.length })}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose} disabled={importing}>
            {importDone ? t("entries.detail.close") : t("entries.cancel")}
          </Button>
          {!importDone && (
            <Button onClick={handleImport} disabled={parsed.length === 0 || importing || !delimiter}>
              {importing
                ? t("entries.importBundle.importing")
                : parsed.length > 0
                  ? t("entries.importBundle.importCount", { count: parsed.length })
                  : t("entries.importBundle.import")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
