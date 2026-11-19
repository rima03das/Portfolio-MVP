import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../AuthContext'
import { SetupPage, SignInPage, SignUpPage } from './AuthPages'

const mocks = vi.hoisted(() => ({
  getCurrentAccount: vi.fn(),
  getSetupStatus: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  setupAdmin: vi.fn(),
  registerViewer: vi.fn(),
}))

vi.mock('../api', () => ({
  getCurrentAccount: mocks.getCurrentAccount,
  getSetupStatus: mocks.getSetupStatus,
  signIn: mocks.signIn,
  signOut: mocks.signOut,
  setupAdmin: mocks.setupAdmin,
  registerViewer: mocks.registerViewer,
}))

function renderSignIn(returnTo: string | null) {
  return render(
    <MemoryRouter
      initialEntries={[
        returnTo
          ? `/signin?returnTo=${encodeURIComponent(returnTo)}`
          : '/signin',
      ]}
    >
      <AuthProvider>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
          <Route
            path="/artworks/:id"
            element={<p>Artwork detail restored</p>}
          />
          <Route path="/admin" element={<p>Artist dashboard restored</p>} />
          <Route path="/" element={<p>Gallery home</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

function renderAuthPage(path: string, page: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/setup" element={page} />
          <Route path="/signup" element={page} />
          <Route path="/admin" element={<p>Artist dashboard restored</p>} />
          <Route
            path="/artworks/:id"
            element={<p>Artwork detail restored</p>}
          />
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
    mocks.signIn.mockResolvedValue({
      id: 2,
      username: 'viewer',
      role: 'VIEWER',
    })
    mocks.setupAdmin.mockResolvedValue(undefined)
    mocks.registerViewer.mockResolvedValue(undefined)
  })

  it('returns a viewer to the requested artwork after authentication', async () => {
    renderSignIn('/artworks/7')
    fireEvent.change(await screen.findByLabelText('Username'), {
      target: { value: 'viewer' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secure-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(
      await screen.findByText('Artwork detail restored'),
    ).toBeInTheDocument()
  })

  it('uses the role-based default destination and reports authentication errors', async () => {
    mocks.signIn.mockResolvedValueOnce({
      id: 1,
      username: 'artist',
      role: 'ADMIN',
    })
    const { unmount } = renderSignIn(null)
    fireEvent.change(await screen.findByLabelText('Username'), {
      target: { value: 'artist' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secure-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(
      await screen.findByText('Artist dashboard restored'),
    ).toBeInTheDocument()
    unmount()

    mocks.signIn.mockRejectedValueOnce(new Error('Invalid credentials.'))
    renderSignIn(null)
    fireEvent.change(await screen.findByLabelText('Username'), {
      target: { value: 'viewer' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrong-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid credentials.',
    )
  })

  it('rejects an unsafe return path when the account is already signed in', async () => {
    mocks.getCurrentAccount.mockResolvedValue({
      id: 2,
      username: 'viewer',
      role: 'VIEWER',
    })
    renderSignIn('//outside.example')

    expect(
      await screen.findByRole('heading', {
        name: 'You are already signed in.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute(
      'href',
      '/',
    )
  })
})

describe('account setup and viewer registration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentAccount.mockResolvedValue(null)
    mocks.getSetupStatus.mockResolvedValue({ setupRequired: true })
    mocks.signIn.mockResolvedValue({
      id: 1,
      username: 'viewer',
      role: 'VIEWER',
    })
    mocks.setupAdmin.mockResolvedValue(undefined)
    mocks.registerViewer.mockResolvedValue(undefined)
  })

  it('creates the initial artist account and reports setup errors', async () => {
    const { unmount } = renderAuthPage('/setup', <SetupPage />)
    fireEvent.change(await screen.findByLabelText('Username'), {
      target: { value: 'artist' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'a-secure-password' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Create artist account' }),
    )
    expect(
      await screen.findByText('Artist dashboard restored'),
    ).toBeInTheDocument()
    expect(mocks.setupAdmin).toHaveBeenCalledWith('artist', 'a-secure-password')
    unmount()

    mocks.setupAdmin.mockRejectedValueOnce(new Error('Setup is closed.'))
    renderAuthPage('/setup', <SetupPage />)
    fireEvent.change(await screen.findByLabelText('Username'), {
      target: { value: 'artist' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'a-secure-password' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Create artist account' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Setup is closed.',
    )
  })

  it('registers a viewer, returns to the requested artwork, and reports errors', async () => {
    const { unmount } = renderAuthPage(
      '/signup?returnTo=%2Fartworks%2F7',
      <SignUpPage />,
    )
    fireEvent.change(await screen.findByLabelText('Username'), {
      target: { value: 'viewer' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'a-secure-password' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Create viewer account' }),
    )
    expect(
      await screen.findByText('Artwork detail restored'),
    ).toBeInTheDocument()
    expect(mocks.registerViewer).toHaveBeenCalledWith(
      'viewer',
      'a-secure-password',
    )
    unmount()

    mocks.registerViewer.mockRejectedValueOnce(new Error('Name is taken.'))
    renderAuthPage('/signup', <SignUpPage />)
    fireEvent.change(await screen.findByLabelText('Username'), {
      target: { value: 'viewer' },
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'a-secure-password' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Create viewer account' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Name is taken.')
  })
})
