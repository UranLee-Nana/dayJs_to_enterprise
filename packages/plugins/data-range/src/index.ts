import type { PluginFunc, Dayjs, OpUnitType, QUnitType } from 'dayjs'
import type { DateRange } from '@dayjs-business/core'

// Combined unit type that includes both OpUnitType and QUnitType (for quarter support)
type UnitType = OpUnitType | QUnitType

export type RangePreset =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'last7Days'
  | 'last14Days'
  | 'last30Days'
  | 'last60Days'
  | 'last90Days'
  | 'last365Days'
  | 'monthToDate'
  | 'quarterToDate'
  | 'yearToDate'
  | 'allTime'

export interface DataRangeConfig {
  /** Week starts on (0 = Sunday, 1 = Monday, etc.) */
  weekStartsOn?: number
  /** Include current day in "last N days" ranges */
  includeToday?: boolean
  /** Custom presets */
  customPresets?: Record<string, (date: Dayjs) => DateRange>
}

export interface DataRangeMethods {
  range(preset: RangePreset): DateRange
  customRange(start: Dayjs, end: Dayjs, label?: string): DateRange
  rangeFromDays(days: number): DateRange
  rangeFromWeeks(weeks: number): DateRange
  rangeFromMonths(months: number): DateRange
  comparePreviousPeriod(range: DateRange): DateRange
  compareYearOverYear(range: DateRange): DateRange
  splitRange(range: DateRange, unit: UnitType): DateRange[]
  isInRange(range: DateRange): boolean
  overlapsRange(range: DateRange, other: DateRange): boolean
}

declare module 'dayjs' {
  interface Dayjs extends DataRangeMethods { }
}

/**
 * Data Range Plugin for dayjs-business
 * Provides dynamic date range generation for analytics and reporting
 */
export const dataRangePlugin: PluginFunc<DataRangeConfig> = (
  option,
  dayjsClass,
  _dayjsFactory
) => {
  const config: DataRangeConfig = {
    weekStartsOn: option?.weekStartsOn ?? 1, // Monday default
    includeToday: option?.includeToday ?? true,
    customPresets: option?.customPresets ?? {}
  }

  /**
   * Get start of week based on configuration
   */
  const getWeekStart = (date: Dayjs): Dayjs => {
    const weekStartsOn = config.weekStartsOn ?? 1
    const currentDay = date.day()
    const diff = (currentDay - weekStartsOn + 7) % 7
    return date.subtract(diff, 'day').startOf('day')
  }

  /**
   * Get end of week based on configuration
   */
  const getWeekEnd = (date: Dayjs): Dayjs => {
    const weekStart = getWeekStart(date)
    return weekStart.add(6, 'day').endOf('day')
  }

  /**
   * Create a date range object
   */
  const createRange = (start: Dayjs, end: Dayjs, label?: string): DateRange => ({
    start: start.startOf('day'),
    end: end.endOf('day'),
    label
  })

  /**
   * Get preset date range
   */
  dayjsClass.prototype.range = function (this: Dayjs, preset: RangePreset): DateRange {
    // Check custom presets first
    const customPreset = config.customPresets?.[preset]
    if (customPreset) {
      return customPreset(this)
    }

    const today = this.startOf('day')
    const includeToday = config.includeToday ?? true

    switch (preset) {
      case 'today':
        return createRange(today, today, 'Today')

      case 'yesterday':
        const yesterday = today.subtract(1, 'day')
        return createRange(yesterday, yesterday, 'Yesterday')

      case 'thisWeek':
        return createRange(getWeekStart(today), getWeekEnd(today), 'This Week')

      case 'lastWeek':
        const lastWeekEnd = getWeekStart(today).subtract(1, 'day')
        const lastWeekStart = getWeekStart(lastWeekEnd)
        return createRange(lastWeekStart, lastWeekEnd, 'Last Week')

      case 'thisMonth':
        return createRange(today.startOf('month'), today.endOf('month'), 'This Month')

      case 'lastMonth':
        const lastMonth = today.subtract(1, 'month')
        return createRange(lastMonth.startOf('month'), lastMonth.endOf('month'), 'Last Month')

      case 'thisQuarter':
        return createRange(today.startOf('quarter' as any), today.endOf('quarter' as any), 'This Quarter')

      case 'lastQuarter':
        const lastQuarter = today.subtract(3, 'month')
        return createRange(
          lastQuarter.startOf('quarter' as any),
          lastQuarter.endOf('quarter' as any),
          'Last Quarter'
        )

      case 'thisYear':
        return createRange(today.startOf('year'), today.endOf('year'), 'This Year')

      case 'lastYear':
        const lastYear = today.subtract(1, 'year')
        return createRange(lastYear.startOf('year'), lastYear.endOf('year'), 'Last Year')

      case 'last7Days': {
        const end = includeToday ? today : today.subtract(1, 'day')
        const start = end.subtract(6, 'day')
        return createRange(start, end, 'Last 7 Days')
      }

      case 'last14Days': {
        const end = includeToday ? today : today.subtract(1, 'day')
        const start = end.subtract(13, 'day')
        return createRange(start, end, 'Last 14 Days')
      }

      case 'last30Days': {
        const end = includeToday ? today : today.subtract(1, 'day')
        const start = end.subtract(29, 'day')
        return createRange(start, end, 'Last 30 Days')
      }

      case 'last60Days': {
        const end = includeToday ? today : today.subtract(1, 'day')
        const start = end.subtract(59, 'day')
        return createRange(start, end, 'Last 60 Days')
      }

      case 'last90Days': {
        const end = includeToday ? today : today.subtract(1, 'day')
        const start = end.subtract(89, 'day')
        return createRange(start, end, 'Last 90 Days')
      }

      case 'last365Days': {
        const end = includeToday ? today : today.subtract(1, 'day')
        const start = end.subtract(364, 'day')
        return createRange(start, end, 'Last 365 Days')
      }

      case 'monthToDate':
        return createRange(today.startOf('month'), today, 'Month to Date')

      case 'quarterToDate':
        return createRange(today.startOf('quarter' as any), today, 'Quarter to Date')

      case 'yearToDate':
        return createRange(today.startOf('year'), today, 'Year to Date')

      case 'allTime':
        // Returns a very large range - in practice, filter to actual data
        return createRange(today.subtract(100, 'year'), today, 'All Time')

      default:
        throw new Error(`Unknown range preset: ${preset}`)
    }
  }

  /**
   * Create custom date range
   */
  dayjsClass.prototype.customRange = function (
    this: Dayjs,
    start: Dayjs,
    end: Dayjs,
    label?: string
  ): DateRange {
    return createRange(start, end, label ?? 'Custom Range')
  }

  /**
   * Create range for last N days
   */
  dayjsClass.prototype.rangeFromDays = function (this: Dayjs, days: number): DateRange {
    const includeToday = config.includeToday ?? true
    const end = includeToday ? this : this.subtract(1, 'day')
    const start = end.subtract(days - 1, 'day')
    return createRange(start, end, `Last ${days} Days`)
  }

  /**
   * Create range for last N weeks
   */
  dayjsClass.prototype.rangeFromWeeks = function (this: Dayjs, weeks: number): DateRange {
    const end = getWeekEnd(this)
    const start = getWeekStart(this).subtract(weeks - 1, 'week')
    return createRange(start, end, `Last ${weeks} Weeks`)
  }

  /**
   * Create range for last N months
   */
  dayjsClass.prototype.rangeFromMonths = function (this: Dayjs, months: number): DateRange {
    const end = this.endOf('month')
    const start = this.subtract(months - 1, 'month').startOf('month')
    return createRange(start, end, `Last ${months} Months`)
  }

  /**
   * Get previous period for comparison
   */
  dayjsClass.prototype.comparePreviousPeriod = function (this: Dayjs, range: DateRange): DateRange {
    const duration = range.end.diff(range.start, 'day') + 1
    const newEnd = range.start.subtract(1, 'day')
    const newStart = newEnd.subtract(duration - 1, 'day')
    return createRange(newStart, newEnd, 'Previous Period')
  }

  /**
   * Get year-over-year comparison range
   */
  dayjsClass.prototype.compareYearOverYear = function (this: Dayjs, range: DateRange): DateRange {
    const newStart = range.start.subtract(1, 'year')
    const newEnd = range.end.subtract(1, 'year')
    return createRange(newStart, newEnd, 'Year Over Year')
  }

  /**
   * Split range into smaller ranges by unit
   */
  dayjsClass.prototype.splitRange = function (
    this: Dayjs,
    range: DateRange,
    unit: UnitType
  ): DateRange[] {
    const ranges: DateRange[] = []
    let current = range.start

    while (current.isBefore(range.end) || current.isSame(range.end, 'day')) {
      const periodEnd = current.endOf(unit as any)
      const actualEnd = periodEnd.isAfter(range.end) ? range.end : periodEnd
      ranges.push(createRange(current, actualEnd))
      current = periodEnd.add(1, 'day').startOf('day')
    }

    return ranges
  }

  /**
   * Check if current date is within range
   */
  dayjsClass.prototype.isInRange = function (this: Dayjs, range: DateRange): boolean {
    return (
      (this.isAfter(range.start) || this.isSame(range.start, 'day')) &&
      (this.isBefore(range.end) || this.isSame(range.end, 'day'))
    )
  }

  /**
   * Check if two ranges overlap
   */
  dayjsClass.prototype.overlapsRange = function (
    this: Dayjs,
    range: DateRange,
    other: DateRange
  ): boolean {
    return (
      range.start.isBefore(other.end) &&
      range.end.isAfter(other.start)
    )
  }
}

/**
 * Create data range plugin with custom configuration
 */
export function createDataRangePlugin(config: DataRangeConfig): PluginFunc {
  return (option, dayjsClass, dayjsFactory) => {
    dataRangePlugin({ ...config, ...(option || {}) }, dayjsClass, dayjsFactory)
  }
}

/**
 * Pre-defined range presets for common analytics scenarios
 */
export const AnalyticsPresets = {
  /** Web analytics common ranges */
  WEB_ANALYTICS: ['today', 'yesterday', 'last7Days', 'last30Days', 'thisMonth', 'lastMonth'] as const,

  /** Sales reporting ranges */
  SALES: ['today', 'thisWeek', 'thisMonth', 'thisQuarter', 'monthToDate', 'quarterToDate', 'yearToDate'] as const,

  /** Marketing campaign ranges */
  MARKETING: ['last7Days', 'last14Days', 'last30Days', 'last90Days', 'thisQuarter', 'lastQuarter'] as const,

  /** Financial reporting ranges */
  FINANCIAL: ['thisMonth', 'lastMonth', 'thisQuarter', 'lastQuarter', 'thisYear', 'lastYear'] as const
}

/**
 * Get multiple ranges at once
 */
export function getMultipleRanges(date: Dayjs, presets: readonly RangePreset[]): DateRange[] {
  return presets.map(preset => date.range(preset))
}

/**
 * Calculate range statistics
 */
export function getRangeStats(range: DateRange): {
  days: number
  weeks: number
  months: number
} {
  const days = range.end.diff(range.start, 'day') + 1
  return {
    days,
    weeks: Math.ceil(days / 7),
    months: range.end.diff(range.start, 'month') + 1
  }
}

/**
 * Merge overlapping or adjacent ranges
 */
export function mergeRanges(ranges: DateRange[]): DateRange[] {
  if (ranges.length === 0) return []

  // Sort by start date
  const sorted = [...ranges].sort((a, b) => a.start.valueOf() - b.start.valueOf())

  const merged: DateRange[] = [sorted[0]!]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]!
    const last = merged[merged.length - 1]!

    // Check if ranges overlap or are adjacent
    if (current.start.isBefore(last.end.add(2, 'day'))) {
      // Merge ranges
      merged[merged.length - 1] = {
        start: last.start,
        end: current.end.isAfter(last.end) ? current.end : last.end,
        label: 'Merged Range'
      }
    } else {
      merged.push(current)
    }
  }

  return merged
}

/**
 * Find gaps between ranges
 */
export function findRangeGaps(ranges: DateRange[]): DateRange[] {
  if (ranges.length < 2) return []

  const sorted = [...ranges].sort((a, b) => a.start.valueOf() - b.start.valueOf())
  const gaps: DateRange[] = []

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!
    const current = sorted[i]!

    if (current.start.isAfter(prev.end.add(1, 'day'))) {
      gaps.push({
        start: prev.end.add(1, 'day'),
        end: current.start.subtract(1, 'day'),
        label: 'Gap'
      })
    }
  }

  return gaps
}

export default dataRangePlugin
