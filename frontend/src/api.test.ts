import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearCsrfToken, getPublicArtworks, signIn } from './api'

const response = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('API client', () => {
  afterEach(() => {
    clearCsrfToken()
    vi.unstubAllGlobals()
  })

  it('encodes gallery filters and includes credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([]))
    vi.stubGlobal('fetch', fetchMock)

    await getPublicArtworks({
      medium: 'Watercolour and Gouache',
      search: 'quiet study',
      sort: 'title',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/artworks?medium=Watercolour+and+Gouache&search=quiet+study&sort=title',
      expect.objectContaining({ credentials: 'include', method: 'GET' }),
    )
  })

  it('loads CSRF protection before posting credentials', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ token: 'csrf-token' }))
      .mockResolvedValueOnce(response({ id: 2, username: 'viewer', role: 'VIEWER' }))
    vi.stubGlobal('fetch', fetchMock)

    await signIn('viewer', 'long-password')

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/csrf', { credentials: 'include' })
    const requestOptions = fetchMock.mock.calls[1][1] as RequestInit
    const headers = new Headers(requestOptions.headers)
    expect(requestOptions).toEqual(expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ username: 'viewer', password: 'long-password' }),
    }))
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('X-XSRF-TOKEN')).toBe('csrf-token')
  })

  it('surfaces API failures instead of returning empty success-shaped data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(
      { title: 'Bad Request', detail: 'Title is required.' },
      400,
    ))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getPublicArtworks()).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Title is required.',
      status: 400,
    })
  })
})
