import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { UserRole } from '../api/types'
import { useAuth } from './AuthContext'
import { resolveRoleName } from './RoleRoute'
import { getRoleClaim } from './tokenClaims'

export function ParentProtectedRoute() {
  const { isAuthenticated, childId, user, token } = useAuth()
  const location = useLocation()
  const roleName = resolveRoleName(user?.role ?? (token ? getRoleClaim(token) : undefined))
  const isGuardian = roleName === UserRole.Guardian

  if (!isAuthenticated || (!childId && !isGuardian)) {
    return <Navigate to="/player/sign-in" replace state={{ from: location }} />
  }

  return <Outlet />
}
