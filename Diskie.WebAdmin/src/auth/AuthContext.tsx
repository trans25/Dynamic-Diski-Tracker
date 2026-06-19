import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getStoredToken, setStoredToken } from '../api/apiClient'
import { authService } from '../api/services/authService'
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserViewModel,
} from '../api/types'
import { getChildIdClaim } from './tokenClaims'

type AuthContextValue = {
  user: UserViewModel | null
  token: string | null
  childId: string | null
  isParentSession: boolean
  isAuthenticated: boolean
  login: (payload: LoginRequest) => Promise<AuthResponse>
  register: (payload: RegisterRequest) => Promise<AuthResponse>
  applyTokenSession: (token: string, user?: UserViewModel | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_KEY = 'diskie-user'

function getStoredUser(): UserViewModel | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserViewModel
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<UserViewModel | null>(() => getStoredUser())
  const [childId, setChildId] = useState<string | null>(() => {
    const current = getStoredToken()
    return current ? getChildIdClaim(current) : null
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  }, [user])

  const value = useMemo<AuthContextValue>(() => {
    function applyTokenSession(nextToken: string, nextUser?: UserViewModel | null) {
      setStoredToken(nextToken)
      setToken(nextToken)
      setUser(nextUser ?? null)
      setChildId(getChildIdClaim(nextToken))
    }

    function applyAuth(result: AuthResponse) {
      applyTokenSession(result.accessToken, result.user)
    }

    return {
      user,
      token,
      childId,
      isParentSession: Boolean(token) && Boolean(childId),
      isAuthenticated: Boolean(token),
      login: async (payload) => {
        const result = await authService.login(payload)
        applyAuth(result)
        return result
      },
      register: async (payload) => {
        const result = await authService.register(payload)
        applyAuth(result)
        return result
      },
      applyTokenSession,
      logout: () => {
        setStoredToken(null)
        setToken(null)
        setUser(null)
        setChildId(null)
      },
    }
  }, [childId, token, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
