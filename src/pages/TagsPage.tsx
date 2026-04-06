import { useState, useMemo } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useEntriesStore } from "@/features/entries/store/entriesStore";
import { useEntryTags, useDeleteEntryTag } from "@/hooks/useEntries";
import { entryTagsApi } from "@/api/api";
import { useQueryClient } from "@tanstack/react-query";
import type { EntryTag } from "@/features/entries/types";

function TagRow({
  tag,
  usageCount,
  onRename,
  onDelete,
}: {
  tag: EntryTag;
  usageCount: number;
  onRename: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(tag.name);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === tag.name) { setEditing(false); setValue(tag.name); return; }
    setSaving(true);
    await onRename(tag.id, trimmed);
    setSaving(false);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") { setEditing(false); setValue(tag.name); }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      {editing ? (
        <input
          autoFocus
          className="flex-1 text-sm font-medium bg-transparent border-b border-emerald-400 outline-none text-gray-900 dark:text-gray-100 pb-0.5"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={saving}
        />
      ) : (
        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100">#{tag.name}</span>
      )}

      <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
        {usageCount} {usageCount === 1 ? "entry" : "entries"}
      </span>

      {editing ? (
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={save}
            disabled={saving}
            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {saving ? "…" : "Save"}
          </button>
          <button
            onClick={() => { setEditing(false); setValue(tag.name); }}
            className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Cancel
          </button>
        </div>
      ) : confirmDelete ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-red-500">Delete?</span>
          <button
            onClick={() => onDelete(tag.id)}
            className="text-xs px-2.5 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
            Yes
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            No
          </button>
        </div>
      ) : (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setEditing(true)}
            title="Rename"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export function TagsPage() {
  const mode = useAuthStore((s) => s.mode);
  const entries = useEntriesStore((s) => s.entries);
  const updateEntry = useEntriesStore((s) => s.updateEntry);
  const queryClient = useQueryClient();

  const { data: serverTags = [] } = useEntryTags();
  const deleteTagMutation = useDeleteEntryTag();

  // In demo mode derive tags from entries
  const demoTags = useMemo<EntryTag[]>(() => {
    const seen = new Map<number, EntryTag>();
    entries.forEach((e) => e.tags.forEach((t) => seen.set(t.id, t)));
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  const tags = mode === "authenticated" ? [...serverTags].sort((a, b) => a.name.localeCompare(b.name)) : demoTags;

  const usageMap = useMemo(() => {
    const m = new Map<number, number>();
    entries.forEach((e) => e.tags.forEach((t) => m.set(t.id, (m.get(t.id) ?? 0) + 1)));
    return m;
  }, [entries]);

  async function handleRename(id: number, name: string) {
    if (mode === "authenticated") {
      await entryTagsApi.edit(id, name);
      await queryClient.invalidateQueries({ queryKey: ["entry-tags"] });
      await queryClient.invalidateQueries({ queryKey: ["entries"] });
    } else {
      // Update tag name in all entries in the local store
      entries.forEach((e) => {
        if (e.tags.some((t) => t.id === id)) {
          updateEntry(e.id, { tags: e.tags.map((t) => (t.id === id ? { ...t, name } : t)) });
        }
      });
    }
  }

  function handleDelete(id: number) {
    if (mode === "authenticated") {
      deleteTagMutation.mutate(id);
    } else {
      entries.forEach((e) => {
        if (e.tags.some((t) => t.id === id)) {
          updateEntry(e.id, { tags: e.tags.filter((t) => t.id !== id) });
        }
      });
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tags</h1>
        <span className="text-sm text-gray-400 dark:text-gray-500">{tags.length} total</span>
      </div>

      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[20vh] gap-2 text-center">
          <p className="text-gray-400 dark:text-gray-500">No tags yet.</p>
          <p className="text-sm text-gray-300 dark:text-gray-600">Add tags to entries to manage them here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tags.map((tag) => (
            <TagRow
              key={tag.id}
              tag={tag}
              usageCount={usageMap.get(tag.id) ?? 0}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
