import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  getCurrentAccount,
  signIn as apiSignIn,
  signOut as apiSignOut,
} from './api'
import { getSetupStatus } from './api'
import type { Account } from './types'

interface AuthContextValue {
  account: Account | null
  setupRequired: boolean
  loading: boolean
  error: string | null
  signIn: (username: string, password: string) => Promise<Account>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  setAccount: (account: Account | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [setupRequired, setSetupRequired] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [current, setup] = await Promise.all([
        getCurrentAccount(),
        getSetupStatus(),
      ])
      setAccount(current)
      setSetupRequired(setup.setupRequired)
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : null
      setError(message || 'The portfolio service is unavailable.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signIn = useCallback(async (username: string, password: string) => {
    const signedInAccount = await apiSignIn(username, password)
    setAccount(signedInAccount)
    setError(null)
    return signedInAccount
  }, [])

  const signOut = useCallback(async () => {
    await apiSignOut()
    setAccount(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        account,
        setupRequired,
        loading,
        error,
        signIn,
        signOut,
        refresh,
        setAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
