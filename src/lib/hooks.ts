import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

/** Goes back if there's in-app history (e.g. opened from a list), otherwise to `fallback` (e.g. deep link). */
export function useBack(fallback = '/') {
  const navigate = useNavigate()
  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }, [navigate, fallback])
}

/** Grows a textarea with its content. */
export function useAutosize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return ref
}

export function tap() {
  if ('vibrate' in navigator) navigator.vibrate(12)
}
