import { FormEvent, useRef, useState } from "react";
import { EntryCategory } from "../types";
import { MULTILINE_CATEGORIES } from "../constants";
import { Button } from "@/shared/ui/Button";
import { TagCombobox } from "@/shared/ui/TagCombobox";
import { VoiceInputButton } from "@/shared/ui/VoiceInputButton";
import { EntryImage } from "@/shared/ui/EntryImage";

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
  rating: 3,
  includeInPractice: false,
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

export function EntryForm({ mode, initialValues, currentImgUrl, onSubmit, onCancel }: EntryFormProps) {
  const init = initialValues ?? DEFAULT_VALUES;

  const [word, setWord] = useState(init.word);
  const [explanation, setExplanation] = useState(init.explanation);
  const [example, setExample] = useState(init.example);
  const [category, setCategory] = useState<EntryCategory>(init.category);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(init.tagIds);
  const [rating, setRating] = useState(init.rating);
  const [includeInPractice, setIncludeInPractice] = useState(init.includeInPractice);

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
    "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";
  const textareaCls = inputCls + " resize-none leading-relaxed";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 flex flex-col gap-4">
      <p className="font-semibold text-emerald-800 dark:text-emerald-300">{isEdit ? "Edit Entry" : "New Entry"}</p>

      {/* Word & Explanation */}
      <div className={isMultiline ? "flex flex-col gap-3" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Word / Phrase *</label>
            <VoiceInputButton onResult={(t) => setWord(t)} />
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
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Explanation *</label>
            <VoiceInputButton onResult={(t) => setExplanation(t)} />
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

      {/* Example */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Example sentence</label>
          <VoiceInputButton onResult={(t) => setExample(t)} />
        </div>
        {isMultiline ? (
          <textarea
            rows={3}
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="e.g. It was pure serendipity that we met."
            className={textareaCls}
          />
        ) : (
          <input
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="e.g. It was pure serendipity that we met."
            className={inputCls}
          />
        )}
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Category</label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={[
                "px-3 py-1.5 rounded-lg text-sm font-medium border capitalize transition-colors",
                category === cat
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600",
              ].join(" ")}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Tags</label>
        <TagCombobox selectedIds={selectedTagIds} onChange={setSelectedTagIds} />
      </div>

      {/* Image (left) + Rating / Practice (right) */}
      <div className="flex items-start justify-between gap-4">
        {/* Right: image upload */}
        <div className="flex flex-col gap-1.5 items-end">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 self-start">Image</label>
          {displayImgUrl ? (
            <div className="flex flex-row items-center gap-1">
              <EntryImage
                src={displayImgUrl}
                alt="Entry illustration"
                className="w-20 h-20 shrink-0 border border-gray-200 dark:border-gray-600"
              />
              <div className="flex gap-2 flex-col">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImg}
                  className="text-xs text-red-500 dark:text-red-400 hover:underline">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs">Add</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Rating (top) + Practice (bottom) */}
        <div className="flex flex-col justify-between" style={{ minHeight: "100px" }}>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">How well do you know it?</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="flex items-center gap-2">
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
              Include in practice
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{isEdit ? "Save Changes" : "Add Entry"}</Button>
      </div>
    </form>
  );
}
