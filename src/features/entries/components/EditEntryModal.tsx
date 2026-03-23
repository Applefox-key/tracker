import { useEffect } from 'react'
import { Entry } from '../types'
import { EntryForm, EntryFormValues } from './AddEntryForm'
import { useEntryCrud } from '@/hooks/useEntryCrud'

interface EditEntryModalProps {
  entry: Entry
  onClose: () => void
}

export function EditEntryModal({ entry, onClose }: EditEntryModalProps) {
  const { updateEntry } = useEntryCrud()

  // Close on Escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleSubmit(values: EntryFormValues) {
    const { tagIds, ...entryData } = values
    updateEntry(entry.id, { ...entryData, tags: [] }, tagIds)
    onClose()
  }

  const initialValues: EntryFormValues = {
    word: entry.word,
    explanation: entry.explanation,
    example: entry.example,
    category: entry.category,
    tagIds: entry.tags.map((t) => t.id),
    rating: entry.rating,
    includeInPractice: entry.includeInPractice,
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <EntryForm
          mode="edit"
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}
