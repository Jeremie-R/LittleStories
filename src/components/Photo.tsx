import { useEffect, useState } from 'react'
import { loadPhotoUrl, peekPhotoUrl } from '../data/photos'
import { useBackend } from '../data/store'
import { Icon } from './Icon'

/** Object URL for a photo id: a string when ready, undefined while loading, null when it can't be found. */
export function usePhotoUrl(id: string | undefined): string | null | undefined {
  const backend = useBackend()
  const scope = backend?.photoScope
  const key = scope && id ? `${scope}/${id}` : null
  const [state, setState] = useState<{ key: string | null; url: string | null }>({ key: null, url: null })

  useEffect(() => {
    if (!backend || !id || peekPhotoUrl(backend.photoScope, id)) return
    let cancelled = false
    loadPhotoUrl(backend.photoScope, id, backend.downloadPhoto).then((url) => cancelled || setState({ key: `${backend.photoScope}/${id}`, url }))
    return () => {
      cancelled = true
    }
  }, [backend, id])

  if (!key) return null
  return peekPhotoUrl(scope!, id!) ?? (state.key === key ? state.url : undefined)
}

export function Photo({ id, className = '', alt = '' }: { id: string; className?: string; alt?: string }) {
  const url = usePhotoUrl(id)
  if (url) return <img className={`photo ${className}`} src={url} alt={alt} draggable={false} />
  return (
    <div className={`photo photo--empty ${className}`} aria-busy={url === undefined}>
      {url === null && <Icon name="image" />}
    </div>
  )
}
