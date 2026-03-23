import { FormEvent, useState } from "react";
import { EntryCategory } from "../types";
import { Button } from "@/shared/ui/Button";
import { TagCombobox } from "@/shared/ui/TagCombobox";

export interface EntryFormValues {
  word: string;
  explanation: string;
  example: string;
  category: EntryCategory;
  tagIds: number[];
  rating: number;
  includeInPractice: boolean;
}

interface EntryFormProps {
  mode: "create" | "edit";
  initialValues?: EntryFormValues;
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
          <span className={(hovered || value) >= star ? "text-amber-400" : "text-gray-300"}>★</span>
        </button>
      ))}
    </div>
  );
}

export function EntryForm({ mode, initialValues, onSubmit, onCancel }: EntryFormProps) {
  const init = initialValues ?? DEFAULT_VALUES;

  const [word, setWord] = useState(init.word);
  const [explanation, setExplanation] = useState(init.explanation);
  const [example, setExample] = useState(init.example);
  const [category, setCategory] = useState<EntryCategory>(init.category);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(init.tagIds);
  const [rating, setRating] = useState(init.rating);
  const [includeInPractice, setIncludeInPractice] = useState(init.includeInPractice);

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
    });
  }

  const isEdit = mode === "edit";

  return (
    <form onSubmit={handleSubmit} className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex flex-col gap-4">
      <p className="font-semibold text-indigo-800">{isEdit ? "Edit Entry" : "New Entry"}</p>

      {/* Word & Explanation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Word / Phrase *</label>
          <input
            required
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="e.g. serendipity"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Explanation *</label>
          <input
            required
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="e.g. щаслива випадковість"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Example */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Example sentence</label>
        <input
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="e.g. It was pure serendipity that we met."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Category</label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={[
                "px-3 py-1.5 rounded-lg text-sm font-medium border capitalize transition-colors",
                category === cat
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
              ].join(" ")}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-600">Tags</label>
        <TagCombobox selectedIds={selectedTagIds} onChange={setSelectedTagIds} />
      </div>

      {/* Rating & Practice row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">How well do you know it?</label>
          <StarRating value={rating} onChange={setRating} />
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <input
            id="flashcards-check"
            type="checkbox"
            checked={includeInPractice}
            onChange={(e) => setIncludeInPractice(e.target.checked)}
            className="w-4 h-4 accent-indigo-600 cursor-pointer"
          />
          <label htmlFor="flashcards-check" className="text-sm text-gray-700 cursor-pointer select-none">
            Include in practice
          </label>
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
