import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addComment,
  clearCsrfToken,
  deleteArtwork,
  deleteComment,
  getAdminArtwork,
  getAdminArtworks,
  getAdminComments,
  getArtwork,
  getCurrentAccount,
  getDashboard,
  getPublicArtworks,
  getSetupStatus,
  imageUrl,
  reactToArtwork,
  recordView,
  registerViewer,
  request,
  saveArtwork,
  setupAdmin,
  signIn,
  signOut,
  updateArtworkStatus,
} from './api'

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
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ token: 'csrf-token' }))
      .mockResolvedValueOnce(
        response({ id: 2, username: 'viewer', role: 'VIEWER' }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await signIn('viewer', 'long-password')

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/csrf', {
      credentials: 'include',
    })
    const requestOptions = fetchMock.mock.calls[1][1] as RequestInit
    const headers = new Headers(requestOptions.headers)
    expect(requestOptions).toEqual(
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ username: 'viewer', password: 'long-password' }),
      }),
    )
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('X-XSRF-TOKEN')).toBe('csrf-token')
  })

  it('surfaces API failures instead of returning empty success-shaped data', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        response({ title: 'Bad Request', detail: 'Title is required.' }, 400),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getPublicArtworks()).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Title is required.',
      status: 400,
    })
  })

  it('sends authenticated requests for account, artwork, engagement, and admin APIs', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url, options) => {
      if (url === '/api/auth/csrf') return response({ token: 'csrf-token' })
      if (url === '/api/auth/logout' || options?.method === 'DELETE') {
        return new Response(null, { status: 204 })
      }
      if (url.endsWith('/views')) return new Response(null, { status: 204 })
      if (url === '/api/auth/me') return response(null)
      return response({})
    })
    vi.stubGlobal('fetch', fetchMock)
    const artworkInput = {
      title: 'Study',
      medium: 'Graphite' as const,
      description: 'Study description',
      imagePath: 'face.jpg',
      status: 'PUBLISHED' as const,
    }

    await getSetupStatus()
    await setupAdmin('artist', 'a-long-password')
    await registerViewer('viewer', 'a-long-password')
    await signIn('viewer', 'a-long-password')
    await getCurrentAccount()
    await getDashboard()
    await getAdminArtworks({
      medium: 'Graphite',
      status: 'PUBLISHED',
      search: 'portrait',
      sort: 'title',
    })
    await getAdminArtworks({ medium: 'ALL', status: 'ALL' })
    await getAdminArtwork(9)
    await saveArtwork(artworkInput)
    await saveArtwork(artworkInput, 9)
    await deleteArtwork(9)
    await updateArtworkStatus(9, 'UNPUBLISHED')
    await getPublicArtworks()
    await getPublicArtworks({
      medium: 'ALL',
      search: 'portrait',
      sort: 'title',
    })
    await getArtwork(9)
    await recordView(9)
    await reactToArtwork(9, 'LIKE')
    await addComment(9, 'A response')
    await getAdminComments()
    await deleteComment(4)
    await signOut()

    const paths = fetchMock.mock.calls.map(([url]) => url)
    expect(paths).toContain('/api/setup/admin')
    expect(paths).toContain('/api/auth/register')
    expect(paths).toContain(
      '/api/admin/artworks?medium=Graphite&status=PUBLISHED&search=portrait&sort=title',
    )
    expect(paths).toContain('/api/admin/artworks?')
    expect(paths).toContain('/api/artworks?')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/artworks/9/status',
      expect.objectContaining({ method: 'PATCH' }),
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/artworks/9/reactions',
      expect.objectContaining({ method: 'PUT' }),
    )
    expect(imageUrl('///face.jpg')).toBe('/face.jpg')
  })

  it('reports CSRF failures and preserves non-JSON API error messages', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response({ detail: 'CSRF unavailable.' }, 503))
    vi.stubGlobal('fetch', fetchMock)

    await expect(signIn('viewer', 'a-long-password')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Could not establish a secure session. Please try again.',
      status: 503,
    })

    const invalidJsonResponse = {
      ok: false,
      status: 502,
      json: vi.fn().mockRejectedValue(new SyntaxError('invalid JSON')),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(invalidJsonResponse))
    await expect(request('/api/broken')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Request failed (502).',
      status: 502,
    })
  })
})
