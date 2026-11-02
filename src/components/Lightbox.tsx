import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import { Photo } from './Photo'

/** Full-screen photos, swiped sideways. */
export function Lightbox({ photos, start, onClose }: { photos: string[]; start: number; onClose: () => void }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(start)

  useLayoutEffect(() => {
    const el = track.current
    if (el) el.scrollLeft = start * el.clientWidth
  }, [start])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = track.current
      if (e.key === 'Escape') onClose()
      if (el && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        el.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * el.clientWidth, behavior: 'smooth' })
      }
    }
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photos">
      <div
        className="lightbox__track"
        ref={track}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        onClick={onClose}
      >
        {photos.map((id) => (
          <div key={id} className="lightbox__slide">
            <Photo id={id} className="lightbox__photo" />
          </div>
        ))}
      </div>
      <button className="icon-btn lightbox__close" onClick={onClose} aria-label="Close">
        <Icon name="x" />
      </button>
      {photos.length > 1 && (
        <div className="lightbox__count">
          {index + 1} / {photos.length}
        </div>
      )}
    </div>,
    document.body,
  )
}
