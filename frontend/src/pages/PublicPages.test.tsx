import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GalleryPage, ArtworkDetailPage } from './PublicPages'
import { makeArtwork } from '../test/fixtures'

const mocks = vi.hoisted(() => ({
  getPublicArtworks: vi.fn(),
  getArtwork: vi.fn(),
  recordView: vi.fn(),
  reactToArtwork: vi.fn(),
  addComment: vi.fn(),
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
  useAuth: () => ({ account: null }),
}))

function CurrentLocation() {
  const location = useLocation()
  return <p>Current route: {location.pathname}{location.search}</p>
}

describe('public gallery and artwork detail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPublicArtworks.mockResolvedValue([makeArtwork(1), makeArtwork(2)])
    mocks.getArtwork.mockResolvedValue(makeArtwork(7))
    mocks.recordView.mockResolvedValue(undefined)
  })

  it('shows public works, filters by medium, and searches the selected gallery', async () => {
    render(<MemoryRouter><GalleryPage /></MemoryRouter>)
    expect(await screen.findByText('Study 1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Graphite' }))
    await waitFor(() => expect(mocks.getPublicArtworks).toHaveBeenLastCalledWith({
      medium: 'Graphite',
      sort: 'recent',
      search: '',
    }))
    fireEvent.change(screen.getByLabelText('Search artworks'), { target: { value: 'portrait' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(mocks.getPublicArtworks).toHaveBeenLastCalledWith({
      medium: 'Graphite',
      sort: 'recent',
      search: 'portrait',
    }))
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
    expect(await screen.findByText(/Current route: \/signin/)).toHaveTextContent('returnTo=%2Fartworks%2F7')
  })
})
