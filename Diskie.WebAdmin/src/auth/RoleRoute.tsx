import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { userRoleNames, UserRole } from '../api/types'
import { getRoleClaim } from './tokenClaims'

type RoleRouteProps = {
  allow: UserRole[]
  redirectTo?: string
}

// Resolves the current user's role name whether the API serialized it as a
// number (enum index) or a string.
export function resolveRoleName(role: unknown): UserRole | undefined {
  if (typeof role === 'number') {
    return userRoleNames[role]
  }
  if (typeof role === 'string') {
    return userRoleNames.find((name) => name === role)
  }
  return undefined
}

export function resolveRoleHomePath(role: unknown): string {
  const roleName = resolveRoleName(role)

  if (!roleName) {
    return '/access-denied'
  }

  if (roleName === UserRole.SuperAdmin) {
    return '/'
  }

  if (roleName === UserRole.Player) {
    return '/player'
  }

  if (roleName === UserRole.Guardian) {
    return '/parent/portal'
  }

  return '/coach'
}

export function canAccessPath(role: unknown, pathname: string): boolean {
  const roleName = resolveRoleName(role)
  if (!roleName) {
    return false
  }

  // Public error routes are accessible to authenticated users.
  if (pathname === '/access-denied' || pathname === '/404') {
    return true
  }

  if (roleName === UserRole.SuperAdmin) {
    return (
      pathname === '/' ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/tenants') ||
      pathname.startsWith('/users') ||
      pathname.startsWith('/billing') ||
      pathname.startsWith('/templates') ||
      pathname.startsWith('/health') ||
      pathname.startsWith('/profile')
    )
  }

  if (roleName === UserRole.Coach || roleName === UserRole.SchoolAdmin) {
    return pathname.startsWith('/coach')
  }

  if (roleName === UserRole.Player) {
    return pathname.startsWith('/player')
  }

  if (roleName === UserRole.Guardian) {
    return pathname.startsWith('/parent/portal')
  }

  return false
}

export function RoleRoute({ allow, redirectTo }: RoleRouteProps) {
  const { user, token } = useAuth()
  const location = useLocation()
  const roleName = resolveRoleName(user?.role ?? (token ? getRoleClaim(token) : undefined))

  if (!roleName || !allow.includes(roleName)) {
    if (!roleName) {
      return <Navigate to="/sign-in?reason=access-denied" replace state={{ from: location }} />
    }

    const fallback = redirectTo ?? '/access-denied'
    return <Navigate to={fallback} replace state={{ from: location }} />
  }

  return <Outlet />
}
