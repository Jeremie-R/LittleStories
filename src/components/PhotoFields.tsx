import { useEffect, useRef, useState } from 'react'
import { addPhoto, AVATAR_SIZE, PHOTO_SIZE, removePhoto } from '../data/photos'
import { useBackend } from '../data/store'
import type { Person } from '../lib/types'
import { Avatar } from './Avatar'
import { useToast } from './Feedback'
import { Icon } from './Icon'
import { Photo } from './Photo'

/**
 * Photos picked in an editor are stored on the device straight away. If the editor is
 * left without saving, or a new photo is removed again, its stored copy is dropped.
 */
export function usePhotoDrafts() {
  const backend = useBackend()
  const scope = useRef(backend?.photoScope)
  const added = useRef<string[]>([])
  const saved = useRef(false)
  scope.current = backend?.photoScope

  useEffect(
    () => () => {
      if (saved.current || !scope.current) return
      added.current.forEach((id) => removePhoto(scope.current!, id))
      added.current = []
    },
    [],
  )

  return {
    scope: backend?.photoScope,
    track: (id: string) => added.current.push(id),
    /** Call when saving, with the photos the saved item keeps. */
    keep(kept: string[]) {
      saved.current = true
      for (const id of added.current) if (!kept.includes(id) && scope.current) removePhoto(scope.current, id)
    },
  }
}

const couldNotRead = "Couldn't read this photo. Try a JPEG or PNG."

export function AvatarPicker({ person, onChange, drafts }: { person: Pick<Person, 'id' | 'name' | 'photo'>; onChange: (photo?: string) => void; drafts: ReturnType<typeof usePhotoDrafts> }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const pick = async (file: File | undefined) => {
    if (!file || !drafts.scope) return
    setBusy(true)
    try {
      const id = await addPhoto(drafts.scope, file, AVATAR_SIZE, true)
      drafts.track(id)
      onChange(id)
    } catch (error) {
      console.error(error)
      toast(couldNotRead)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="avatar-picker">
      <label className="avatar-picker__button" aria-busy={busy}>
        <Avatar person={person} size={120} />
        <span className="avatar-picker__badge">
          <Icon name="camera" size={18} />
        </span>
        <input
          type="file"
          accept="image/*"
          className="visually-hidden"
          aria-label={person.photo ? 'Change photo' : 'Add a photo'}
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </label>
      {person.photo && (
        <button type="button" className="text-btn" onClick={() => onChange(undefined)}>
          Remove photo
        </button>
      )}
    </div>
  )
}

export function PhotosEditor({
  value,
  update,
  drafts,
}: {
  value: string[]
  update: (change: (ids: string[]) => string[]) => void
  drafts: ReturnType<typeof usePhotoDrafts>
}) {
  const toast = useToast()
  const [busy, setBusy] = useState(0)

  const add = async (files: File[]) => {
    if (!drafts.scope) return
    setBusy((n) => n + files.length)
    for (const file of files) {
      try {
        const id = await addPhoto(drafts.scope, file, PHOTO_SIZE)
        drafts.track(id)
        update((ids) => [...ids, id])
      } catch (error) {
        console.error(error)
        toast(couldNotRead)
      } finally {
        setBusy((n) => n - 1)
      }
    }
  }

  return (
    <div className="photo-grid">
      {value.map((id, i) => (
        <div key={id} className="photo-grid__item">
          <Photo id={id} />
          {i === 0 && value.length > 1 && <span className="photo-grid__cover">Cover</span>}
          <button type="button" className="photo-grid__remove" aria-label="Remove photo" onClick={() => update((ids) => ids.filter((x) => x !== id))}>
            <Icon name="x" size={14} strokeWidth={2.6} />
          </button>
        </div>
      ))}
      {Array.from({ length: busy }, (_, i) => (
        <div key={`busy-${i}`} className="photo-grid__item photo-grid__item--busy" aria-busy="true" />
      ))}
      <label className="photo-grid__add">
        <Icon name="camera" size={24} />
        <span>Add photos</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="visually-hidden"
          onChange={(e) => {
            add([...(e.target.files ?? [])])
            e.target.value = ''
          }}
        />
      </label>
    </div>
  )
}
