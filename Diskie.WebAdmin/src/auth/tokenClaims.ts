export function readTokenClaims(token: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length < 2) return {}

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4))
    const json = atob(base64 + padding)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return {}
  }
}

function readClaimValue(claims: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = claims[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return null
}

export function getChildIdClaim(token: string): string | null {
  const claims = readTokenClaims(token)
  return readClaimValue(claims, [
    'ChildId',
    'childId',
    'child_id',
    'childid',
    'http://schemas.diskie/claims/childid',
  ])
}

export function getRoleClaim(token: string): string | number | null {
  const claims = readTokenClaims(token)
  const role = readClaimValue(claims, [
    'role',
    'Role',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
  ])

  if (!role) return null
  const asNumber = Number(role)
  return Number.isNaN(asNumber) ? role : asNumber
}
