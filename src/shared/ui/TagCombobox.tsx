import { useState, useRef, useEffect } from "react";
import { useEntryTags, useCreateEntryTag } from "@/hooks/useEntries";

interface TagComboboxProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
}

export function TagCombobox({ selectedIds, onChange, placeholder }: TagComboboxProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: availableTags = [] } = useEntryTags();
  const createTag = useCreateEntryTag();

  const filtered = availableTags.filter(
    (tag) => tag.name.toLowerCase().includes(inputValue.toLowerCase()) && !selectedIds.includes(tag.id),
  );

  const showCreate =
    inputValue.trim().length > 0 &&
    !availableTags.some((t) => t.name.toLowerCase() === inputValue.trim().toLowerCase());

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setInputValue("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
      setInputValue("");
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const name = inputValue.trim().toLowerCase();
      if (!name) return;
      const existing = availableTags.find((t) => t.name.toLowerCase() === name);
      if (existing) {
        if (!selectedIds.includes(existing.id)) onChange([...selectedIds, existing.id]);
        setInputValue("");
        setIsOpen(false);
      } else if (showCreate) {
        handleCreate(name);
      }
      return;
    }
    if (e.key === "Backspace" && inputValue === "" && selectedIds.length > 0) {
      onChange(selectedIds.slice(0, -1));
    }
  }

  async function handleCreate(name: string) {
    try {
      const result = await createTag.mutateAsync(name);
      onChange([...selectedIds, result.id]);
      setInputValue("");
      setIsOpen(false);
    } catch {
      // ignore
    }
  }

  function selectTag(id: number) {
    onChange([...selectedIds, id]);
    setInputValue("");
    setIsOpen(false);
  }

  function removeTag(id: number) {
    onChange(selectedIds.filter((x) => x !== id));
  }

  const showDropdown =
    isOpen && (filtered.length > 0 || showCreate || (inputValue.length > 0 && filtered.length === 0 && !showCreate));

  return (
    <div ref={containerRef} className="relative">
      {/* Input row */}
      <div
        className="flex flex-wrap items-center gap-1 border border-gray-300 rounded-lg px-3 py-2 min-h-[42px] cursor-text focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-transparent bg-white"
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}>
        {selectedIds.map((id) => {
          const tag = availableTags.find((t) => t.id === id);
          if (!tag) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full shrink-0">
              {tag.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(id);
                }}
                className="hover:text-emerald-900 leading-none">
                ×
              </button>
            </span>
          );
        })}

        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedIds.length === 0 ? (placeholder ?? "Add tags…") : ""}
          className="flex-1 min-w-[80px] outline-none text-sm bg-transparent"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-md max-h-48 overflow-y-auto">
          {filtered.map((tag) => (
            <div
              key={tag.id}
              onMouseDown={(e) => {
                e.preventDefault();
                selectTag(tag.id);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer">
              <span className="text-emerald-400 text-xs">#</span>
              {tag.name}
            </div>
          ))}

          {showCreate && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                handleCreate(inputValue.trim().toLowerCase());
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 cursor-pointer border-t border-gray-100">
              <span className="text-base leading-none">+</span>
              Create tag &ldquo;<strong>{inputValue.trim()}</strong>&rdquo;
            </div>
          )}

          {filtered.length === 0 && !showCreate && (
            <div className="px-3 py-2 text-xs text-gray-400 italic">No matching tags</div>
          )}
        </div>
      )}
    </div>
  );
}
