import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { resolveRoleHomePath, resolveRoleName } from './RoleRoute'

export function GuestRoute() {
  const { isAuthenticated, isParentSession, user } = useAuth()

  if (!isAuthenticated) {
    return <Outlet />
  }

  if (isParentSession) {
    return <Navigate to="/parent/portal" replace />
  }

  if (!resolveRoleName(user?.role)) {
    return <Navigate to="/access-denied?from=%2Fsign-in" replace />
  }

  const redirectTo = resolveRoleHomePath(user?.role)
  return <Navigate to={redirectTo} replace />
}
