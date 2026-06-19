import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { ApiResponse } from './types'

const TOKEN_KEY = 'diskie-access-token'
const USER_KEY = 'diskie-user'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

function normalizeUrl(url?: string): string {
  return (url ?? '').toLowerCase()
}

function isPublicAuthRequest(url?: string): boolean {
  const normalized = normalizeUrl(url)
  return (
    normalized.includes('/auth/login') ||
    normalized.includes('/auth/register') ||
    normalized.includes('/auth/forgot-password') ||
    normalized.includes('/auth/reset-password') ||
    normalized.includes('/auth/parent/magic-link/request') ||
    normalized.includes('/auth/parent/magic-link/consume')
  )
}

function resolveAuthRedirect(status: number): string {
  if (status === 403) {
    const from = encodeURIComponent(window.location.pathname)
    return `/access-denied?from=${from}`
  }

  const isParentPath = window.location.pathname.startsWith('/parent')
  const base = isParentPath ? '/parent/sign-in' : '/sign-in'
  return `${base}?reason=session-expired`
}

function friendlyMessageByStatus(status?: number): string | null {
  if (!status) return null

  if (status === 400) return 'We could not process that request. Please check your input and try again.'
  if (status === 401) return 'Your email or password is incorrect. Please try again.'
  if (status === 403) return 'You do not have permission to access this data with the current account.'
  if (status === 404) return 'We could not find what you were looking for.'
  if (status === 409) return 'This action conflicts with existing data. Refresh and try again.'
  if (status >= 500) return 'Something went wrong on our side. Please try again in a moment.'

  return null
}

function toFriendlyServerMessage(message: string, status?: number): string {
  const normalized = message.trim().toLowerCase()

  if (normalized === 'invalid credentials') {
    return 'Your email or password is incorrect. Please try again.'
  }

  if (normalized.includes('request failed with status code')) {
    return friendlyMessageByStatus(status) ?? 'We could not complete your request. Please try again.'
  }

  return message
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the JWT bearer token to every request.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// On 401 the token is invalid/expired -> clear it and bounce to sign-in.
// Keep 403 in-page so route guards handle navigation and views can render
// endpoint-specific permission errors instead of hard redirects.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    const requestUrl = normalizeUrl(error.config?.url)

    if (status === 401 && !isPublicAuthRequest(requestUrl)) {
      setStoredToken(null)
      localStorage.removeItem(USER_KEY)

      const target = resolveAuthRedirect(status)
      const onAuthPage =
        window.location.pathname.startsWith('/access-denied') ||
        window.location.pathname.startsWith('/sign-in') ||
        window.location.pathname.startsWith('/parent/sign-in')

      if (!onAuthPage) {
        window.location.assign(target)
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Extracts a human-readable error message from an API error response that uses
 * the ApiResponse envelope ({ success, message, code, data }).
 */
export function extractErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof AxiosError) {
    const status = error.response?.status
    const data = error.response?.data as ApiResponse<unknown> | undefined
    if (data?.message) {
      return toFriendlyServerMessage(data.message, status)
    }

    const statusMessage = friendlyMessageByStatus(status)
    if (statusMessage) {
      return statusMessage
    }

    if (error.message?.toLowerCase().includes('network error')) {
      return 'Unable to reach the server right now. Please check your connection and try again.'
    }

    if (error.message) {
      return toFriendlyServerMessage(error.message, status)
    }
  }
  if (error instanceof Error) {
    return toFriendlyServerMessage(error.message)
  }
  return fallback
}

export function isForbiddenError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 403
}

/**
 * Unwraps the ApiResponse envelope and returns the inner data, throwing if the
 * request was not successful.
 */
export function unwrap<T>(response: { data: ApiResponse<T> }): T {
  const body = response.data
  if (!body.success) {
    throw new Error(body.message || 'Request failed')
  }
  return body.data as T
}
