import type { PluginFunc, Dayjs } from 'dayjs'
import type { Holiday, BusinessRules } from '@dayjs-business/core'

export interface BusinessDayConfig {
  workdays?: number[]
  holidays?: Holiday[]
}

export interface BusinessDayMethods {
  isBusinessDay(): boolean
  nextBusinessDay(): Dayjs
  prevBusinessDay(): Dayjs
  addBusinessDays(days: number): Dayjs
  subtractBusinessDays(days: number): Dayjs
  businessDaysBetween(other: Dayjs): number
  getBusinessDaysInMonth(): Dayjs[]
  isHoliday(): boolean
  getHolidayInfo(): Holiday | null
}

declare module 'dayjs' {
  interface Dayjs extends BusinessDayMethods {}
}

const DEFAULT_WORKDAYS = [1, 2, 3, 4, 5] // Monday to Friday

/**
 * Business Day Plugin for dayjs-business
 * Provides comprehensive business day calculations with holiday support
 */
export const businessDayPlugin: PluginFunc<BusinessDayConfig> = (
  option,
  dayjsClass,
  _dayjsFactory
) => {
  const config: BusinessDayConfig = {
    workdays: option?.workdays ?? DEFAULT_WORKDAYS,
    holidays: option?.holidays ?? []
  }

  /**
   * Check if a date is a workday (not considering holidays)
   */
  const isWorkday = (date: Dayjs): boolean => {
    const dayOfWeek = date.day()
    return (config.workdays ?? DEFAULT_WORKDAYS).includes(dayOfWeek)
  }

  /**
   * Check if a date is a holiday
   */
  const findHoliday = (date: Dayjs): Holiday | null => {
    const dateStr = date.format('YYYY-MM-DD')
    const holidays = config.holidays ?? []

    for (const holiday of holidays) {
      // Exact date match
      if (holiday.date === dateStr) {
        return holiday
      }

      // Recurring holiday check (same month and day)
      if (holiday.recurring) {
        const holidayMonth = parseInt(holiday.date.substring(5, 7), 10) - 1
        const holidayDay = parseInt(holiday.date.substring(8, 10), 10)
        if (date.month() === holidayMonth && date.date() === holidayDay) {
          return holiday
        }
      }
    }

    return null
  }

  /**
   * Check if a date is a business day (workday and not a holiday)
   */
  dayjsClass.prototype.isBusinessDay = function (this: Dayjs): boolean {
    return isWorkday(this) && findHoliday(this) === null
  }

  /**
   * Check if a date is a holiday
   */
  dayjsClass.prototype.isHoliday = function (this: Dayjs): boolean {
    return findHoliday(this) !== null
  }

  /**
   * Get holiday information for the date
   */
  dayjsClass.prototype.getHolidayInfo = function (this: Dayjs): Holiday | null {
    return findHoliday(this)
  }

  /**
   * Get the next business day
   */
  dayjsClass.prototype.nextBusinessDay = function (this: Dayjs): Dayjs {
    let next = this.add(1, 'day')
    while (!next.isBusinessDay()) {
      next = next.add(1, 'day')
    }
    return next
  }

  /**
   * Get the previous business day
   */
  dayjsClass.prototype.prevBusinessDay = function (this: Dayjs): Dayjs {
    let prev = this.subtract(1, 'day')
    while (!prev.isBusinessDay()) {
      prev = prev.subtract(1, 'day')
    }
    return prev
  }

  /**
   * Add business days to the date
   */
  dayjsClass.prototype.addBusinessDays = function (this: Dayjs, days: number): Dayjs {
    if (days === 0) {
      return this
    }

    const direction = days > 0 ? 1 : -1
    let remaining = Math.abs(days)
    let current = this.clone()

    while (remaining > 0) {
      current = current.add(direction, 'day')
      if (current.isBusinessDay()) {
        remaining--
      }
    }

    return current
  }

  /**
   * Subtract business days from the date
   */
  dayjsClass.prototype.subtractBusinessDays = function (this: Dayjs, days: number): Dayjs {
    return this.addBusinessDays(-days)
  }

  /**
   * Calculate business days between two dates
   */
  dayjsClass.prototype.businessDaysBetween = function (this: Dayjs, other: Dayjs): number {
    const start = this.isBefore(other) ? this : other
    const end = this.isBefore(other) ? other : this

    let count = 0
    let current = start.clone()

    while (current.isBefore(end, 'day')) {
      current = current.add(1, 'day')
      if (current.isBusinessDay()) {
        count++
      }
    }

    return this.isBefore(other) ? count : -count
  }

  /**
   * Get all business days in the month
   */
  dayjsClass.prototype.getBusinessDaysInMonth = function (this: Dayjs): Dayjs[] {
    const businessDays: Dayjs[] = []
    const startOfMonth = this.startOf('month')
    const endOfMonth = this.endOf('month')

    let current = startOfMonth

    while (current.isBefore(endOfMonth) || current.isSame(endOfMonth, 'day')) {
      if (current.isBusinessDay()) {
        businessDays.push(current.clone())
      }
      current = current.add(1, 'day')
    }

    return businessDays
  }
}

/**
 * Create a business day plugin with custom configuration
 */
export function createBusinessDayPlugin(config?: BusinessDayConfig): PluginFunc {
  return (option, dayjsClass, dayjsFactory) => {
    businessDayPlugin({ ...option, ...config }, dayjsClass, dayjsFactory)
  }
}

/**
 * Update holidays at runtime
 */
export function updateHolidays(holidays: Holiday[]): void {
  // This function can be used to update holidays dynamically
  // Implementation depends on how the plugin is initialized
}

/**
 * Utility function to check if a date range contains any business days
 */
export function hasBusinessDaysInRange(
  start: Dayjs,
  end: Dayjs,
  config?: BusinessDayConfig
): boolean {
  const workdays = config?.workdays ?? DEFAULT_WORKDAYS
  const holidays = config?.holidays ?? []

  let current = start.clone()

  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const dayOfWeek = current.day()
    const dateStr = current.format('YYYY-MM-DD')

    const isWorkday = workdays.includes(dayOfWeek)
    const isHoliday = holidays.some(h => h.date === dateStr)

    if (isWorkday && !isHoliday) {
      return true
    }

    current = current.add(1, 'day')
  }

  return false
}

/**
 * Count business days in a date range
 */
export function countBusinessDaysInRange(
  start: Dayjs,
  end: Dayjs,
  config?: BusinessDayConfig
): number {
  const workdays = config?.workdays ?? DEFAULT_WORKDAYS
  const holidays = config?.holidays ?? []

  let count = 0
  let current = start.clone()

  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const dayOfWeek = current.day()
    const dateStr = current.format('YYYY-MM-DD')

    const isWorkday = workdays.includes(dayOfWeek)
    const isHoliday = holidays.some(h => h.date === dateStr)

    if (isWorkday && !isHoliday) {
      count++
    }

    current = current.add(1, 'day')
  }

  return count
}

export default businessDayPlugin
