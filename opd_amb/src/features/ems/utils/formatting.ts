import { format, parseISO, formatDistanceToNow } from 'date-fns'

export function formatTimeOnly(isoString?: string): string {
  if (!isoString) return '--:--'
  try {
    return format(parseISO(isoString), 'HH:mm:ss')
  } catch {
    return isoString
  }
}

export function formatDateShort(isoString?: string): string {
  if (!isoString) return '--'
  try {
    return format(parseISO(isoString), 'dd MMM yyyy, HH:mm')
  } catch {
    return isoString
  }
}

export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return ''
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true })
  } catch {
    return ''
  }
}

export function formatDistanceKm(km: number): string {
  return `${km.toFixed(1)} km`
}

export function formatDurationMinutes(minutes: number): string {
  return `${minutes} mins`
}
