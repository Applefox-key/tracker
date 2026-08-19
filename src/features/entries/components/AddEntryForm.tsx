import { FormEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { EntryCategory } from "../types";
import { MULTILINE_CATEGORIES } from "../constants";
import { Button } from "@/shared/ui/Button";
import { TagCombobox } from "@/shared/ui/TagCombobox";
import { VoiceInputButton } from "@/shared/ui/VoiceInputButton";
import { EntryImage } from "@/shared/ui/EntryImage";
import { FaArrowLeft } from "react-icons/fa6";
import { useUserSettings } from "@/hooks/useUserSettings";
import { translateText, getDefaultLangPair, langLabel } from "@/lib/translate";
import type { LangCode } from "@/lib/userSettings";

export interface EntryFormValues {
  word: string;
  explanation: string;
  example: string;
  category: EntryCategory;
  tagIds: number[];
  rating: number;
  includeInPractice: boolean;
  /** New image file chosen by the user (takes priority over currentImgUrl) */
  imgFile?: File | null;
  /** Signal to delete the existing server-side image */
  removeImg?: boolean;
}

interface EntryFormProps {
  mode: "create" | "edit";
  initialValues?: EntryFormValues;
  /** Authenticated URL of the currently saved image (edit mode only) */
  currentImgUrl?: string | null;
  /** Current mastery level (1-5) or null if not practiced yet (edit mode only) */
  masteryLevel?: number | null;
  /** Called when user clicks "Reset mastery" (edit mode only) */
  onResetMastery?: () => void;
  onSubmit: (values: EntryFormValues) => void;
  onCancel: () => void;
}

const CATEGORIES: EntryCategory[] = ["word", "phrase", "grammar", "idiom", "note"];

const DEFAULT_VALUES: EntryFormValues = {
  word: "",
  explanation: "",
  example: "",
  category: "word",
  tagIds: [],
  rating: 1,
  includeInPractice: true,
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-xl leading-none focus:outline-none transition-transform hover:scale-110"
          aria-label={`Rate ${star}`}>
          <span className={(hovered || value) >= star ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}>★</span>
        </button>
      ))}
    </div>
  );
}

export function EntryForm({
  mode,
  initialValues,
  currentImgUrl,
  masteryLevel,
  onResetMastery,
  onSubmit,
  onCancel,
}: EntryFormProps) {
  const { t } = useTranslation();
  const init = initialValues ?? DEFAULT_VALUES;

  const [word, setWord] = useState(init.word);
  const [explanation, setExplanation] = useState(init.explanation);
  const [example, setExample] = useState(init.example);
  const [category, setCategory] = useState<EntryCategory>(init.category);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(init.tagIds);
  const [rating, setRating] = useState(init.rating);
  const [includeInPractice, setIncludeInPractice] = useState(init.includeInPractice);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const { speechLangs } = useUserSettings();
  const validLangs = speechLangs.filter((c) => c !== "") as LangCode[];
  const defaultPair = getDefaultLangPair(validLangs);
  const [wordLang, setWordLang] = useState<LangCode>(defaultPair?.from ?? validLangs[0] ?? "en-US");
  const [explanationLang, setExplanationLang] = useState<LangCode>(defaultPair?.to ?? validLangs[1] ?? "ua-UA");
  const [translatingExpl, setTranslatingExpl] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  async function handleTranslateExplanation() {
    if (!word.trim()) return;
    setTranslatingExpl(true);
    setTranslateError(null);
    try {
      const result = await translateText(word.trim(), wordLang, explanationLang);
      setExplanation(result);
    } catch {
      setTranslateError(t("entries.form.translateError"));
    } finally {
      setTranslatingExpl(false);
    }
  }

  // Image state
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [removeImg, setRemoveImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effective image to display: new file preview > existing server image (unless removed)
  const displayImgUrl = imgPreview ?? (removeImg ? null : (currentImgUrl ?? null));

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setImgFile(file);
    setRemoveImg(false);
    const reader = new FileReader();
    reader.onload = (ev) => setImgPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemoveImg() {
    setImgFile(null);
    setImgPreview(null);
    setRemoveImg(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!word.trim() || !explanation.trim()) return;
    onSubmit({
      word: word.trim(),
      explanation: explanation.trim(),
      example: example.trim(),
      category,
      tagIds: selectedTagIds,
      rating,
      includeInPractice,
      imgFile,
      removeImg,
    });
  }

  const isEdit = mode === "edit";
  const isMultiline = MULTILINE_CATEGORIES.has(category);
  const inputCls =
    "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";
  const textareaCls = inputCls + " resize-none leading-relaxed";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 sm:rounded-2xl p-5 flex flex-col gap-4 min-h-screen sm:min-h-0">
      <div className="sticky top-0 z-10 flex items-center gap-2 -mx-5 -mt-5 px-5 py-3 rounded-t-xl bg-white dark:bg-gray-900 shadow-sm sm:static sm:z-auto sm:rounded-none sm:mx-0 sm:mt-0 sm:px-0 sm:py-0 sm:bg-transparent sm:dark:bg-transparent sm:shadow-none">
        <button
          type="button"
          onClick={onCancel}
          className="sm:hidden -ml-1 p-1 rounded-lg text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800/40"
          aria-label="Cancel">
          <FaArrowLeft />
        </button>

        <p className="font-semibold text-emerald-800 dark:text-emerald-300">
          {isEdit ? t("entries.form.editTitle") : t("entries.form.newTitle")}
        </p>
      </div>
      {/* Word & Explanation */}
      <div className={isMultiline ? "flex flex-col gap-3" : "grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-3"}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("entries.form.wordPhrase")}
            </label>
            <VoiceInputButton onResult={(t) => setWord(t)} lang={wordLang} onLangChange={setWordLang} />
          </div>
          <input
            required
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="e.g. serendipity"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("entries.form.explanation")}
            </label>
            <div className="flex items-center gap-1.5">
              {translateError && <span className="text-xs text-red-500 dark:text-red-400">{translateError}</span>}
              {validLangs.length >= 2 && (
                <button
                  type="button"
                  onClick={handleTranslateExplanation}
                  disabled={translatingExpl || !word.trim() || wordLang === explanationLang}
                  title={`Translate word → explanation (${langLabel(wordLang)}→${langLabel(explanationLang)})`}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
                  </svg>
                  {translatingExpl ? "…" : `${langLabel(wordLang)}→${langLabel(explanationLang)}`}
                </button>
              )}
              <VoiceInputButton
                onResult={(t) => setExplanation(t)}
                lang={explanationLang}
                onLangChange={setExplanationLang}
              />
            </div>
          </div>
          {isMultiline ? (
            <textarea
              required
              rows={4}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="e.g. щаслива випадковість"
              className={textareaCls}
            />
          ) : (
            <input
              required
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="e.g. щаслива випадковість"
              className={inputCls}
            />
          )}
        </div>
      </div>
      {/* Example — mobile only */}
      <div className="flex flex-col gap-1 sm:hidden">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("entries.form.example")}</label>
          <VoiceInputButton onResult={(t) => setExample(t)} />
        </div>
        <textarea
          rows={3}
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="e.g. It was pure serendipity that we met."
          className={textareaCls}
        />
      </div>
      {/* Desktop: Example (left) + Image (right, square) */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_140px] gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("entries.form.example")}</label>
            <VoiceInputButton onResult={(t) => setExample(t)} />
          </div>
          <textarea
            rows={4}
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="e.g. It was pure serendipity that we met."
            className={textareaCls}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          {displayImgUrl ? (
            <>
              <EntryImage
                src={displayImgUrl}
                alt="Entry illustration"
                className="w-full aspect-square border border-gray-200 dark:border-gray-600"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                  {t("entries.form.changeImg")}
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImg}
                  className="text-xs text-red-500 dark:text-red-400 hover:underline">
                  {t("entries.form.removeImg")}
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs">{t("entries.form.addImg")}</span>
            </button>
          )}
        </div>
      </div>
      {/* Hidden file input shared by both mobile and desktop */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {/* Mobile-only: Rating/Practice (row) */}
      <div className="sm:hidden flex flex-row gap-3 items-end justify-between px-3 py-2 ">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t("entries.form.ratingLabel")}
          </label>
          <StarRating value={rating} onChange={setRating} />
        </div>
        <div className="flex items-center flex-col gap-1">
          <label
            htmlFor="flashcards-check-mobile"
            className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            {t("entries.form.practice")}
          </label>
          <input
            id="flashcards-check-mobile"
            type="checkbox"
            checked={includeInPractice}
            onChange={(e) => setIncludeInPractice(e.target.checked)}
            className="w-4 h-4 accent-emerald-600 cursor-pointer"
          />
        </div>
      </div>{" "}
      <hr className="shadow-sm m-0 p-0" />
      {/* Mobile-only: Category chips (col) + Image(right) */}
      <div className="sm:hidden flex flex-row gap-3 items-end justify-between">
        {/* Left: category chips stacked vertically */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("entries.form.category")}</label>
          <div className="flex flex-col gap-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={[
                  "px-2 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                  category === cat
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600",
                ].join(" ")}>
                {t(`dashboard.categories.${cat}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Right: image */}
        <div className="flex flex-col gap-3 ">
          <div className="flex flex-col gap-1.5">
            {displayImgUrl ? (
              <div className="flex flex-row items-center gap-1">
                <div className="flex flex-col gap-2 ">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full border border-gray-200 dark:border-gray-600 px-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                    {t("entries.form.changeImg")}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImg}
                    className="rounded-full border border-gray-200 dark:border-gray-600 px-2 text-xs text-red-500 dark:text-red-400 hover:underline">
                    {t("entries.form.removeImg")}
                  </button>
                </div>
                <EntryImage
                  src={displayImgUrl}
                  alt="Entry illustration"
                  className="w-48 h-48 shrink-0 border border-gray-200 dark:border-gray-600"
                />
                {/* <div className="flex gap-2 flex-col">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                    {t("entries.form.changeImg")}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImg}
                    className="text-xs text-red-500 dark:text-red-400 hover:underline">
                    {t("entries.form.removeImg")}
                  </button>
                </div> */}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-48 h-48 flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-lg">{t("entries.form.addImg")}</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Desktop: Category | Rating | Practice | Tags — all in one row, bottom-aligned */}
      <div className="hidden sm:flex items-end gap-5 flex-wrap">
        <div className="flex flex-col gap-1 shrink-0">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("entries.form.category")}</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={[
                  "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                  category === cat
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600",
                ].join(" ")}>
                {t(`dashboard.categories.${cat}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px self-stretch bg-gray-200 dark:bg-gray-700 shrink-0" />

        <div className="flex flex-col gap-1 shrink-0">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {t("entries.form.ratingLabel")}
          </label>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div className="flex items-center gap-2 pb-0.5 shrink-0">
          <input
            id="flashcards-check"
            type="checkbox"
            checked={includeInPractice}
            onChange={(e) => setIncludeInPractice(e.target.checked)}
            className="w-4 h-4 accent-emerald-600 cursor-pointer"
          />
          <label
            htmlFor="flashcards-check"
            className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            {t("entries.form.practice")}
          </label>
        </div>
      </div>
      {/* Tags — desktop only */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("entries.form.tags")}</label>
        <TagCombobox selectedIds={selectedTagIds} onChange={setSelectedTagIds} />
      </div>
      {/* Tags — mobile only */}
      <div className="hidden sm:flex flex-col gap-1.5 sm:hidden">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("entries.form.tags")}</label>
        <TagCombobox selectedIds={selectedTagIds} onChange={setSelectedTagIds} />
      </div>
      {/* Actions */}
      <div className="mt-auto sticky bottom-0 -mx-5 -mb-5 px-5 py-3 rounded-b-xl flex gap-2 items-center justify-between bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 sm:static sm:mt-0 sm:bg-transparent sm:dark:bg-transparent sm:border-0 sm:mx-0 sm:mb-0 sm:px-0 sm:pt-1 sm:pb-0 sm:rounded-none">
        {isEdit && onResetMastery ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{t("entries.detail.mastery")}:</span>
            {masteryLevel ? (
              <>
                <div className="flex text-sm leading-none">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={masteryLevel >= s ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}>
                      ★
                    </span>
                  ))}
                </div>
                {confirmingReset ? (
                  <span className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      {t("entries.form.resetConfirm")}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onResetMastery();
                        setConfirmingReset(false);
                      }}
                      className="text-xs font-medium text-red-500 hover:text-red-700 dark:hover:text-red-300 hover:underline shrink-0">
                      {t("entries.form.resetYes")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingReset(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:underline shrink-0">
                      {t("entries.form.resetNo")}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingReset(true)}
                    className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:underline shrink-0">
                    {t("entries.form.resetMastery")}
                  </button>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-400 dark:text-gray-500">{t("entries.detail.masteryNone")}</span>
            )}
          </div>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t("entries.form.cancel")}
          </Button>
          <Button type="submit">{isEdit ? t("entries.form.saveChanges") : t("entries.form.addEntry")}</Button>
        </div>
      </div>
    </form>
  );
}
