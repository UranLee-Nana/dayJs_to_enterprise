import dayjs, { Dayjs } from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'

// 注册周序号插件，确保在任何 .week() 调用前完成初始化
dayjs.extend(weekOfYear)
import type { DateInput } from '@dayjs-business/core'

export interface FormatOptions {
  format?: string
  timezone?: string
  locale?: string
}

export interface BatchFormatResult {
  original: DateInput
  formatted: string
  isValid: boolean
}

/**
 * Format multiple dates in a batch operation
 * Optimized for performance with minimal instance creation
 */
export function batchFormat(
  dates: DateInput[],
  options: FormatOptions = {}
): BatchFormatResult[] {
  const { format = 'YYYY-MM-DD HH:mm:ss', locale } = options

  return dates.map(date => {
    try {
      let instance = dayjs(date)

      if (locale) {
        instance = instance.locale(locale)
      }

      const isValid = instance.isValid()

      return {
        original: date,
        formatted: isValid ? instance.format(format) : '',
        isValid
      }
    } catch {
      return {
        original: date,
        formatted: '',
        isValid: false
      }
    }
  })
}

/**
 * Format dates with different formats based on age
 */
export function smartFormat(date: DateInput, now?: DateInput): string {
  const d = dayjs(date)
  const reference = now ? dayjs(now) : dayjs()

  if (!d.isValid()) {
    return 'Invalid Date'
  }

  const diffDays = reference.diff(d, 'day')
  const diffYears = reference.diff(d, 'year')

  if (diffDays === 0) {
    return d.format('HH:mm')
  } else if (diffDays === 1) {
    return `Yesterday ${d.format('HH:mm')}`
  } else if (diffDays < 7) {
    return d.format('ddd HH:mm')
  } else if (diffYears === 0) {
    return d.format('MMM D')
  } else {
    return d.format('MMM D, YYYY')
  }
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export function relativeFormat(date: DateInput, now?: DateInput): string {
  const d = dayjs(date)
  const reference = now ? dayjs(now) : dayjs()

  if (!d.isValid()) {
    return 'Invalid Date'
  }

  const diffSeconds = reference.diff(d, 'second')
  const diffMinutes = reference.diff(d, 'minute')
  const diffHours = reference.diff(d, 'hour')
  const diffDays = reference.diff(d, 'day')
  const diffWeeks = reference.diff(d, 'week')
  const diffMonths = reference.diff(d, 'month')
  const diffYears = reference.diff(d, 'year')

  const isFuture = diffSeconds < 0

  const abs = (n: number): number => Math.abs(n)

  if (abs(diffSeconds) < 60) {
    return isFuture ? 'in a moment' : 'just now'
  } else if (abs(diffMinutes) < 60) {
    const mins = abs(diffMinutes)
    return isFuture ? `in ${mins} minute${mins > 1 ? 's' : ''}` : `${mins} minute${mins > 1 ? 's' : ''} ago`
  } else if (abs(diffHours) < 24) {
    const hrs = abs(diffHours)
    return isFuture ? `in ${hrs} hour${hrs > 1 ? 's' : ''}` : `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  } else if (abs(diffDays) < 7) {
    const days = abs(diffDays)
    return isFuture ? `in ${days} day${days > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''} ago`
  } else if (abs(diffWeeks) < 4) {
    const weeks = abs(diffWeeks)
    return isFuture ? `in ${weeks} week${weeks > 1 ? 's' : ''}` : `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else if (abs(diffMonths) < 12) {
    const months = abs(diffMonths)
    return isFuture ? `in ${months} month${months > 1 ? 's' : ''}` : `${months} month${months > 1 ? 's' : ''} ago`
  } else {
    const years = abs(diffYears)
    return isFuture ? `in ${years} year${years > 1 ? 's' : ''}` : `${years} year${years > 1 ? 's' : ''} ago`
  }
}

/**
 * Format duration in human readable form
 */
export function formatDuration(startDate: DateInput, endDate: DateInput): string {
  const start = dayjs(startDate)
  const end = dayjs(endDate)

  if (!start.isValid() || !end.isValid()) {
    return 'Invalid Duration'
  }

  const diffMs = Math.abs(end.diff(start, 'millisecond'))

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  const parts: string[] = []

  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`)

  return parts.join(' ')
}

/**
 * Format for display in different contexts
 */
export const formatters = {
  /** ISO format without timezone */
  iso: (date: DateInput): string => dayjs(date).format('YYYY-MM-DDTHH:mm:ss'),

  /** Date only */
  date: (date: DateInput): string => dayjs(date).format('YYYY-MM-DD'),

  /** Time only */
  time: (date: DateInput): string => dayjs(date).format('HH:mm:ss'),

  /** Short date (locale-aware would need locale plugin) */
  shortDate: (date: DateInput): string => dayjs(date).format('MM/DD/YY'),

  /** Long date */
  longDate: (date: DateInput): string => dayjs(date).format('MMMM D, YYYY'),

  /** Date and time */
  dateTime: (date: DateInput): string => dayjs(date).format('YYYY-MM-DD HH:mm'),

  /** Month and year */
  monthYear: (date: DateInput): string => dayjs(date).format('MMMM YYYY'),

  /** Week number */
  weekNumber: (date: DateInput): string => `Week ${dayjs(date).week()}`
}
