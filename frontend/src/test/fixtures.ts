import type { Artwork, Dashboard } from '../types'

export function makeArtwork(id: number, status: Artwork['status'] = 'PUBLISHED'): Artwork {
  return {
    id,
    title: `Study ${id}`,
    medium: 'Graphite',
    description: 'A quiet portrait study.',
    imagePath: 'face.jpg',
    status,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    views: 10,
    likes: 2,
    dislikes: 0,
    comments: 1,
    myReaction: null,
    commentSnippets: [{
      id,
      username: 'Guest',
      content: 'A lovely use of light.',
      createdAt: '2026-01-02T00:00:00Z',
    }],
  }
}

export function makeDashboard(): Dashboard {
  return {
    uploaded: 5,
    published: 3,
    unpublished: 1,
    views: 40,
    likes: 8,
    dislikes: 1,
    comments: 4,
    byMedium: [{
      medium: 'Graphite',
      uploaded: 1,
      published: 1,
      unpublished: 0,
      views: 10,
      likes: 2,
      dislikes: 0,
      comments: 1,
    }],
    monthly: [{ month: 'Jun', views: 10, likes: 2 }],
    topWorks: [makeArtwork(1)],
  }
}
