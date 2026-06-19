import {
  billingPlanNames,
  userRoleNames,
  type BillingPlan,
  type UserRole,
} from '../api/types'

/** Converts a numeric (or string) user role from the API into its display name. */
export function roleToName(role: number | string): UserRole {
  if (typeof role === 'string') {
    return role as UserRole
  }
  return userRoleNames[role] ?? 'Player'
}

/** Converts a numeric (or string) billing plan from the API into its display name. */
export function billingPlanToName(plan: number | string): BillingPlan {
  if (typeof plan === 'string') {
    return plan as BillingPlan
  }
  return billingPlanNames[plan] ?? 'Free'
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}
