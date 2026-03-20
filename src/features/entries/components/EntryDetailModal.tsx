import { useEffect } from 'react'
import { Entry } from '../types'
import { Button } from '@/shared/ui/Button'
import { RatingStars } from '@/shared/ui/RatingStars'

const categoryColors: Record<Entry['category'], string> = {
  word: 'bg-blue-100 text-blue-700',
  phrase: 'bg-green-100 text-green-700',
  grammar: 'bg-purple-100 text-purple-700',
  idiom: 'bg-orange-100 text-orange-700',
  note: 'bg-teal-100 text-teal-700',
}

interface EntryDetailModalProps {
  entry: Entry
  onClose: () => void
  onEdit: (entry: Entry) => void
}

export function EntryDetailModal({ entry, onClose, onEdit }: EntryDetailModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleEdit() {
    onClose()
    onEdit(entry)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-bold text-gray-900 break-words">{entry.word}</h2>
            <span
              className={[
                'inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                categoryColors[entry.category],
              ].join(' ')}
            >
              {entry.category}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 p-6 overflow-y-auto">
          {entry.explanation && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Explanation</p>
              <p className="text-sm text-gray-700 leading-relaxed">{entry.explanation}</p>
            </div>
          )}

          {entry.example && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Example</p>
              <p className="text-sm text-gray-600 italic border-l-2 border-indigo-200 pl-3 leading-relaxed">
                {entry.example}
              </p>
            </div>
          )}

          {entry.tags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Rating</p>
            <RatingStars value={entry.rating} readOnly />
          </div>

          <div className="flex items-center gap-2">
            <span
              className={['w-2 h-2 rounded-full shrink-0', entry.includeInFlashcards ? 'bg-green-500' : 'bg-gray-300'].join(' ')}
            />
            <span className="text-sm text-gray-600">
              {entry.includeInFlashcards ? 'Included in flashcards' : 'Not in flashcards'}
            </span>
          </div>

          <p className="text-xs text-gray-300">
            Added{' '}
            {new Date(entry.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleEdit}>Edit</Button>
        </div>
      </div>
    </div>
  )
}
