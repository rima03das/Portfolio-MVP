import { describe, expect, it } from 'vitest'
import { selectSessionSamples } from './sample-selection'
import type { Artwork } from './types'

function artwork(id: number): Artwork {
  return {
    id,
    title: `Artwork ${id}`,
    medium: 'Graphite',
    description: 'A sample description.',
    imagePath: 'face.jpg',
    status: 'PUBLISHED',
    createdAt: '',
    updatedAt: '',
    views: 0,
    likes: 0,
    dislikes: 0,
    comments: 1,
    myReaction: null,
    commentSnippets: [{
      id,
      username: 'Visitor',
      content: 'Beautiful work.',
      createdAt: '',
    }],
  }
}

describe('session sample selection', () => {
  it('chooses three distinct published artworks and keeps that selection for the session', () => {
    const session = new Map<string, string>()
    const storage = {
      getItem: (key: string) => session.get(key) ?? null,
      setItem: (key: string, value: string) => session.set(key, value),
      removeItem: (key: string) => session.delete(key),
    }
    const pool = Array.from({ length: 5 }, (_, index) => artwork(index + 1))

    const first = selectSessionSamples(pool, storage, () => 0)
    const subsequent = selectSessionSamples(pool, storage, () => 0.9)

    expect(first).toHaveLength(3)
    expect(new Set(first.map((item) => item.id)).size).toBe(3)
    expect(first.map((item) => item.id)).toEqual(subsequent.map((item) => item.id))
    expect(first.every((item) => item.commentSnippets.length > 0)).toBe(true)
  })

  it('replaces stale or malformed stored sample IDs with a valid selection', () => {
    const session = new Map([['portfolio.sample-artwork-ids', '[1,1,99]']])
    const storage = {
      getItem: (key: string) => session.get(key) ?? null,
      setItem: (key: string, value: string) => session.set(key, value),
      removeItem: (key: string) => session.delete(key),
    }
    const result = selectSessionSamples(
      Array.from({ length: 5 }, (_, index) => artwork(index + 1)),
      storage,
      () => 0,
    )

    expect(result).toHaveLength(3)
    expect(new Set(result.map((item) => item.id)).size).toBe(3)
  })
})
