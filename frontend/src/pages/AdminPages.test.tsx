import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AdminComments,
  AdminDashboard,
  ArtworkForm,
  ArtworkManagement,
} from './AdminPages'
import { makeArtwork, makeDashboard } from '../test/fixtures'

const getDashboard = vi.hoisted(() => vi.fn())
const getAdminArtworks = vi.hoisted(() => vi.fn())
const deleteArtwork = vi.hoisted(() => vi.fn())
const updateArtworkStatus = vi.hoisted(() => vi.fn())
const getAdminArtwork = vi.hoisted(() => vi.fn())
const saveArtwork = vi.hoisted(() => vi.fn())
const getAdminComments = vi.hoisted(() => vi.fn())
const deleteComment = vi.hoisted(() => vi.fn())

vi.mock('../api', () => ({
  getDashboard,
  getAdminArtworks,
  deleteArtwork,
  updateArtworkStatus,
  getAdminArtwork,
  saveArtwork,
  getAdminComments,
  deleteComment,
  imageUrl: (path: string) => `/${path}`,
}))

function renderAdminRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/artworks/new" element={<ArtworkForm />} />
        <Route path="/admin/artworks/:id/edit" element={<ArtworkForm />} />
        <Route path="/admin/artworks" element={<ArtworkManagement />} />
        <Route path="/admin/comments" element={<AdminComments />} />
        <Route path="/artworks/:id" element={<p>Artwork detail</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('admin dashboard', () => {
  beforeEach(() => {
    getDashboard.mockReset()
    getDashboard.mockResolvedValue(makeDashboard())
  })

  it('renders persisted totals, per-medium summaries, and drill-down links', async () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>,
    )
    expect(
      await screen.findByRole('heading', { name: 'Portfolio overview' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Uploaded5/ })).toHaveAttribute(
      'href',
      '/admin/artworks?status=UPLOADED',
    )
    expect(screen.getByRole('link', { name: /Views40/ })).toHaveAttribute(
      'href',
      '/admin/artworks?sort=popular',
    )
    expect(
      screen.getByRole('link', { name: /Graphite1 published/ }),
    ).toHaveAttribute('href', '/admin/artworks?medium=Graphite')
    expect(
      screen.getByRole('link', { name: /Moderate visitor comments/ }),
    ).toHaveAttribute('href', '/admin/comments')
  })

  it('surfaces dashboard request failures', async () => {
    getDashboard.mockRejectedValueOnce(new Error('Database unavailable.'))
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Database unavailable.',
    )
  })
})

describe('artwork deletion confirmation', () => {
  beforeEach(() => {
    getAdminArtworks.mockReset().mockResolvedValue([makeArtwork(1)])
    deleteArtwork.mockReset()
    updateArtworkStatus
      .mockReset()
      .mockResolvedValue(makeArtwork(1, 'UNPUBLISHED'))
  })

  it('warns that related data will be removed and preserves the artwork when canceled', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(
      <MemoryRouter>
        <ArtworkManagement />
      </MemoryRouter>,
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))

    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining('comments and engagement records'),
    )
    expect(deleteArtwork).not.toHaveBeenCalled()
    expect(screen.getByText('Study 1')).toBeInTheDocument()
    confirm.mockRestore()
  })

  it('filters the collection and changes artwork status', async () => {
    renderAdminRoute('/admin/artworks?medium=Graphite')

    await screen.findByText('Study 1')
    expect(getAdminArtworks).toHaveBeenCalledWith(
      expect.objectContaining({ medium: 'Graphite' }),
    )
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'PUBLISHED' },
    })
    await waitFor(() =>
      expect(getAdminArtworks).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'PUBLISHED' }),
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Unpublish' }))
    await waitFor(() =>
      expect(updateArtworkStatus).toHaveBeenCalledWith(1, 'UNPUBLISHED'),
    )
  })

  it('searches, sorts, retries errors, and renders an empty result state', async () => {
    getAdminArtworks
      .mockRejectedValueOnce(new Error('Collection offline.'))
      .mockResolvedValueOnce([])
    renderAdminRoute('/admin/artworks?sort=popular')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Collection offline.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(
      await screen.findByRole('heading', {
        name: 'No artworks match those filters.',
      }),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'portrait' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() =>
      expect(getAdminArtworks).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'portrait', sort: 'popular' }),
      ),
    )
  })
})

describe('artwork form', () => {
  beforeEach(() => {
    getAdminArtwork.mockReset().mockResolvedValue(makeArtwork(7))
    saveArtwork.mockReset().mockResolvedValue(makeArtwork(7))
  })

  it('creates an artwork and reports save errors', async () => {
    const { unmount } = renderAdminRoute('/admin/artworks/new')
    fireEvent.change(await screen.findByLabelText('Title'), {
      target: { value: 'New study' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'A new description.' },
    })
    fireEvent.change(screen.getByLabelText('Medium'), {
      target: { value: 'Charcoal' },
    })
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'PUBLISHED' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save artwork' }))
    await waitFor(() =>
      expect(saveArtwork).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New study',
          medium: 'Charcoal',
          description: 'A new description.',
          status: 'PUBLISHED',
        }),
        undefined,
      ),
    )
    unmount()

    saveArtwork.mockRejectedValueOnce(new Error('Artwork rejected.'))
    renderAdminRoute('/admin/artworks/new')
    fireEvent.change(await screen.findByLabelText('Title'), {
      target: { value: 'New study' },
    })
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'A new description.' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save artwork' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Artwork rejected.',
    )
  })

  it('loads and updates an artwork, and reports load failures', async () => {
    const { unmount } = renderAdminRoute('/admin/artworks/7/edit')
    expect(await screen.findByDisplayValue('Study 7')).toBeInTheDocument()
    expect(getAdminArtwork).toHaveBeenCalledWith(7)
    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Updated study' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save artwork' }))
    await waitFor(() =>
      expect(saveArtwork).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Updated study' }),
        7,
      ),
    )
    unmount()

    getAdminArtwork.mockRejectedValueOnce(new Error('Artwork missing.'))
    renderAdminRoute('/admin/artworks/404/edit')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Artwork missing.',
    )
  })
})

describe('comment moderation', () => {
  beforeEach(() => {
    getAdminComments.mockReset().mockResolvedValue([
      {
        id: 4,
        artworkId: 7,
        artworkTitle: 'Study 7',
        username: 'viewer',
        content: 'A lovely detail.',
        createdAt: '2026-01-02T00:00:00Z',
      },
    ])
    deleteComment.mockReset().mockResolvedValue(undefined)
  })

  it('lists comments, confirms removal, and reports loading errors', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { unmount } = renderAdminRoute('/admin/comments')
    expect(await screen.findByText('A lovely detail.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(confirm).toHaveBeenCalledWith('Remove this comment from “Study 7”?')
    expect(deleteComment).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(deleteComment).toHaveBeenCalledWith(4))
    unmount()
    confirm.mockRestore()

    getAdminComments.mockRejectedValueOnce(new Error('Comments offline.'))
    renderAdminRoute('/admin/comments')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Comments offline.',
    )
  })
})
