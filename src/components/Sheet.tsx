import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

/** A panel that slides up from the bottom, for pickers that need more room than a dialog. */
/** `tall` keeps a searchable list from changing height as it filters. */
export function Sheet({ open, title, onClose, children, footer, tall = false }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; tall?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className={`bottom-sheet ${tall ? 'bottom-sheet--tall' : ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="bottom-sheet__head">
          <h2 className="bottom-sheet__title">{title}</h2>
          <button className="icon-btn icon-btn--plain" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </header>
        <div className="bottom-sheet__body">{children}</div>
        {footer && <div className="bottom-sheet__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
