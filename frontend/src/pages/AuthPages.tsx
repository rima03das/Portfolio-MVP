import { useState, type FormEvent, type ReactNode } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { registerViewer, setupAdmin } from '../api'

function safeReturnPath(value: string | null): string | null {
  return value?.startsWith('/') && !value.startsWith('//') ? value : null
}

function AuthLayout({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Portfolio access</p>
        <h1>{title}</h1>
        {children}
      </div>
      <aside className="auth-aside">
        <img
          src="/IMG-20211204-WA0031.jpg"
          alt="Fan illustration with cherry blossoms"
        />
        <div>
          <span>Made to be seen.</span>
          <p>Your visit is local. Your response is yours.</p>
        </div>
      </aside>
    </main>
  )
}

export function SetupPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await setupAdmin(username, password)
      await signIn(username, password)
      navigate('/admin', { replace: true })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Account setup failed.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Create your artist account">
      <p className="auth-intro">
        This one-time setup creates the only artist/admin account for this local
        portfolio.
      </p>
      <form className="stacked-form" onSubmit={submit}>
        <label>
          Username
          <input
            autoComplete="username"
            minLength={3}
            maxLength={40}
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button button-primary" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create artist account'}
        </button>
      </form>
    </AuthLayout>
  )
}

export function SignInPage() {
  const { signIn, account } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const returnTo = safeReturnPath(searchParams.get('returnTo'))

  if (account) {
    return (
      <main className="narrow-page empty-state">
        <h1>You are already signed in.</h1>
        <Link to={returnTo ?? '/'}>Continue</Link>
      </main>
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const signedIn = await signIn(username, password)
      navigate(returnTo ?? (signedIn.role === 'ADMIN' ? '/admin' : '/'), {
        replace: true,
      })
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Sign-in failed.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Welcome back">
      <p className="auth-intro">
        Sign in to manage your work or share a response.
      </p>
      <form className="stacked-form" onSubmit={submit}>
        <label>
          Username
          <input
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button button-primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="auth-switch">
        New to the gallery?{' '}
        <Link
          to={`/signup?returnTo=${encodeURIComponent(returnTo ?? location.pathname)}`}
        >
          Create a viewer account
        </Link>
      </p>
    </AuthLayout>
  )
}

export function SignUpPage() {
  const { signIn } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const returnTo = safeReturnPath(searchParams.get('returnTo'))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await registerViewer(username, password)
      await signIn(username, password)
      navigate(returnTo ?? '/', { replace: true })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Registration failed.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Join the gallery">
      <p className="auth-intro">
        You can browse without an account. Sign up to like, dislike, or comment
        on an artwork.
      </p>
      <form className="stacked-form" onSubmit={submit}>
        <label>
          Username
          <input
            autoComplete="username"
            minLength={3}
            maxLength={40}
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button button-primary" type="submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create viewer account'}
        </button>
      </form>
      <p className="auth-switch">
        Already registered?{' '}
        <Link to={`/signin?returnTo=${encodeURIComponent(returnTo ?? '/')}`}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
