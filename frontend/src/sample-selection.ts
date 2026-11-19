import type { Artwork } from './types'

const storageKey = 'portfolio.sample-artwork-ids'
const sampleSize = 3

export function selectSessionSamples(
  artworks: Artwork[],
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>,
  random: () => number = Math.random,
): Artwork[] {
  const available = artworks.filter((artwork) => artwork.status === 'PUBLISHED')
  const byId = new Map(available.map((artwork) => [artwork.id, artwork]))
  const stored = storage.getItem(storageKey)

  if (stored) {
    try {
      const ids = JSON.parse(stored) as unknown
      if (
        Array.isArray(ids) &&
        ids.length === sampleSize &&
        new Set(ids).size === sampleSize &&
        ids.every((id): id is number => typeof id === 'number' && byId.has(id))
      ) {
        const selected = ids.map((id) => byId.get(id)).filter((item): item is Artwork => item !== undefined)
        if (selected.length === sampleSize) return selected
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error
    }
    storage.removeItem(storageKey)
  }

  const shuffled = [...available]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  const selected = shuffled.slice(0, sampleSize)
  storage.setItem(storageKey, JSON.stringify(selected.map((artwork) => artwork.id)))
  return selected
}
