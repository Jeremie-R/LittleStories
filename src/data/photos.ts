// Photos are compressed in the browser, kept in IndexedDB (localStorage is far too small),
// and, when signed in, uploaded to Supabase Storage. IndexedDB doubles as the offline cache
// for photos added on other devices.

const DB_NAME = 'little-stories'
const STORE = 'photos'

let opening: Promise<IDBDatabase> | null = null

function database(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return opening
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const request = action(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(request.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

const keyOf = (scope: string, id: string) => `${scope}/${id}`

export const readPhoto = (scope: string, id: string) =>
  run<Blob | undefined>('readonly', (store) => store.get(keyOf(scope, id)))

export const writePhoto = (scope: string, id: string, blob: Blob) =>
  run('readwrite', (store) => store.put(blob, keyOf(scope, id))).then(() => undefined)

/** Forgets a photo on this device: the stored copy and its object URL. */
export function removePhoto(scope: string, id: string) {
  const key = keyOf(scope, id)
  const url = resolved.get(key)
  if (url) URL.revokeObjectURL(url)
  resolved.delete(key)
  loading.delete(key)
  return run('readwrite', (store) => store.delete(key)).catch(() => undefined)
}

/** Removes every photo of one account (or of device-only mode) from this device. */
export function clearPhotos(scope: string) {
  for (const [key, url] of resolved) {
    if (!key.startsWith(scope + '/')) continue
    URL.revokeObjectURL(url)
    resolved.delete(key)
    loading.delete(key)
  }
  return run('readwrite', (store) => store.delete(IDBKeyRange.bound(scope + '/', scope + '/￿'))).catch(() => undefined)
}

export async function copyPhotos(from: string, to: string, ids: string[]) {
  for (const id of ids) {
    const blob = await readPhoto(from, id).catch(() => undefined)
    if (blob) await writePhoto(to, id, blob)
  }
}

// ---------- Display ----------

const resolved = new Map<string, string>()
const loading = new Map<string, Promise<string | null>>()

/** The object URL if it's ready, so a photo seen before shows without a flash. */
export const peekPhotoUrl = (scope: string, id: string) => resolved.get(keyOf(scope, id))

/** Object URL for a photo: from IndexedDB, or downloaded (and kept) when this device doesn't have it. */
export function loadPhotoUrl(scope: string, id: string, download: (id: string) => Promise<Blob | null>): Promise<string | null> {
  const key = keyOf(scope, id)
  const ready = resolved.get(key)
  if (ready) return Promise.resolve(ready)
  let pending = loading.get(key)
  if (!pending) {
    pending = (async () => {
      let blob = await readPhoto(scope, id).catch(() => undefined)
      if (!blob) {
        const fetched = await download(id).catch(() => null)
        if (!fetched) return null
        blob = fetched
        writePhoto(scope, id, fetched).catch(() => undefined)
      }
      const url = URL.createObjectURL(blob)
      resolved.set(key, url)
      return url
    })()
    loading.set(key, pending)
    // Not found (maybe still uploading from another device): try again next time it's shown.
    pending.then((url) => url || loading.delete(key))
  }
  return pending
}

// ---------- Adding ----------

export const AVATAR_SIZE = 720
export const PHOTO_SIZE = 1600

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

/**
 * Scales a picked image down to `max` px on its longest side (and crops it square for
 * avatars), then encodes it as WebP, or JPEG where the browser can't write WebP (Safari).
 */
export async function compressImage(file: Blob, max: number, square = false): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  let [sx, sy, sw, sh] = [0, 0, bitmap.width, bitmap.height]
  if (square) {
    const side = Math.min(sw, sh)
    sx = (sw - side) / 2
    sy = (sh - side) / 2
    sw = sh = side
  }
  const scale = Math.min(1, max / Math.max(sw, sh))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(sw * scale)
  canvas.height = Math.round(sh * scale)
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const webp = await toBlob(canvas, 'image/webp', 0.8)
  if (webp?.type === 'image/webp') return webp
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.82)
  if (!jpeg) throw new Error('Could not encode the photo')
  return jpeg
}

/** Compresses and stores a picked photo on this device. It's uploaded when the person or story is saved. */
export async function addPhoto(scope: string, file: Blob, max: number, square = false): Promise<string> {
  const blob = await compressImage(file, max, square)
  const id = crypto.randomUUID()
  await writePhoto(scope, id, blob)
  resolved.set(keyOf(scope, id), URL.createObjectURL(blob))
  return id
}
