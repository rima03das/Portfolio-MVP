import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ArtworkDetailPage, GalleryPage, LandingPage } from './PublicPages'
import { makeArtwork } from '../test/fixtures'

const mocks = vi.hoisted(() => ({
  getPublicArtworks: vi.fn(),
  getArtwork: vi.fn(),
  recordView: vi.fn(),
  reactToArtwork: vi.fn(),
  addComment: vi.fn(),
  currentAccount: vi.fn(),
}))

vi.mock('../api', () => ({
  getPublicArtworks: mocks.getPublicArtworks,
  getArtwork: mocks.getArtwork,
  recordView: mocks.recordView,
  reactToArtwork: mocks.reactToArtwork,
  addComment: mocks.addComment,
  imageUrl: (path: string) => `/${path}`,
}))

vi.mock('../AuthContext', () => ({
  useAuth: () => ({ account: mocks.currentAccount() }),
}))

function CurrentLocation() {
  const location = useLocation()
  return (
    <p>
      Current route: {location.pathname}
      {location.search}
    </p>
  )
}

describe('public gallery and artwork detail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPublicArtworks.mockResolvedValue([makeArtwork(1), makeArtwork(2)])
    mocks.getArtwork.mockResolvedValue(makeArtwork(7))
    mocks.recordView.mockResolvedValue(undefined)
    mocks.currentAccount.mockReturnValue(null)
    mocks.reactToArtwork.mockResolvedValue(makeArtwork(7))
    mocks.addComment.mockResolvedValue(undefined)
  })

  it('renders three session-selected works and retries a landing-page failure', async () => {
    mocks.getPublicArtworks.mockResolvedValue([
      makeArtwork(1),
      makeArtwork(2),
      makeArtwork(3),
      makeArtwork(4),
      makeArtwork(5),
    ])
    const { unmount } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Three works to begin with' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(
      JSON.parse(
        window.sessionStorage.getItem('portfolio.sample-artwork-ids') ?? '[]',
      ),
    ).toHaveLength(3)
    unmount()

    mocks.getPublicArtworks.mockRejectedValueOnce(new Error('Gallery offline.'))
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Gallery offline.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(
      await screen.findByRole('heading', { name: 'Three works to begin with' }),
    ).toBeInTheDocument()
  })

  it('shows public works, filters by medium, and searches the selected gallery', async () => {
    render(
      <MemoryRouter>
        <GalleryPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Study 1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Graphite' }))
    await waitFor(() =>
      expect(mocks.getPublicArtworks).toHaveBeenLastCalledWith({
        medium: 'Graphite',
        sort: 'recent',
        search: '',
      }),
    )
    fireEvent.change(screen.getByLabelText('Search artworks'), {
      target: { value: 'portrait' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() =>
      expect(mocks.getPublicArtworks).toHaveBeenLastCalledWith({
        medium: 'Graphite',
        sort: 'recent',
        search: 'portrait',
      }),
    )
    fireEvent.change(screen.getByLabelText('Sort'), {
      target: { value: 'popular' },
    })
    await waitFor(() =>
      expect(mocks.getPublicArtworks).toHaveBeenLastCalledWith({
        medium: 'Graphite',
        sort: 'popular',
        search: 'portrait',
      }),
    )
  })

  it('applies a medium from the route and shows a retryable gallery error', async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/gallery?medium=Charcoal']}>
        <GalleryPage />
      </MemoryRouter>,
    )
    await waitFor(() =>
      expect(mocks.getPublicArtworks).toHaveBeenCalledWith({
        medium: 'Charcoal',
        sort: 'recent',
        search: '',
      }),
    )
    unmount()

    mocks.getPublicArtworks.mockRejectedValueOnce(new Error('Gallery offline.'))
    render(
      <MemoryRouter>
        <GalleryPage />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Gallery offline.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Study 1')).toBeInTheDocument()
  })

  it('prompts a signed-out visitor to sign in and preserves the artwork destination', async () => {
    render(
      <MemoryRouter initialEntries={['/artworks/7']}>
        <Routes>
          <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
          <Route path="/signin" element={<CurrentLocation />} />
        </Routes>
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { name: 'Study 7' })
    fireEvent.click(screen.getByRole('button', { name: '♡ Like' }))
    expect(
      await screen.findByText(/Current route: \/signin/),
    ).toHaveTextContent('returnTo=%2Fartworks%2F7')
  })

  it('lets signed-in visitors react and comment on an artwork', async () => {
    mocks.currentAccount.mockReturnValue({
      id: 2,
      username: 'viewer',
      role: 'VIEWER',
    })
    render(
      <MemoryRouter initialEntries={['/artworks/7']}>
        <Routes>
          <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: 'Study 7' })
    fireEvent.click(screen.getByRole('button', { name: '♡ Like' }))
    await waitFor(() =>
      expect(mocks.reactToArtwork).toHaveBeenCalledWith(7, 'LIKE'),
    )
    fireEvent.change(screen.getByLabelText('Leave a note'), {
      target: { value: 'Lovely detail.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Post comment' }))
    await waitFor(() =>
      expect(mocks.addComment).toHaveBeenCalledWith(7, 'Lovely detail.'),
    )
    expect(mocks.getArtwork).toHaveBeenCalledTimes(3)
  })

  it('reports invalid artwork IDs, view failures, and empty comment lists', async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/artworks/not-a-number']}>
        <Routes>
          <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This artwork could not be found.',
    )
    expect(mocks.getArtwork).not.toHaveBeenCalled()
    unmount()

    mocks.getArtwork.mockResolvedValue({
      ...makeArtwork(7),
      comments: 0,
      commentSnippets: [],
    })
    mocks.recordView.mockRejectedValueOnce(new Error('View failed.'))
    render(
      <MemoryRouter initialEntries={['/artworks/7']}>
        <Routes>
          <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('View failed.')
    expect(
      screen.getByText(
        'There are no notes here yet. Be the first to share one.',
      ),
    ).toBeInTheDocument()
  })
})
