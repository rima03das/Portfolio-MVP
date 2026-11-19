import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminDashboard, ArtworkManagement } from './AdminPages'
import { makeArtwork, makeDashboard } from '../test/fixtures'

const getDashboard = vi.hoisted(() => vi.fn())
const getAdminArtworks = vi.hoisted(() => vi.fn())
const deleteArtwork = vi.hoisted(() => vi.fn())

vi.mock('../api', () => ({
  getDashboard,
  getAdminArtworks,
  deleteArtwork,
  imageUrl: (path: string) => `/${path}`,
}))

describe('admin dashboard', () => {
  beforeEach(() => {
    getDashboard.mockReset()
    getDashboard.mockResolvedValue(makeDashboard())
  })

  it('renders persisted totals, per-medium summaries, and drill-down links', async () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Portfolio overview' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Uploaded5/ })).toHaveAttribute('href', '/admin/artworks?status=UPLOADED')
    expect(screen.getByRole('link', { name: /Views40/ })).toHaveAttribute('href', '/admin/artworks?sort=popular')
    expect(screen.getByRole('link', { name: /Graphite1 published/ })).toHaveAttribute('href', '/admin/artworks?medium=Graphite')
    expect(screen.getByRole('link', { name: /Moderate visitor comments/ })).toHaveAttribute('href', '/admin/comments')
  })

  it('surfaces dashboard request failures', async () => {
    getDashboard.mockRejectedValueOnce(new Error('Database unavailable.'))
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>)
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable.')
  })
})

describe('artwork deletion confirmation', () => {
  beforeEach(() => {
    getAdminArtworks.mockReset().mockResolvedValue([makeArtwork(1)])
    deleteArtwork.mockReset()
  })

  it('warns that related data will be removed and preserves the artwork when canceled', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<MemoryRouter><ArtworkManagement /></MemoryRouter>)

    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('comments and engagement records'))
    expect(deleteArtwork).not.toHaveBeenCalled()
    expect(screen.getByText('Study 1')).toBeInTheDocument()
    confirm.mockRestore()
  })
})
