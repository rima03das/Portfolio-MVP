import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { makeArtwork, makeDashboard } from './test/fixtures'

const mocks = vi.hoisted(() => ({
  getCurrentAccount: vi.fn(),
  getSetupStatus: vi.fn(),
  getPublicArtworks: vi.fn(),
  getDashboard: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    getCurrentAccount: mocks.getCurrentAccount,
    getSetupStatus: mocks.getSetupStatus,
    getPublicArtworks: mocks.getPublicArtworks,
    getDashboard: mocks.getDashboard,
    signOut: mocks.signOut,
  }
})

function visit(path: string) {
  window.history.replaceState({}, '', path)
  return render(<App />)
}

describe('application routes and shared shell', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
    window.sessionStorage.clear()
    vi.clearAllMocks()
    mocks.getCurrentAccount.mockResolvedValue(null)
    mocks.getSetupStatus.mockResolvedValue({ setupRequired: false })
    mocks.getPublicArtworks.mockResolvedValue([
      makeArtwork(1),
      makeArtwork(2),
      makeArtwork(3),
      makeArtwork(4),
      makeArtwork(5),
    ])
    mocks.getDashboard.mockResolvedValue(makeDashboard())
    mocks.signOut.mockResolvedValue(undefined)
  })

  it('shows the signed-out public shell and setup link on the landing page', async () => {
    mocks.getSetupStatus.mockResolvedValue({ setupRequired: true })
    visit('/')

    expect(
      await screen.findByRole('heading', {
        name: 'Quiet study in form, memory, and light.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Set up artist account' }),
    ).toHaveAttribute('href', '/setup')
    expect(
      screen.getAllByRole('link', { name: /Graphite/ }).length,
    ).toBeGreaterThan(0)
  })

  it('redirects signed-out visitors from admin routes to sign-in with a return path', async () => {
    visit('/admin/artworks')

    expect(
      await screen.findByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Create a viewer account' }),
    ).toHaveAttribute('href', '/signup?returnTo=%2Fadmin%2Fartworks')
  })

  it('redirects viewer accounts away from admin routes', async () => {
    mocks.getCurrentAccount.mockResolvedValue({
      id: 2,
      username: 'viewer',
      role: 'VIEWER',
    })
    visit('/admin')

    expect(
      await screen.findByRole('heading', {
        name: 'Quiet study in form, memory, and light.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Portfolio overview' }),
    ).toBeNull()
  })

  it('shows the admin dashboard and signs the artist out', async () => {
    mocks.getCurrentAccount.mockResolvedValue({
      id: 1,
      username: 'artist',
      role: 'ADMIN',
    })
    visit('/admin')

    expect(
      await screen.findByRole('heading', { name: 'Portfolio overview' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledOnce()
      expect(
        screen.queryByRole('button', { name: 'Sign out' }),
      ).not.toBeInTheDocument()
    })
  })

  it('reports sign-out failures and lets the artist retry a service error', async () => {
    mocks.getCurrentAccount
      .mockRejectedValueOnce(new Error('Service unavailable.'))
      .mockResolvedValue(null)
    mocks.getSetupStatus.mockResolvedValue({ setupRequired: true })
    const { unmount } = visit('/')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Service unavailable.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(
      await screen.findByRole('link', { name: 'Set up artist account' }),
    ).toBeInTheDocument()
    unmount()

    mocks.getCurrentAccount.mockResolvedValue({
      id: 1,
      username: 'artist',
      role: 'ADMIN',
    })
    mocks.signOut.mockRejectedValueOnce(new Error('Sign out failed.'))
    visit('/')
    await screen.findByText('artist')
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sign out failed.',
    )
  })

  it('renders the not-found page for unknown routes', async () => {
    visit('/unknown')

    expect(
      await screen.findByRole('heading', {
        name: 'This page is not in the collection.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute(
      'href',
      '/',
    )
  })
})
