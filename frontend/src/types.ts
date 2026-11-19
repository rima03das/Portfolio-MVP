export const mediums = [
  'Graphite',
  'Charcoal',
  'Pen and Ink',
  'Watercolour and Gouache',
  'Colours',
] as const

export type Medium = (typeof mediums)[number]
export type ArtworkStatus = 'UPLOADED' | 'PUBLISHED' | 'UNPUBLISHED'
export type ReactionType = 'LIKE' | 'DISLIKE'
export type Role = 'ADMIN' | 'VIEWER'

export interface Account {
  id: number
  username: string
  role: Role
}

export interface Artwork {
  id: number
  title: string
  medium: Medium
  description: string
  imagePath: string
  status: ArtworkStatus
  createdAt: string
  updatedAt: string
  views: number
  likes: number
  dislikes: number
  comments: number
  myReaction: ReactionType | null
  commentSnippets: Comment[]
}

export interface Comment {
  id: number
  username: string
  content: string
  createdAt: string
}

export interface AdminComment extends Comment {
  artworkId: number
  artworkTitle: string
}

export interface MediumSummary {
  medium: Medium
  uploaded: number
  published: number
  unpublished: number
  views: number
  likes: number
  dislikes: number
  comments: number
}

export interface MonthlyEngagement {
  month: string
  views: number
  likes: number
}

export interface Dashboard {
  uploaded: number
  published: number
  unpublished: number
  views: number
  likes: number
  dislikes: number
  comments: number
  byMedium: MediumSummary[]
  monthly: MonthlyEngagement[]
  topWorks: Artwork[]
}

export interface ArtworkInput {
  title: string
  medium: Medium
  description: string
  imagePath: string
  status: ArtworkStatus
}

export interface SetupStatus {
  setupRequired: boolean
}

export interface CsrfResponse {
  token: string
}
