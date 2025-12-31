import dayjs, { Dayjs, OpUnitType } from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'

// 注册周序号插件，确保在任何 .week() 调用前完成初始化
dayjs.extend(weekOfYear)
import type { DateInput, DateRange } from '@dayjs-business/core'

/**
 * Get the difference between two dates in various units
 */
export function dateDiff(
  date1: DateInput,
  date2: DateInput,
  unit: OpUnitType = 'day'
): number {
  return dayjs(date1).diff(dayjs(date2), unit)
}

/**
 * Add duration to a date
 */
export function addDuration(
  date: DateInput,
  amount: number,
  unit: OpUnitType
): Dayjs {
  return dayjs(date).add(amount, unit)
}

/**
 * Subtract duration from a date
 */
export function subtractDuration(
  date: DateInput,
  amount: number,
  unit: OpUnitType
): Dayjs {
  return dayjs(date).subtract(amount, unit)
}

/**
 * Get the start of a time unit
 */
export function startOf(date: DateInput, unit: OpUnitType): Dayjs {
  return dayjs(date).startOf(unit)
}

/**
 * Get the end of a time unit
 */
export function endOf(date: DateInput, unit: OpUnitType): Dayjs {
  return dayjs(date).endOf(unit)
}

/**
 * Get array of dates between two dates (inclusive)
 */
export function getDatesBetween(start: DateInput, end: DateInput): Dayjs[] {
  const dates: Dayjs[] = []
  let current = dayjs(start).startOf('day')
  const endDate = dayjs(end).startOf('day')

  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    dates.push(current)
    current = current.add(1, 'day')
  }

  return dates
}

/**
 * Get array of weekdays between two dates
 */
export function getWeekdaysBetween(start: DateInput, end: DateInput): Dayjs[] {
  return getDatesBetween(start, end).filter(date => {
    const day = date.day()
    return day !== 0 && day !== 6
  })
}

/**
 * Get array of weekend days between two dates
 */
export function getWeekendsBetween(start: DateInput, end: DateInput): Dayjs[] {
  return getDatesBetween(start, end).filter(date => {
    const day = date.day()
    return day === 0 || day === 6
  })
}

/**
 * Get first day of month
 */
export function firstDayOfMonth(date: DateInput): Dayjs {
  return dayjs(date).startOf('month')
}

/**
 * Get last day of month
 */
export function lastDayOfMonth(date: DateInput): Dayjs {
  return dayjs(date).endOf('month')
}

/**
 * Get number of days in month
 */
export function daysInMonth(date: DateInput): number {
  return dayjs(date).daysInMonth()
}

/**
 * Get the minimum date from an array
 */
export function minDate(dates: DateInput[]): Dayjs | null {
  if (dates.length === 0) return null

  const validDates = dates.map(d => dayjs(d)).filter(d => d.isValid())
  if (validDates.length === 0) return null

  return validDates.reduce((min, d) => (d.isBefore(min) ? d : min))
}

/**
 * Get the maximum date from an array
 */
export function maxDate(dates: DateInput[]): Dayjs | null {
  if (dates.length === 0) return null

  const validDates = dates.map(d => dayjs(d)).filter(d => d.isValid())
  if (validDates.length === 0) return null

  return validDates.reduce((max, d) => (d.isAfter(max) ? d : max))
}

/**
 * Sort dates in ascending order
 */
export function sortDatesAsc(dates: DateInput[]): Dayjs[] {
  return dates
    .map(d => dayjs(d))
    .filter(d => d.isValid())
    .sort((a, b) => a.valueOf() - b.valueOf())
}

/**
 * Sort dates in descending order
 */
export function sortDatesDesc(dates: DateInput[]): Dayjs[] {
  return dates
    .map(d => dayjs(d))
    .filter(d => d.isValid())
    .sort((a, b) => b.valueOf() - a.valueOf())
}

/**
 * Get unique dates (removing duplicates by day)
 */
export function uniqueDates(dates: DateInput[]): Dayjs[] {
  const seen = new Set<string>()
  const result: Dayjs[] = []

  for (const date of dates) {
    const d = dayjs(date)
    if (!d.isValid()) continue

    const key = d.format('YYYY-MM-DD')
    if (!seen.has(key)) {
      seen.add(key)
      result.push(d)
    }
  }

  return result
}

/**
 * Group dates by a time unit
 */
export function groupDatesByUnit(
  dates: DateInput[],
  unit: 'day' | 'week' | 'month' | 'year'
): Map<string, Dayjs[]> {
  const groups = new Map<string, Dayjs[]>()

  for (const date of dates) {
    const d = dayjs(date)
    if (!d.isValid()) continue

    let key: string
    switch (unit) {
      case 'day':
        key = d.format('YYYY-MM-DD')
        break
      case 'week':
        key = `${d.year()}-W${String(d.week()).padStart(2, '0')}`
        break
      case 'month':
        key = d.format('YYYY-MM')
        break
      case 'year':
        key = d.format('YYYY')
        break
    }

    const group = groups.get(key) ?? []
    group.push(d)
    groups.set(key, group)
  }

  return groups
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: DateInput, referenceDate?: DateInput): number {
  const birth = dayjs(birthDate)
  const reference = referenceDate ? dayjs(referenceDate) : dayjs()

  if (!birth.isValid()) return 0

  let age = reference.year() - birth.year()

  if (
    reference.month() < birth.month() ||
    (reference.month() === birth.month() && reference.date() < birth.date())
  ) {
    age--
  }

  return Math.max(0, age)
}

/**
 * Get the next occurrence of a specific weekday
 */
export function nextWeekday(date: DateInput, targetDay: number): Dayjs {
  const d = dayjs(date)
  const currentDay = d.day()
  let daysToAdd = targetDay - currentDay

  if (daysToAdd <= 0) {
    daysToAdd += 7
  }

  return d.add(daysToAdd, 'day')
}

/**
 * Get the previous occurrence of a specific weekday
 */
export function previousWeekday(date: DateInput, targetDay: number): Dayjs {
  const d = dayjs(date)
  const currentDay = d.day()
  let daysToSubtract = currentDay - targetDay

  if (daysToSubtract <= 0) {
    daysToSubtract += 7
  }

  return d.subtract(daysToSubtract, 'day')
}

/**
 * Check if date falls within a range
 */
export function isDateInRange(date: DateInput, range: DateRange): boolean {
  const d = dayjs(date)
  return (d.isAfter(range.start) || d.isSame(range.start, 'day')) &&
         (d.isBefore(range.end) || d.isSame(range.end, 'day'))
}

/**
 * Clamp a date to be within a range
 */
export function clampDate(date: DateInput, min: DateInput, max: DateInput): Dayjs {
  const d = dayjs(date)
  const minDate = dayjs(min)
  const maxDate = dayjs(max)

  if (d.isBefore(minDate)) return minDate
  if (d.isAfter(maxDate)) return maxDate
  return d
}
