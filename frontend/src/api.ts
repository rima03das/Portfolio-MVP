import type {
  Account,
  AdminComment,
  Artwork,
  ArtworkInput,
  ArtworkStatus,
  Comment,
  CsrfResponse,
  Dashboard,
  Medium,
  ReactionType,
  SetupStatus,
} from './types'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let csrfToken: string | null = null

async function loadCsrfToken(): Promise<string> {
  const response = await fetch('/api/auth/csrf', { credentials: 'include' })
  if (!response.ok) {
    throw new ApiError(
      'Could not establish a secure session. Please try again.',
      response.status,
    )
  }
  const body = (await response.json()) as CsrfResponse
  csrfToken = body.token
  return csrfToken
}

export function clearCsrfToken(): void {
  csrfToken = null
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers.set('X-XSRF-TOKEN', csrfToken ?? (await loadCsrfToken()))
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: 'include',
  })

  if (!response.ok) {
    let message = `Request failed (${response.status}).`
    try {
      const problem = (await response.json()) as {
        detail?: string
        title?: string
      }
      message = problem.detail ?? problem.title ?? message
    } catch (error) {
      if (!(error instanceof SyntaxError)) {
        throw error
      }
    }
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export function getSetupStatus(): Promise<SetupStatus> {
  return request('/api/setup/status')
}

export function setupAdmin(
  username: string,
  password: string,
): Promise<Account> {
  return request('/api/setup/admin', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function registerViewer(
  username: string,
  password: string,
): Promise<Account> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function signIn(username: string, password: string): Promise<Account> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function signOut(): Promise<void> {
  await request<void>('/api/auth/logout', { method: 'POST' })
  clearCsrfToken()
}

export function getCurrentAccount(): Promise<Account | null> {
  return request('/api/auth/me')
}

export function getDashboard(): Promise<Dashboard> {
  return request('/api/admin/dashboard')
}

export function getAdminArtworks(
  filters: {
    medium?: Medium | 'ALL'
    status?: ArtworkStatus | 'ALL'
    search?: string
    sort?: string
  } = {},
): Promise<Artwork[]> {
  const params = new URLSearchParams()
  if (filters.medium && filters.medium !== 'ALL')
    params.set('medium', filters.medium)
  if (filters.status && filters.status !== 'ALL')
    params.set('status', filters.status)
  if (filters.search) params.set('search', filters.search)
  if (filters.sort) params.set('sort', filters.sort)
  return request(`/api/admin/artworks?${params}`)
}

export function getAdminArtwork(id: number): Promise<Artwork> {
  return request(`/api/admin/artworks/${id}`)
}

export function saveArtwork(
  input: ArtworkInput,
  id?: number,
): Promise<Artwork> {
  return request(id ? `/api/admin/artworks/${id}` : '/api/admin/artworks', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(input),
  })
}

export function deleteArtwork(id: number): Promise<void> {
  return request(`/api/admin/artworks/${id}`, { method: 'DELETE' })
}

export function updateArtworkStatus(
  id: number,
  status: ArtworkStatus,
): Promise<Artwork> {
  return request(`/api/admin/artworks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function getPublicArtworks(
  filters: {
    medium?: Medium | 'ALL'
    search?: string
    sort?: string
  } = {},
): Promise<Artwork[]> {
  const params = new URLSearchParams()
  if (filters.medium && filters.medium !== 'ALL')
    params.set('medium', filters.medium)
  if (filters.search) params.set('search', filters.search)
  if (filters.sort) params.set('sort', filters.sort)
  return request(`/api/artworks?${params}`)
}

export function getArtwork(id: number): Promise<Artwork> {
  return request(`/api/artworks/${id}`)
}

export function recordView(id: number): Promise<void> {
  return request(`/api/artworks/${id}/views`, { method: 'POST' })
}

export function reactToArtwork(
  id: number,
  reaction: ReactionType,
): Promise<Artwork> {
  return request(`/api/artworks/${id}/reactions`, {
    method: 'PUT',
    body: JSON.stringify({ reaction }),
  })
}

export function addComment(id: number, content: string): Promise<Comment> {
  return request(`/api/artworks/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export function getAdminComments(): Promise<AdminComment[]> {
  return request('/api/admin/comments')
}

export function deleteComment(id: number): Promise<void> {
  return request(`/api/admin/comments/${id}`, { method: 'DELETE' })
}

export function imageUrl(imagePath: string): string {
  return `/${imagePath.replace(/^\/+/, '')}`
}
