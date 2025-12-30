import dayjs, { Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type { DateInput, ISO8601String } from '@dayjs-business/core'

// Enable custom parse format plugin
dayjs.extend(customParseFormat)

export interface ValidationResult {
  isValid: boolean
  error?: string
  normalized?: Dayjs
}

export interface DateRangeValidation {
  isValid: boolean
  error?: string
  start?: Dayjs
  end?: Dayjs
}

/**
 * Validate a date input
 */
export function validateDate(input: DateInput): ValidationResult {
  if (input === null || input === undefined) {
    return { isValid: false, error: 'Date is null or undefined' }
  }

  const d = dayjs(input)

  if (!d.isValid()) {
    return { isValid: false, error: 'Invalid date format' }
  }

  return { isValid: true, normalized: d }
}

/**
 * Validate ISO 8601 date string
 */
export function validateISO8601(input: string): ValidationResult {
  const iso8601Pattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/

  if (typeof input !== 'string') {
    return { isValid: false, error: 'Input must be a string' }
  }

  if (!iso8601Pattern.test(input)) {
    return { isValid: false, error: 'Invalid ISO 8601 format' }
  }

  const d = dayjs(input)
  if (!d.isValid()) {
    return { isValid: false, error: 'Date values out of range' }
  }

  return { isValid: true, normalized: d }
}

/**
 * Validate a date range (start must be before or equal to end)
 */
export function validateDateRange(start: DateInput, end: DateInput): DateRangeValidation {
  const startResult = validateDate(start)
  if (!startResult.isValid) {
    return { isValid: false, error: `Invalid start date: ${startResult.error}` }
  }

  const endResult = validateDate(end)
  if (!endResult.isValid) {
    return { isValid: false, error: `Invalid end date: ${endResult.error}` }
  }

  if (startResult.normalized!.isAfter(endResult.normalized!)) {
    return { isValid: false, error: 'Start date must be before or equal to end date' }
  }

  return {
    isValid: true,
    start: startResult.normalized,
    end: endResult.normalized
  }
}

/**
 * Check if date is within a valid range (not too old or too far in future)
 */
export function isDateInReasonableRange(
  input: DateInput,
  yearsInPast = 100,
  yearsInFuture = 100
): boolean {
  const d = dayjs(input)
  if (!d.isValid()) return false

  const now = dayjs()
  const minDate = now.subtract(yearsInPast, 'year')
  const maxDate = now.add(yearsInFuture, 'year')

  return d.isAfter(minDate) && d.isBefore(maxDate)
}

/**
 * Check if date is a valid business date (weekday, not holiday)
 */
export function isValidBusinessDate(input: DateInput, holidays: string[] = []): boolean {
  const d = dayjs(input)
  if (!d.isValid()) return false

  // Check if weekday (1-5)
  const dayOfWeek = d.day()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false
  }

  // Check if holiday
  const dateStr = d.format('YYYY-MM-DD')
  return !holidays.includes(dateStr)
}

/**
 * Check if date is today
 */
export function isToday(input: DateInput): boolean {
  const d = dayjs(input)
  return d.isValid() && d.isSame(dayjs(), 'day')
}

/**
 * Check if date is in the past
 */
export function isPast(input: DateInput): boolean {
  const d = dayjs(input)
  return d.isValid() && d.isBefore(dayjs(), 'day')
}

/**
 * Check if date is in the future
 */
export function isFuture(input: DateInput): boolean {
  const d = dayjs(input)
  return d.isValid() && d.isAfter(dayjs(), 'day')
}

/**
 * Check if year is a leap year
 */
export function isLeapYear(yearOrDate: number | DateInput): boolean {
  const year = typeof yearOrDate === 'number' ? yearOrDate : dayjs(yearOrDate).year()
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * Check if date is weekend
 */
export function isWeekend(input: DateInput): boolean {
  const d = dayjs(input)
  if (!d.isValid()) return false
  const dayOfWeek = d.day()
  return dayOfWeek === 0 || dayOfWeek === 6
}

/**
 * Check if date is weekday
 */
export function isWeekday(input: DateInput): boolean {
  const d = dayjs(input)
  if (!d.isValid()) return false
  const dayOfWeek = d.day()
  return dayOfWeek >= 1 && dayOfWeek <= 5
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: DateInput, date2: DateInput): boolean {
  return dayjs(date1).isSame(dayjs(date2), 'day')
}

/**
 * Check if two dates are in the same week
 */
export function isSameWeek(date1: DateInput, date2: DateInput): boolean {
  return dayjs(date1).isSame(dayjs(date2), 'week')
}

/**
 * Check if two dates are in the same month
 */
export function isSameMonth(date1: DateInput, date2: DateInput): boolean {
  return dayjs(date1).isSame(dayjs(date2), 'month')
}

/**
 * Check if two dates are in the same year
 */
export function isSameYear(date1: DateInput, date2: DateInput): boolean {
  return dayjs(date1).isSame(dayjs(date2), 'year')
}

/**
 * Parse and validate date with multiple format attempts
 */
export function parseDate(input: string, formats: string[] = []): ValidationResult {
  const defaultFormats = [
    'YYYY-MM-DD',
    'YYYY/MM/DD',
    'DD-MM-YYYY',
    'DD/MM/YYYY',
    'MM-DD-YYYY',
    'MM/DD/YYYY',
    'YYYY-MM-DDTHH:mm:ss',
    'YYYY-MM-DDTHH:mm:ssZ'
  ]

  const allFormats = [...formats, ...defaultFormats]

  for (const format of allFormats) {
    const d = dayjs(input, format, true) // strict mode
    if (d.isValid()) {
      return { isValid: true, normalized: d }
    }
  }

  // Try native parsing as fallback
  const d = dayjs(input)
  if (d.isValid()) {
    return { isValid: true, normalized: d }
  }

  return { isValid: false, error: 'Unable to parse date with any known format' }
}

/**
 * Convert to ISO8601 string type
 */
export function toISO8601(input: DateInput): ISO8601String | null {
  const d = dayjs(input)
  if (!d.isValid()) return null
  return d.toISOString() as ISO8601String
}
