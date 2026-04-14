import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface EntryImageProps {
  src: string
  alt?: string
  /** Extra classes for the thumbnail */
  className?: string
  style?: React.CSSProperties
}

/**
 * Thumbnail that opens a full-screen lightbox on click.
 *
 * The lightbox is rendered via a React portal directly into document.body so
 * that CSS 3D-transform ancestors (e.g. FlashCard's preserve-3d container)
 * don't break `position: fixed` and trap the overlay inside the card.
 *
 * Thumbnail click stops propagation to avoid triggering parent handlers
 * (e.g. the flip-card click on FlashCard).
 */
export function EntryImage({ src, alt = 'Entry image', className = '', style }: EntryImageProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function handleThumbnailClick(e: React.MouseEvent) {
    e.stopPropagation()
    setOpen(true)
  }

  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={handleThumbnailClick}
        style={style}
        className={`cursor-zoom-in rounded-lg object-cover ${className}`}
      />

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={(e) => { e.stopPropagation(); setOpen(false) }}>
            <img
              src={src}
              alt={alt}
              style={{ maxWidth: '95vw', maxHeight: '95vh' }}
              className="rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  )
}
