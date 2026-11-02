import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>
type Toast = (message: string) => void

const ConfirmContext = createContext<Confirm>(async () => false)
const ToastContext = createContext<Toast>(() => {})

export const useConfirm = () => useContext(ConfirmContext)
export const useToast = () => useContext(ToastContext)

/** App-wide confirm sheet and toast. Both are promise/call based so screens stay simple. */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null)
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const confirm = useCallback<Confirm>(
    (options) => new Promise((resolve) => setDialog({ ...options, resolve })),
    [],
  )

  const showToast = useCallback<Toast>((message) => {
    window.clearTimeout(timer.current)
    setToast({ id: Date.now(), message })
    timer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  useEffect(() => {
    const onSaveError = () => showToast("Couldn't save a change. Check your connection and try again.")
    const onLoadError = () => showToast("Couldn't load your journal. Showing what's on this device.")
    window.addEventListener('ls:save-error', onSaveError)
    window.addEventListener('ls:load-error', onLoadError)
    return () => {
      window.removeEventListener('ls:save-error', onSaveError)
      window.removeEventListener('ls:load-error', onLoadError)
    }
  }, [showToast])

  const close = (ok: boolean) => {
    dialog?.resolve(ok)
    setDialog(null)
  }

  useEffect(() => {
    if (!dialog) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <ConfirmContext.Provider value={confirm}>
      <ToastContext.Provider value={showToast}>
        {children}
        {dialog && (
          <div className="dialog-backdrop" onClick={() => close(false)}>
            <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" onClick={(e) => e.stopPropagation()}>
              <h2 id="dialog-title" className="dialog__title">{dialog.title}</h2>
              {dialog.message && <p className="dialog__message">{dialog.message}</p>}
              <div className="dialog__actions">
                <button className={`btn btn--block ${dialog.danger ? 'btn--danger' : 'btn--primary'}`} onClick={() => close(true)} autoFocus>
                  {dialog.confirmLabel}
                </button>
                <button className="btn btn--block btn--secondary" onClick={() => close(false)}>
                  {dialog.cancelLabel ?? 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
        {toast && (
          <div key={toast.id} className="toast" role="status">
            {toast.message}
          </div>
        )}
      </ToastContext.Provider>
    </ConfirmContext.Provider>
  )
}
