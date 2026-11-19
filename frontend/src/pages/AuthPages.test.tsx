import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../AuthContext'
import { SignInPage } from './AuthPages'

const mocks = vi.hoisted(() => ({
  getCurrentAccount: vi.fn(),
  getSetupStatus: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('../api', () => ({
  getCurrentAccount: mocks.getCurrentAccount,
  getSetupStatus: mocks.getSetupStatus,
  signIn: mocks.signIn,
  signOut: mocks.signOut,
}))

function renderSignIn(returnTo: string) {
  return render(
    <MemoryRouter initialEntries={[`/signin?returnTo=${encodeURIComponent(returnTo)}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/artworks/:id" element={<p>Artwork detail restored</p>} />
          <Route path="/" element={<p>Gallery home</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('sign-in return flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentAccount.mockResolvedValue(null)
    mocks.getSetupStatus.mockResolvedValue({ setupRequired: false })
    mocks.signIn.mockResolvedValue({ id: 2, username: 'viewer', role: 'VIEWER' })
  })

  it('returns a viewer to the requested artwork after authentication', async () => {
    renderSignIn('/artworks/7')
    fireEvent.change(await screen.findByLabelText('Username'), { target: { value: 'viewer' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Artwork detail restored')).toBeInTheDocument()
  })
})
