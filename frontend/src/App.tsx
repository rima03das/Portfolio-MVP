import { useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import {
  AdminComments,
  AdminDashboard,
  ArtworkForm,
  ArtworkManagement,
} from './pages/AdminPages'
import { SetupPage, SignInPage, SignUpPage } from './pages/AuthPages'
import {
  ArtworkDetailPage,
  GalleryPage,
  LandingPage,
} from './pages/PublicPages'
import './App.css'

function Shell() {
  const { account, setupRequired, loading, error, refresh, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleSignOut = async () => {
    setSigningOut(true)
    setActionError(null)
    try {
      await signOut()
      navigate('/', { replace: true })
    } catch (requestError) {
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : 'Sign out failed.',
      )
    } finally {
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <main className="loading-screen" aria-live="polite">
        Opening your portfolio…
      </main>
    )
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Portfolio home">
          <span className="brand-mark">P</span>
          <span>Portfolio</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link to="/">Home</Link>
          <Link to="/gallery">Gallery</Link>
          {account?.role === 'ADMIN' && <Link to="/admin">Dashboard</Link>}
        </nav>
        <div className="header-account">
          {account ? (
            <>
              <span className="signed-in-label">{account.username}</span>
              <button
                className="button button-outline button-compact"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </>
          ) : setupRequired ? (
            <Link className="button button-outline button-compact" to="/setup">
              Set up artist account
            </Link>
          ) : (
            <Link
              className="button button-outline button-compact"
              to={`/signin?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      {error && (
        <div className="service-banner" role="alert">
          <span>{error}</span>
          <button className="text-button" onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      )}
      {actionError && (
        <div className="service-banner" role="alert">
          {actionError}
        </div>
      )}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
        <Route
          path="/setup"
          element={
            setupRequired ? <SetupPage /> : <Navigate to="/signin" replace />
          }
        />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/artworks" element={<ArtworkManagement />} />
          <Route path="/admin/artworks/new" element={<ArtworkForm />} />
          <Route path="/admin/artworks/:id/edit" element={<ArtworkForm />} />
          <Route path="/admin/comments" element={<AdminComments />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer className="site-footer">
        <span>Portfolio · Art in focus</span>
        <span>Locally hosted · Your collection stays on this device</span>
      </footer>
    </div>
  )
}

function RequireAdmin() {
  const { account, loading } = useAuth()
  const location = useLocation()
  if (loading) return <main className="loading-screen">Checking access…</main>
  if (!account) {
    return (
      <Navigate
        to={`/signin?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }
  if (account.role !== 'ADMIN') return <Navigate to="/" replace />
  return <Outlet />
}

function NotFound() {
  return (
    <main className="narrow-page empty-state">
      <p className="eyebrow">Not found</p>
      <h1>This page is not in the collection.</h1>
      <Link className="button button-primary" to="/">
        Return home
      </Link>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  )
}
