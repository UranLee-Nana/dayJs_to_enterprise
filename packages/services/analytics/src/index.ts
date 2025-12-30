import dayjs, { Dayjs, OpUnitType } from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import type { DateRange, DateInput } from '@dayjs-business/core'

// Ensure plugin is loaded
dayjs.extend(quarterOfYear)

export type PresetRangeKey =
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
  | 'last180Days'
  | 'last365Days'
  | 'monthToDate'
  | 'quarterToDate'
  | 'yearToDate'
  | 'weekToDate'

export interface AnalyticsServiceConfig {
  /** Week starts on (0 = Sunday, 1 = Monday) */
  weekStartsOn?: number
  /** Whether to include current day in "last N days" calculations */
  includeToday?: boolean
  /** Custom labels for preset ranges */
  customLabels?: Partial<Record<PresetRangeKey, string>>
  /** Timezone for calculations */
  timezone?: string
}

export interface ComparisonResult {
  current: DateRange
  previous: DateRange
  changeType: 'period' | 'yoy' | 'custom'
}

export interface RangeMetrics {
  totalDays: number
  weekdays: number
  weekends: number
  months: number
  weeks: number
  quarters: number
}

export interface DateBucket {
  start: Dayjs
  end: Dayjs
  label: string
  index: number
}

/**
 * AnalyticsRangeService - Analytics-focused date range management
 * Provides preset ranges, comparisons, and bucketing for data analysis
 */
export class AnalyticsRangeService {
  private readonly config: Required<AnalyticsServiceConfig>
  private readonly defaultLabels: Record<PresetRangeKey, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    lastWeek: 'Last Week',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    thisQuarter: 'This Quarter',
    lastQuarter: 'Last Quarter',
    thisYear: 'This Year',
    lastYear: 'Last Year',
    last7Days: 'Last 7 Days',
    last14Days: 'Last 14 Days',
    last30Days: 'Last 30 Days',
    last60Days: 'Last 60 Days',
    last90Days: 'Last 90 Days',
    last180Days: 'Last 180 Days',
    last365Days: 'Last 365 Days',
    monthToDate: 'Month to Date',
    quarterToDate: 'Quarter to Date',
    yearToDate: 'Year to Date',
    weekToDate: 'Week to Date'
  }

  constructor(config: AnalyticsServiceConfig = {}) {
    this.config = {
      weekStartsOn: config.weekStartsOn ?? 1,
      includeToday: config.includeToday ?? true,
      customLabels: config.customLabels ?? {},
      timezone: config.timezone ?? 'UTC'
    }
  }

  /**
   * Get label for a preset range
   */
  private getLabel(key: PresetRangeKey): string {
    return this.config.customLabels[key] ?? this.defaultLabels[key]
  }

  /**
   * Get start of week based on configuration
   */
  private getWeekStart(date: Dayjs): Dayjs {
    const currentDay = date.day()
    const diff = (currentDay - this.config.weekStartsOn + 7) % 7
    return date.subtract(diff, 'day').startOf('day')
  }

  /**
   * Get end of week based on configuration
   */
  private getWeekEnd(date: Dayjs): Dayjs {
    return this.getWeekStart(date).add(6, 'day').endOf('day')
  }

  /**
   * Create date range object
   */
  private createRange(start: Dayjs, end: Dayjs, label: string): DateRange {
    return {
      start: start.startOf('day'),
      end: end.endOf('day'),
      label
    }
  }

  /**
   * Get a preset date range
   */
  getPresetRange(preset: PresetRangeKey, referenceDate?: DateInput): DateRange {
    const today = referenceDate ? dayjs(referenceDate).startOf('day') : dayjs().startOf('day')
    const includeToday = this.config.includeToday

    switch (preset) {
      case 'today':
        return this.createRange(today, today, this.getLabel('today'))

      case 'yesterday': {
        const yesterday = today.subtract(1, 'day')
        return this.createRange(yesterday, yesterday, this.getLabel('yesterday'))
      }

      case 'thisWeek':
        return this.createRange(
          this.getWeekStart(today),
          this.getWeekEnd(today),
          this.getLabel('thisWeek')
        )

      case 'lastWeek': {
        const lastWeekEnd = this.getWeekStart(today).subtract(1, 'day')
        return this.createRange(
          this.getWeekStart(lastWeekEnd),
          lastWeekEnd,
          this.getLabel('lastWeek')
        )
      }

      case 'thisMonth':
        return this.createRange(
          today.startOf('month'),
          today.endOf('month'),
          this.getLabel('thisMonth')
        )

      case 'lastMonth': {
        const lastMonth = today.subtract(1, 'month')
        return this.createRange(
          lastMonth.startOf('month'),
          lastMonth.endOf('month'),
          this.getLabel('lastMonth')
        )
      }

      case 'thisQuarter':
        return this.createRange(
          today.startOf('quarter'),
          today.endOf('quarter'),
          this.getLabel('thisQuarter')
        )

      case 'lastQuarter': {
        const lastQuarter = today.subtract(3, 'month')
        return this.createRange(
          lastQuarter.startOf('quarter'),
          lastQuarter.endOf('quarter'),
          this.getLabel('lastQuarter')
        )
      }

      case 'thisYear':
        return this.createRange(
          today.startOf('year'),
          today.endOf('year'),
          this.getLabel('thisYear')
        )

      case 'lastYear': {
        const lastYear = today.subtract(1, 'year')
        return this.createRange(
          lastYear.startOf('year'),
          lastYear.endOf('year'),
          this.getLabel('lastYear')
        )
      }

      case 'last7Days': {
        const end = includeToday ? today : today.subtract(1, 'day')
        return this.createRange(end.subtract(6, 'day'), end, this.getLabel('last7Days'))
      }

      case 'last14Days': {
        const end = includeToday ? today : today.subtract(1, 'day')
        return this.createRange(end.subtract(13, 'day'), end, this.getLabel('last14Days'))
      }

      case 'last30Days': {
        const end = includeToday ? today : today.subtract(1, 'day')
        return this.createRange(end.subtract(29, 'day'), end, this.getLabel('last30Days'))
      }

      case 'last60Days': {
        const end = includeToday ? today : today.subtract(1, 'day')
        return this.createRange(end.subtract(59, 'day'), end, this.getLabel('last60Days'))
      }

      case 'last90Days': {
        const end = includeToday ? today : today.subtract(1, 'day')
        return this.createRange(end.subtract(89, 'day'), end, this.getLabel('last90Days'))
      }

      case 'last180Days': {
        const end = includeToday ? today : today.subtract(1, 'day')
        return this.createRange(end.subtract(179, 'day'), end, this.getLabel('last180Days'))
      }

      case 'last365Days': {
        const end = includeToday ? today : today.subtract(1, 'day')
        return this.createRange(end.subtract(364, 'day'), end, this.getLabel('last365Days'))
      }

      case 'monthToDate':
        return this.createRange(today.startOf('month'), today, this.getLabel('monthToDate'))

      case 'quarterToDate':
        return this.createRange(today.startOf('quarter'), today, this.getLabel('quarterToDate'))

      case 'yearToDate':
        return this.createRange(today.startOf('year'), today, this.getLabel('yearToDate'))

      case 'weekToDate':
        return this.createRange(this.getWeekStart(today), today, this.getLabel('weekToDate'))

      default:
        throw new Error(`Unknown preset range: ${preset}`)
    }
  }

  /**
   * Get multiple preset ranges at once
   */
  getMultiplePresets(presets: PresetRangeKey[], referenceDate?: DateInput): DateRange[] {
    return presets.map(preset => this.getPresetRange(preset, referenceDate))
  }

  /**
   * Create a custom date range
   */
  createCustomRange(start: DateInput, end: DateInput, label = 'Custom Range'): DateRange {
    return this.createRange(dayjs(start), dayjs(end), label)
  }

  /**
   * Create range from relative days
   */
  createRelativeRange(days: number, referenceDate?: DateInput): DateRange {
    const ref = referenceDate ? dayjs(referenceDate) : dayjs()
    const end = this.config.includeToday ? ref : ref.subtract(1, 'day')
    const start = end.subtract(days - 1, 'day')
    return this.createRange(start, end, `Last ${days} Days`)
  }

  /**
   * Get previous period comparison range
   */
  getPreviousPeriod(range: DateRange): ComparisonResult {
    const duration = range.end.diff(range.start, 'day') + 1
    const previousEnd = range.start.subtract(1, 'day')
    const previousStart = previousEnd.subtract(duration - 1, 'day')

    return {
      current: range,
      previous: this.createRange(previousStart, previousEnd, 'Previous Period'),
      changeType: 'period'
    }
  }

  /**
   * Get year-over-year comparison range
   */
  getYearOverYear(range: DateRange): ComparisonResult {
    const previousStart = range.start.subtract(1, 'year')
    const previousEnd = range.end.subtract(1, 'year')

    return {
      current: range,
      previous: this.createRange(previousStart, previousEnd, 'Year Over Year'),
      changeType: 'yoy'
    }
  }

  /**
   * Get custom comparison range
   */
  getCustomComparison(
    currentRange: DateRange,
    comparisonStart: DateInput,
    comparisonEnd: DateInput
  ): ComparisonResult {
    return {
      current: currentRange,
      previous: this.createRange(dayjs(comparisonStart), dayjs(comparisonEnd), 'Custom Comparison'),
      changeType: 'custom'
    }
  }

  /**
   * Split range into buckets
   */
  splitIntoBuckets(range: DateRange, unit: OpUnitType): DateBucket[] {
    const buckets: DateBucket[] = []
    let current = range.start
    let index = 0

    while (current.isBefore(range.end) || current.isSame(range.end, 'day')) {
      const bucketEnd = current.endOf(unit)
      const actualEnd = bucketEnd.isAfter(range.end) ? range.end : bucketEnd

      buckets.push({
        start: current,
        end: actualEnd,
        label: this.getBucketLabel(current, unit),
        index
      })

      current = bucketEnd.add(1, 'day').startOf('day')
      index++
    }

    return buckets
  }

  /**
   * Generate bucket label based on unit
   */
  private getBucketLabel(date: Dayjs, unit: OpUnitType): string {
    switch (unit) {
      case 'day':
        return date.format('MMM D')
      case 'week':
        return `Week ${date.week()}`
      case 'month':
        return date.format('MMM YYYY')
      case 'quarter':
        return `Q${date.quarter()} ${date.year()}`
      case 'year':
        return date.format('YYYY')
      default:
        return date.format('YYYY-MM-DD')
    }
  }

  /**
   * Calculate range metrics
   */
  getRangeMetrics(range: DateRange): RangeMetrics {
    const totalDays = range.end.diff(range.start, 'day') + 1
    let weekdays = 0
    let weekends = 0

    let current = range.start
    while (current.isBefore(range.end) || current.isSame(range.end, 'day')) {
      const dayOfWeek = current.day()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekends++
      } else {
        weekdays++
      }
      current = current.add(1, 'day')
    }

    return {
      totalDays,
      weekdays,
      weekends,
      months: range.end.diff(range.start, 'month') + 1,
      weeks: Math.ceil(totalDays / 7),
      quarters: Math.ceil(range.end.diff(range.start, 'month') / 3) + 1
    }
  }

  /**
   * Check if a date is within a range
   */
  isDateInRange(date: DateInput, range: DateRange): boolean {
    const d = dayjs(date)
    return (d.isAfter(range.start) || d.isSame(range.start, 'day')) &&
           (d.isBefore(range.end) || d.isSame(range.end, 'day'))
  }

  /**
   * Check if two ranges overlap
   */
  rangesOverlap(range1: DateRange, range2: DateRange): boolean {
    return range1.start.isBefore(range2.end) && range1.end.isAfter(range2.start)
  }

  /**
   * Merge multiple ranges into one
   */
  mergeRanges(ranges: DateRange[]): DateRange {
    if (ranges.length === 0) {
      throw new Error('Cannot merge empty ranges array')
    }

    const sorted = [...ranges].sort((a, b) => a.start.valueOf() - b.start.valueOf())
    const start = sorted[0]!.start
    const end = sorted.reduce((max, r) => (r.end.isAfter(max) ? r.end : max), sorted[0]!.end)

    return this.createRange(start, end, 'Merged Range')
  }

  /**
   * Get all available preset keys
   */
  getAvailablePresets(): PresetRangeKey[] {
    return Object.keys(this.defaultLabels) as PresetRangeKey[]
  }

  /**
   * Get common analytics presets grouped by category
   */
  getPresetsByCategory(): Record<string, PresetRangeKey[]> {
    return {
      relative: ['today', 'yesterday', 'last7Days', 'last14Days', 'last30Days', 'last90Days'],
      calendar: ['thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'thisQuarter', 'lastQuarter'],
      toDate: ['weekToDate', 'monthToDate', 'quarterToDate', 'yearToDate'],
      yearly: ['thisYear', 'lastYear', 'last365Days']
    }
  }

  /**
   * Update configuration
   */
  configure(updates: Partial<AnalyticsServiceConfig>): void {
    Object.assign(this.config, updates)
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<AnalyticsServiceConfig>> {
    return Object.freeze({ ...this.config })
  }
}

/**
 * Create a pre-configured analytics range service
 */
export function createAnalyticsService(config?: AnalyticsServiceConfig): AnalyticsRangeService {
  return new AnalyticsRangeService(config)
}

/**
 * Quick access to common presets
 */
export const QuickRanges = {
  TODAY: 'today' as const,
  YESTERDAY: 'yesterday' as const,
  LAST_7_DAYS: 'last7Days' as const,
  LAST_30_DAYS: 'last30Days' as const,
  THIS_MONTH: 'thisMonth' as const,
  LAST_MONTH: 'lastMonth' as const,
  THIS_QUARTER: 'thisQuarter' as const,
  THIS_YEAR: 'thisYear' as const,
  YEAR_TO_DATE: 'yearToDate' as const
}

export default AnalyticsRangeService
