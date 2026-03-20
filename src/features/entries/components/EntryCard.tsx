import { Entry } from '../types'
import { useEntryCrud } from '@/hooks/useEntryCrud'
import { Button } from '@/shared/ui/Button'
import { RatingStars } from '@/shared/ui/RatingStars'
import { ToggleSwitch } from '@/shared/ui/ToggleSwitch'

const categoryColors: Record<Entry['category'], string> = {
  word: 'bg-blue-100 text-blue-700',
  phrase: 'bg-green-100 text-green-700',
  grammar: 'bg-purple-100 text-purple-700',
  idiom: 'bg-orange-100 text-orange-700',
  note: 'bg-teal-100 text-teal-700',
}

interface EntryCardProps {
  entry: Entry
  onRemove: (id: number) => void
  onEdit: (entry: Entry) => void
}

export function EntryCard({ entry, onRemove, onEdit }: EntryCardProps) {
  const { updateEntry } = useEntryCrud()

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900 truncate">{entry.word}</p>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{entry.explanation}</p>
          <p className="text-xs text-gray-300 mt-1">
            {new Date(entry.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <span
          className={[
            'shrink-0 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
            categoryColors[entry.category],
          ].join(' ')}
        >
          {entry.category}
        </span>
      </div>

      {/* Example */}
      {entry.example && (
        <p className="text-sm text-gray-600 italic border-l-2 border-indigo-200 pl-3">
          {entry.example}
        </p>
      )}

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center gap-3 pt-1">
        <RatingStars
          value={entry.rating}
          onChange={(v) => updateEntry(entry.id, { rating: v })}
        />

        <div className="w-px h-4 bg-gray-200 shrink-0" />

        <ToggleSwitch
          checked={entry.includeInFlashcards}
          onChange={(v) => updateEntry(entry.id, { includeInFlashcards: v })}
          label="Flashcard"
        />

        <div className="ml-auto flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(entry)}
            className="text-indigo-500 hover:bg-indigo-50"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(entry.id)}
            className="text-red-500 hover:bg-red-50"
          >
            Remove
          </Button>
        </div>
      </div>
    </div>
  )
}
