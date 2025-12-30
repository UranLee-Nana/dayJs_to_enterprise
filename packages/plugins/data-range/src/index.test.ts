import { describe, it, expect, beforeEach } from 'vitest'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import {
  dataRangePlugin,
  createDataRangePlugin,
  AnalyticsPresets,
  getMultipleRanges,
  getRangeStats,
  mergeRanges,
  findRangeGaps
} from './index'
import type { DataRangeConfig } from './index'

// Extend dayjs with required plugins
dayjs.extend(quarterOfYear)
dayjs.extend(dataRangePlugin)

describe('dataRangePlugin', () => {
  describe('range() - basic presets', () => {
    it('should return today range', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('today')

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-15')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-15')
      expect(range.label).toBe('Today')
    })

    it('should return yesterday range', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('yesterday')

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-14')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-14')
      expect(range.label).toBe('Yesterday')
    })

    it('should return this week range (Monday start)', () => {
      const date = dayjs('2024-01-17') // Wednesday
      const range = date.range('thisWeek')

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-15') // Monday
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-21') // Sunday
      expect(range.label).toBe('This Week')
    })

    it('should return last week range', () => {
      const date = dayjs('2024-01-17') // Wednesday
      const range = date.range('lastWeek')

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-08') // Previous Monday
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-14') // Previous Sunday
      expect(range.label).toBe('Last Week')
    })

    it('should return this month range', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('thisMonth')

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-01')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-31')
      expect(range.label).toBe('This Month')
    })

    it('should return last month range', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('lastMonth')

      expect(range.start.format('YYYY-MM-DD')).toBe('2023-12-01')
      expect(range.end.format('YYYY-MM-DD')).toBe('2023-12-31')
      expect(range.label).toBe('Last Month')
    })

    it('should return this quarter range', () => {
      const date = dayjs('2024-02-15')
      const range = date.range('thisQuarter')

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-01')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-03-31')
      expect(range.label).toBe('This Quarter')
    })

    it('should return last quarter range', () => {
      const date = dayjs('2024-02-15')
      const range = date.range('lastQuarter')

      expect(range.start.format('YYYY-MM-DD')).toBe('2023-10-01')
      expect(range.end.format('YYYY-MM-DD')).toBe('2023-12-31')
      expect(range.label).toBe('Last Quarter')
    })

    it('should return this year range', () => {
      const date = dayjs('2024-06-15')
      const range = date.range('thisYear')

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-01')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-12-31')
      expect(range.label).toBe('This Year')
    })

    it('should return last year range', () => {
      const date = dayjs('2024-06-15')
      const range = date.range('lastYear')

      expect(range.start.format('YYYY-MM-DD')).toBe('2023-01-01')
      expect(range.end.format('YYYY-MM-DD')).toBe('2023-12-31')
      expect(range.label).toBe('Last Year')
    })
  })

  describe('range() - last N days presets', () => {
    it('should return last 7 days (including today)', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('last7Days')

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-09')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-15')
      expect(range.label).toBe('Last 7 Days')
    })

    it('should return last 14 days', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('last14Days')

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-02')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-15')
    })

    it('should return last 30 days', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('last30Days')

      expect(range.start.format('YYYY-MM-DD')).toBe('2023-12-17')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-15')
    })

    it('should return last 60 days', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('last60Days')

      expect(range.start.format('YYYY-MM-DD')).toBe('2023-11-17')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-15')
    })

    it('should return last 90 days', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('last90Days')

      expect(range.start.format('YYYY-MM-DD')).toBe('2023-10-18')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-15')
    })

    it('should return last 365 days', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('last365Days')

      expect(range.start.format('YYYY-MM-DD')).toBe('2023-01-16')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-15')
    })
  })

  describe('range() - to date presets', () => {
    it('should return month to date', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('monthToDate')

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-01')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-15')
      expect(range.label).toBe('Month to Date')
    })

    it('should return quarter to date', () => {
      const date = dayjs('2024-02-15')
      const range = date.range('quarterToDate')

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-01')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-02-15')
      expect(range.label).toBe('Quarter to Date')
    })

    it('should return year to date', () => {
      const date = dayjs('2024-06-15')
      const range = date.range('yearToDate')

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-01')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-06-15')
      expect(range.label).toBe('Year to Date')
    })

    it('should return all time range', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('allTime')

      expect(range.label).toBe('All Time')
      expect(range.start.isBefore(range.end)).toBe(true)
    })
  })

  describe('customRange()', () => {
    it('should create custom range', () => {
      const date = dayjs('2024-01-15')
      const start = dayjs('2024-01-01')
      const end = dayjs('2024-01-10')
      const range = date.customRange(start, end, 'Custom Period')

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-01')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-10')
      expect(range.label).toBe('Custom Period')
    })

    it('should use default label when not provided', () => {
      const date = dayjs('2024-01-15')
      const start = dayjs('2024-01-01')
      const end = dayjs('2024-01-10')
      const range = date.customRange(start, end)

      expect(range.label).toBe('Custom Range')
    })
  })

  describe('rangeFromDays()', () => {
    it('should create range for last N days', () => {
      const date = dayjs('2024-01-15')
      const range = date.rangeFromDays(7)

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-09')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-15')
      expect(range.label).toBe('Last 7 Days')
    })

    it('should create range for 30 days', () => {
      const date = dayjs('2024-01-15')
      const range = date.rangeFromDays(30)

      expect(range.start.format('YYYY-MM-DD')).toBe('2023-12-17')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-15')
    })
  })

  describe('rangeFromWeeks()', () => {
    it('should create range for last N weeks', () => {
      const date = dayjs('2024-01-17') // Wednesday
      const range = date.rangeFromWeeks(2)

      expect(range.label).toBe('Last 2 Weeks')
      // Should end on Sunday of current week
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-21')
    })

    it('should create range for 4 weeks', () => {
      const date = dayjs('2024-01-17')
      const range = date.rangeFromWeeks(4)

      expect(range.label).toBe('Last 4 Weeks')
    })
  })

  describe('rangeFromMonths()', () => {
    it('should create range for last N months', () => {
      const date = dayjs('2024-03-15')
      const range = date.rangeFromMonths(3)

      expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-01')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-03-31')
      expect(range.label).toBe('Last 3 Months')
    })

    it('should create range for 12 months', () => {
      const date = dayjs('2024-03-15')
      const range = date.rangeFromMonths(12)

      expect(range.start.format('YYYY-MM-DD')).toBe('2023-04-01')
      expect(range.end.format('YYYY-MM-DD')).toBe('2024-03-31')
    })
  })

  describe('comparePreviousPeriod()', () => {
    it('should get previous period for comparison', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('last7Days')
      const previous = date.comparePreviousPeriod(range)

      expect(previous.label).toBe('Previous Period')
      expect(previous.start.format('YYYY-MM-DD')).toBe('2024-01-02')
      expect(previous.end.format('YYYY-MM-DD')).toBe('2024-01-08')
    })

    it('should handle single day range', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('today')
      const previous = date.comparePreviousPeriod(range)

      expect(previous.start.format('YYYY-MM-DD')).toBe('2024-01-14')
      expect(previous.end.format('YYYY-MM-DD')).toBe('2024-01-14')
    })
  })

  describe('compareYearOverYear()', () => {
    it('should get year-over-year comparison range', () => {
      const date = dayjs('2024-01-15')
      const range = date.range('thisMonth')
      const yoy = date.compareYearOverYear(range)

      expect(yoy.label).toBe('Year Over Year')
      expect(yoy.start.format('YYYY-MM-DD')).toBe('2023-01-01')
      expect(yoy.end.format('YYYY-MM-DD')).toBe('2023-01-31')
    })

    it('should handle quarter ranges', () => {
      const date = dayjs('2024-02-15')
      const range = date.range('thisQuarter')
      const yoy = date.compareYearOverYear(range)

      expect(yoy.start.format('YYYY-MM-DD')).toBe('2023-01-01')
      expect(yoy.end.format('YYYY-MM-DD')).toBe('2023-03-31')
    })
  })

  describe('splitRange()', () => {
    it('should split range by months', () => {
      const date = dayjs('2024-01-15')
      const range = date.customRange(
        dayjs('2024-01-01'),
        dayjs('2024-03-31')
      )
      const split = date.splitRange(range, 'month')

      expect(split.length).toBe(3)
      expect(split[0]!.start.format('YYYY-MM-DD')).toBe('2024-01-01')
      expect(split[0]!.end.format('YYYY-MM-DD')).toBe('2024-01-31')
      expect(split[2]!.start.format('YYYY-MM-DD')).toBe('2024-03-01')
      expect(split[2]!.end.format('YYYY-MM-DD')).toBe('2024-03-31')
    })

    it('should split range by weeks', () => {
      const date = dayjs('2024-01-15')
      const range = date.customRange(
        dayjs('2024-01-01'),
        dayjs('2024-01-21')
      )
      const split = date.splitRange(range, 'week')

      // 2024-01-01 to 2024-01-21 spans 4 weeks when using week boundaries
      expect(split.length).toBe(4)
      // Verify first week (ends on Saturday by default)
      expect(split[0]!.start.format('YYYY-MM-DD')).toBe('2024-01-01')
      expect(split[0]!.end.format('YYYY-MM-DD')).toBe('2024-01-06')
      // Last week should end at range end
      expect(split[3]!.end.format('YYYY-MM-DD')).toBe('2024-01-21')
    })

    it('should split range by quarters', () => {
      const date = dayjs('2024-01-15')
      const range = date.customRange(
        dayjs('2024-01-01'),
        dayjs('2024-12-31')
      )
      const split = date.splitRange(range, 'quarter')

      expect(split.length).toBe(4)
      expect(split[0]!.start.format('YYYY-MM-DD')).toBe('2024-01-01')
      expect(split[0]!.end.format('YYYY-MM-DD')).toBe('2024-03-31')
      expect(split[3]!.start.format('YYYY-MM-DD')).toBe('2024-10-01')
      expect(split[3]!.end.format('YYYY-MM-DD')).toBe('2024-12-31')
    })
  })

  describe('isInRange()', () => {
    it('should return true when date is in range', () => {
      const date = dayjs('2024-01-15')
      const range = date.customRange(
        dayjs('2024-01-01'),
        dayjs('2024-01-31')
      )

      expect(dayjs('2024-01-15').isInRange(range)).toBe(true)
      expect(dayjs('2024-01-01').isInRange(range)).toBe(true)
      expect(dayjs('2024-01-31').isInRange(range)).toBe(true)
    })

    it('should return false when date is outside range', () => {
      const date = dayjs('2024-01-15')
      const range = date.customRange(
        dayjs('2024-01-10'),
        dayjs('2024-01-20')
      )

      expect(dayjs('2024-01-09').isInRange(range)).toBe(false)
      expect(dayjs('2024-01-21').isInRange(range)).toBe(false)
    })
  })

  describe('overlapsRange()', () => {
    it('should detect overlapping ranges', () => {
      const date = dayjs('2024-01-15')
      const range1 = date.customRange(
        dayjs('2024-01-01'),
        dayjs('2024-01-15')
      )
      const range2 = date.customRange(
        dayjs('2024-01-10'),
        dayjs('2024-01-20')
      )

      expect(date.overlapsRange(range1, range2)).toBe(true)
    })

    it('should detect non-overlapping ranges', () => {
      const date = dayjs('2024-01-15')
      const range1 = date.customRange(
        dayjs('2024-01-01'),
        dayjs('2024-01-10')
      )
      const range2 = date.customRange(
        dayjs('2024-01-11'),
        dayjs('2024-01-20')
      )

      expect(date.overlapsRange(range1, range2)).toBe(false)
    })

    it('should detect adjacent ranges as non-overlapping', () => {
      const date = dayjs('2024-01-15')
      const range1 = date.customRange(
        dayjs('2024-01-01'),
        dayjs('2024-01-10')
      )
      const range2 = date.customRange(
        dayjs('2024-01-11'),
        dayjs('2024-01-20')
      )

      expect(date.overlapsRange(range1, range2)).toBe(false)
    })
  })
})

describe('createDataRangePlugin', () => {
  it('should create plugin with custom configuration', () => {
    const config: DataRangeConfig = {
      weekStartsOn: 0, // Sunday
      includeToday: false
    }
    const plugin = createDataRangePlugin(config)

    expect(plugin).toBeTypeOf('function')
  })

  it('should use custom week start', () => {
    const Dayjs = require('dayjs')
    const customPlugin = createDataRangePlugin({ weekStartsOn: 0 })

    Dayjs.extend(quarterOfYear)
    Dayjs.extend(customPlugin)

    const date = Dayjs('2024-01-17') // Wednesday
    const range = date.range('thisWeek')

    // Week should start on Sunday
    expect(range.start.day()).toBe(0) // Sunday
    expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-14')
  })

  it('should exclude today when configured', () => {
    const Dayjs = require('dayjs')
    const customPlugin = createDataRangePlugin({ includeToday: false })

    Dayjs.extend(quarterOfYear)
    Dayjs.extend(customPlugin)

    const date = Dayjs('2024-01-15')
    const range = date.range('last7Days')

    expect(range.end.format('YYYY-MM-DD')).toBe('2024-01-14') // Not including today
    expect(range.start.format('YYYY-MM-DD')).toBe('2024-01-08')
  })

  it('should support custom presets', () => {
    const Dayjs = require('dayjs')
    const customPlugin = createDataRangePlugin({
      customPresets: {
        last24Hours: (date) => ({
          start: date.subtract(24, 'hour'),
          end: date,
          label: 'Last 24 Hours'
        })
      }
    })

    Dayjs.extend(quarterOfYear)
    Dayjs.extend(customPlugin)

    const date = Dayjs('2024-01-15 12:00:00')
    const range = date.range('last24Hours')

    expect(range.label).toBe('Last 24 Hours')
  })
})

describe('AnalyticsPresets', () => {
  it('should have web analytics presets', () => {
    expect(AnalyticsPresets.WEB_ANALYTICS).toContain('today')
    expect(AnalyticsPresets.WEB_ANALYTICS).toContain('last7Days')
    expect(AnalyticsPresets.WEB_ANALYTICS).toContain('last30Days')
  })

  it('should have sales presets', () => {
    expect(AnalyticsPresets.SALES).toContain('thisWeek')
    expect(AnalyticsPresets.SALES).toContain('thisMonth')
    expect(AnalyticsPresets.SALES).toContain('thisQuarter')
  })

  it('should have marketing presets', () => {
    expect(AnalyticsPresets.MARKETING).toContain('last7Days')
    expect(AnalyticsPresets.MARKETING).toContain('last90Days')
    expect(AnalyticsPresets.MARKETING).toContain('lastQuarter')
  })

  it('should have financial presets', () => {
    expect(AnalyticsPresets.FINANCIAL).toContain('thisMonth')
    expect(AnalyticsPresets.FINANCIAL).toContain('thisQuarter')
    expect(AnalyticsPresets.FINANCIAL).toContain('thisYear')
  })
})

describe('getMultipleRanges', () => {
  it('should get multiple ranges at once', () => {
    const date = dayjs('2024-01-15')
    const presets = ['today', 'yesterday', 'thisMonth'] as const
    const ranges = getMultipleRanges(date, presets)

    expect(ranges.length).toBe(3)
    expect(ranges[0]!.label).toBe('Today')
    expect(ranges[1]!.label).toBe('Yesterday')
    expect(ranges[2]!.label).toBe('This Month')
  })

  it('should work with AnalyticsPresets', () => {
    const date = dayjs('2024-01-15')
    const ranges = getMultipleRanges(date, AnalyticsPresets.WEB_ANALYTICS)

    expect(ranges.length).toBeGreaterThan(0)
  })
})

describe('getRangeStats', () => {
  it('should calculate range statistics', () => {
    const date = dayjs('2024-01-15')
    const range = date.customRange(
      dayjs('2024-01-01'),
      dayjs('2024-01-31')
    )
    const stats = getRangeStats(range)

    expect(stats.days).toBe(31)
    expect(stats.weeks).toBe(5) // Math.ceil(31 / 7)
    expect(stats.months).toBe(1)
  })

  it('should calculate stats for multi-month range', () => {
    const date = dayjs('2024-01-15')
    const range = date.customRange(
      dayjs('2024-01-01'),
      dayjs('2024-03-31')
    )
    const stats = getRangeStats(range)

    expect(stats.days).toBe(91) // 31 + 29 + 31 (2024 is leap year)
    expect(stats.months).toBe(3)
  })

  it('should calculate stats for week range', () => {
    const date = dayjs('2024-01-15')
    const range = date.range('last7Days')
    const stats = getRangeStats(range)

    expect(stats.days).toBe(7)
    expect(stats.weeks).toBe(1)
  })
})

describe('mergeRanges', () => {
  it('should merge overlapping ranges', () => {
    const date = dayjs('2024-01-15')
    const ranges = [
      date.customRange(dayjs('2024-01-01'), dayjs('2024-01-10')),
      date.customRange(dayjs('2024-01-05'), dayjs('2024-01-15')),
      date.customRange(dayjs('2024-01-20'), dayjs('2024-01-25'))
    ]

    const merged = mergeRanges(ranges)

    expect(merged.length).toBe(2)
    expect(merged[0]!.start.format('YYYY-MM-DD')).toBe('2024-01-01')
    expect(merged[0]!.end.format('YYYY-MM-DD')).toBe('2024-01-15')
    expect(merged[1]!.start.format('YYYY-MM-DD')).toBe('2024-01-20')
    expect(merged[1]!.end.format('YYYY-MM-DD')).toBe('2024-01-25')
  })

  it('should handle empty array', () => {
    const merged = mergeRanges([])
    expect(merged.length).toBe(0)
  })

  it('should handle single range', () => {
    const date = dayjs('2024-01-15')
    const ranges = [
      date.customRange(dayjs('2024-01-01'), dayjs('2024-01-10'))
    ]

    const merged = mergeRanges(ranges)

    expect(merged.length).toBe(1)
  })

  it('should merge adjacent ranges (within 1 day)', () => {
    const date = dayjs('2024-01-15')
    const ranges = [
      date.customRange(dayjs('2024-01-01'), dayjs('2024-01-10')),
      date.customRange(dayjs('2024-01-11'), dayjs('2024-01-15'))
    ]

    const merged = mergeRanges(ranges)

    expect(merged.length).toBe(1)
    expect(merged[0]!.start.format('YYYY-MM-DD')).toBe('2024-01-01')
    expect(merged[0]!.end.format('YYYY-MM-DD')).toBe('2024-01-15')
  })
})

describe('findRangeGaps', () => {
  it('should find gaps between ranges', () => {
    const date = dayjs('2024-01-15')
    const ranges = [
      date.customRange(dayjs('2024-01-01'), dayjs('2024-01-10')),
      date.customRange(dayjs('2024-01-15'), dayjs('2024-01-20')),
      date.customRange(dayjs('2024-01-25'), dayjs('2024-01-30'))
    ]

    const gaps = findRangeGaps(ranges)

    expect(gaps.length).toBe(2)
    expect(gaps[0]!.start.format('YYYY-MM-DD')).toBe('2024-01-11')
    expect(gaps[0]!.end.format('YYYY-MM-DD')).toBe('2024-01-14')
    expect(gaps[1]!.start.format('YYYY-MM-DD')).toBe('2024-01-21')
    expect(gaps[1]!.end.format('YYYY-MM-DD')).toBe('2024-01-24')
  })

  it('should return empty array when no gaps', () => {
    const date = dayjs('2024-01-15')
    const ranges = [
      date.customRange(dayjs('2024-01-01'), dayjs('2024-01-10')),
      date.customRange(dayjs('2024-01-11'), dayjs('2024-01-20'))
    ]

    const gaps = findRangeGaps(ranges)

    expect(gaps.length).toBe(0)
  })

  it('should return empty array for single range', () => {
    const date = dayjs('2024-01-15')
    const ranges = [
      date.customRange(dayjs('2024-01-01'), dayjs('2024-01-10'))
    ]

    const gaps = findRangeGaps(ranges)

    expect(gaps.length).toBe(0)
  })

  it('should return empty array for empty input', () => {
    const gaps = findRangeGaps([])
    expect(gaps.length).toBe(0)
  })
})
