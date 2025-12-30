import { describe, it, expect, beforeEach } from 'vitest'
import dayjs from 'dayjs'
import { businessDayPlugin, createBusinessDayPlugin, countBusinessDaysInRange, hasBusinessDaysInRange } from '../src'
import type { Holiday } from '@dayjs-business/core'

// Extend dayjs with the plugin
dayjs.extend(businessDayPlugin)

describe('businessDayPlugin', () => {
  describe('isBusinessDay', () => {
    it('should return true for weekdays', () => {
      const monday = dayjs('2024-01-15') // Monday
      expect(monday.isBusinessDay()).toBe(true)

      const friday = dayjs('2024-01-19') // Friday
      expect(friday.isBusinessDay()).toBe(true)
    })

    it('should return false for weekends', () => {
      const saturday = dayjs('2024-01-13') // Saturday
      expect(saturday.isBusinessDay()).toBe(false)

      const sunday = dayjs('2024-01-14') // Sunday
      expect(sunday.isBusinessDay()).toBe(false)
    })
  })

  describe('nextBusinessDay', () => {
    it('should return next weekday from weekday', () => {
      const monday = dayjs('2024-01-15') // Monday
      const next = monday.nextBusinessDay()
      expect(next.format('YYYY-MM-DD')).toBe('2024-01-16') // Tuesday
    })

    it('should skip weekend', () => {
      const friday = dayjs('2024-01-19') // Friday
      const next = friday.nextBusinessDay()
      expect(next.format('YYYY-MM-DD')).toBe('2024-01-22') // Monday
    })

    it('should return Monday from Saturday', () => {
      const saturday = dayjs('2024-01-13') // Saturday
      const next = saturday.nextBusinessDay()
      expect(next.format('YYYY-MM-DD')).toBe('2024-01-15') // Monday
    })
  })

  describe('prevBusinessDay', () => {
    it('should return previous weekday', () => {
      const wednesday = dayjs('2024-01-17') // Wednesday
      const prev = wednesday.prevBusinessDay()
      expect(prev.format('YYYY-MM-DD')).toBe('2024-01-16') // Tuesday
    })

    it('should skip weekend', () => {
      const monday = dayjs('2024-01-15') // Monday
      const prev = monday.prevBusinessDay()
      expect(prev.format('YYYY-MM-DD')).toBe('2024-01-12') // Friday
    })
  })

  describe('addBusinessDays', () => {
    it('should add business days', () => {
      const monday = dayjs('2024-01-15') // Monday
      const result = monday.addBusinessDays(3)
      expect(result.format('YYYY-MM-DD')).toBe('2024-01-18') // Thursday
    })

    it('should skip weekends when adding', () => {
      const thursday = dayjs('2024-01-18') // Thursday
      const result = thursday.addBusinessDays(2)
      expect(result.format('YYYY-MM-DD')).toBe('2024-01-22') // Monday
    })

    it('should handle zero days', () => {
      const monday = dayjs('2024-01-15')
      const result = monday.addBusinessDays(0)
      expect(result.format('YYYY-MM-DD')).toBe('2024-01-15')
    })

    it('should handle negative days', () => {
      const wednesday = dayjs('2024-01-17') // Wednesday
      const result = wednesday.addBusinessDays(-2)
      expect(result.format('YYYY-MM-DD')).toBe('2024-01-15') // Monday
    })
  })

  describe('subtractBusinessDays', () => {
    it('should subtract business days', () => {
      const thursday = dayjs('2024-01-18') // Thursday
      const result = thursday.subtractBusinessDays(3)
      expect(result.format('YYYY-MM-DD')).toBe('2024-01-15') // Monday
    })

    it('should skip weekends when subtracting', () => {
      const monday = dayjs('2024-01-15') // Monday
      const result = monday.subtractBusinessDays(1)
      expect(result.format('YYYY-MM-DD')).toBe('2024-01-12') // Friday
    })
  })

  describe('businessDaysBetween', () => {
    it('should count business days between dates', () => {
      const start = dayjs('2024-01-15') // Monday
      const end = dayjs('2024-01-19') // Friday
      expect(start.businessDaysBetween(end)).toBe(4)
    })

    it('should handle reverse order', () => {
      const start = dayjs('2024-01-15') // Monday
      const end = dayjs('2024-01-19') // Friday
      expect(end.businessDaysBetween(start)).toBe(-4)
    })

    it('should skip weekends in count', () => {
      const start = dayjs('2024-01-15') // Monday
      const end = dayjs('2024-01-22') // Next Monday
      expect(start.businessDaysBetween(end)).toBe(5)
    })
  })

  describe('getBusinessDaysInMonth', () => {
    it('should return all business days in month', () => {
      const january = dayjs('2024-01-15')
      const businessDays = january.getBusinessDaysInMonth()
      expect(businessDays.length).toBe(23) // January 2024 has 23 business days
    })

    it('should only return weekdays', () => {
      const january = dayjs('2024-01-15')
      const businessDays = january.getBusinessDaysInMonth()
      businessDays.forEach(day => {
        expect([1, 2, 3, 4, 5]).toContain(day.day())
      })
    })
  })

  describe('isHoliday', () => {
    it('should return false when no holidays configured', () => {
      const date = dayjs('2024-01-15')
      expect(date.isHoliday()).toBe(false)
    })
  })
})

describe('createBusinessDayPlugin', () => {
  it('should create plugin with custom config', () => {
    const customPlugin = createBusinessDayPlugin({
      workdays: [1, 2, 3, 4], // Mon-Thu only
      holidays: []
    })
    expect(customPlugin).toBeTypeOf('function')
  })
})

describe('countBusinessDaysInRange', () => {
  it('should count business days in range', () => {
    const start = dayjs('2024-01-15')
    const end = dayjs('2024-01-19')
    expect(countBusinessDaysInRange(start, end)).toBe(5)
  })

  it('should exclude holidays', () => {
    const start = dayjs('2024-01-15')
    const end = dayjs('2024-01-19')
    const holidays: Holiday[] = [{ date: '2024-01-17', name: 'Test', type: 'public' }]
    expect(countBusinessDaysInRange(start, end, { holidays })).toBe(4)
  })
})

describe('hasBusinessDaysInRange', () => {
  it('should return true if range contains business days', () => {
    const start = dayjs('2024-01-15') // Monday
    const end = dayjs('2024-01-16') // Tuesday
    expect(hasBusinessDaysInRange(start, end)).toBe(true)
  })

  it('should return false for weekend-only range', () => {
    const start = dayjs('2024-01-13') // Saturday
    const end = dayjs('2024-01-14') // Sunday
    expect(hasBusinessDaysInRange(start, end)).toBe(false)
  })
})
