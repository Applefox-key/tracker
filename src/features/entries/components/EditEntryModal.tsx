import { useEffect } from 'react'
import { Entry } from '../types'
import { EntryForm, EntryFormValues } from './AddEntryForm'
import { useEntryCrud } from '@/hooks/useEntryCrud'
import { getEntryImageUrl } from '@/api/api'

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
    const { tagIds, imgFile, removeImg, ...entryData } = values
    updateEntry(entry.id, { ...entryData, tags: [] }, tagIds, imgFile ?? undefined, removeImg)
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
      className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-gray-900 sm:overflow-hidden sm:bg-black/50 sm:backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl sm:max-h-[90vh] sm:overflow-y-auto sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <EntryForm
          mode="edit"
          initialValues={initialValues}
          currentImgUrl={entry.img ? getEntryImageUrl(entry.img) : null}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}
