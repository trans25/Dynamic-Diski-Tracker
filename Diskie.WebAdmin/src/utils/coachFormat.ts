import {
  announcementAudienceNames,
  announcementPriorityNames,
  fixtureResultNames,
  fixtureTypeNames,
  injurySeverityNames,
  injuryStatusNames,
  messageChannelNames,
} from '../api/types'

function fromEnum(
  names: readonly string[],
  value: number | string | null | undefined,
  fallback = '—'
): string {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  return names[value] ?? fallback
}

export const fixtureTypeToName = (v: number | string | null | undefined) =>
  fromEnum(fixtureTypeNames, v)

export const fixtureResultToName = (v: number | string | null | undefined) =>
  fromEnum(fixtureResultNames, v)

export const injurySeverityToName = (v: number | string | null | undefined) =>
  fromEnum(injurySeverityNames, v)

export const injuryStatusToName = (v: number | string | null | undefined) =>
  fromEnum(injuryStatusNames, v)

export const announcementAudienceToName = (
  v: number | string | null | undefined
) => fromEnum(announcementAudienceNames, v)

export const announcementPriorityToName = (
  v: number | string | null | undefined
) => fromEnum(announcementPriorityNames, v)

export const messageChannelToName = (v: number | string | null | undefined) =>
  fromEnum(messageChannelNames, v)

export function formatTime(value?: string | null): string {
  if (!value) return '—'
  // API returns TimeOnly as 'HH:mm:ss'. Trim to HH:mm.
  const match = /^(\d{2}):(\d{2})/.exec(value)
  return match ? `${match[1]}:${match[2]}` : value
}
