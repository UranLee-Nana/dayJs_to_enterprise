import { describe, it, expect } from 'vitest'
import {
  validateDate,
  validateISO8601,
  validateDateRange,
  isDateInReasonableRange,
  isValidBusinessDate,
  isToday,
  isPast,
  isFuture,
  isLeapYear,
  isWeekend,
  isWeekday,
  isSameDay,
  parseDate,
  toISO8601
} from '../src/validate'

describe('validateDate', () => {
  it('should validate valid dates', () => {
    expect(validateDate('2024-01-15').isValid).toBe(true)
    expect(validateDate(new Date()).isValid).toBe(true)
    expect(validateDate(Date.now()).isValid).toBe(true)
  })

  it('should reject null/undefined', () => {
    expect(validateDate(null).isValid).toBe(false)
    expect(validateDate(undefined).isValid).toBe(false)
  })

  it('should return normalized dayjs instance', () => {
    const result = validateDate('2024-01-15')
    expect(result.normalized?.format('YYYY-MM-DD')).toBe('2024-01-15')
  })
})

describe('validateISO8601', () => {
  it('should accept valid ISO 8601 formats', () => {
    expect(validateISO8601('2024-01-15').isValid).toBe(true)
    expect(validateISO8601('2024-01-15T10:30:00').isValid).toBe(true)
    expect(validateISO8601('2024-01-15T10:30:00Z').isValid).toBe(true)
    expect(validateISO8601('2024-01-15T10:30:00+08:00').isValid).toBe(true)
  })

  it('should reject invalid formats', () => {
    expect(validateISO8601('15-01-2024').isValid).toBe(false)
    expect(validateISO8601('not-a-date').isValid).toBe(false)
  })
})

describe('validateDateRange', () => {
  it('should accept valid range', () => {
    const result = validateDateRange('2024-01-01', '2024-01-31')
    expect(result.isValid).toBe(true)
    expect(result.start).toBeDefined()
    expect(result.end).toBeDefined()
  })

  it('should reject when start is after end', () => {
    const result = validateDateRange('2024-01-31', '2024-01-01')
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('before or equal')
  })

  it('should accept same start and end', () => {
    const result = validateDateRange('2024-01-15', '2024-01-15')
    expect(result.isValid).toBe(true)
  })
})

describe('isDateInReasonableRange', () => {
  it('should accept dates within default range', () => {
    expect(isDateInReasonableRange('2024-01-15')).toBe(true)
  })

  it('should reject very old dates', () => {
    expect(isDateInReasonableRange('1800-01-01')).toBe(false)
  })

  it('should respect custom range', () => {
    expect(isDateInReasonableRange('2020-01-01', 1, 1)).toBe(false)
  })
})

describe('isValidBusinessDate', () => {
  it('should return true for weekdays', () => {
    expect(isValidBusinessDate('2024-01-15')).toBe(true) // Monday
  })

  it('should return false for weekends', () => {
    expect(isValidBusinessDate('2024-01-13')).toBe(false) // Saturday
    expect(isValidBusinessDate('2024-01-14')).toBe(false) // Sunday
  })

  it('should return false for holidays', () => {
    expect(isValidBusinessDate('2024-01-15', ['2024-01-15'])).toBe(false)
  })
})

describe('isToday', () => {
  it('should return true for today', () => {
    expect(isToday(new Date())).toBe(true)
  })

  it('should return false for yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isToday(yesterday)).toBe(false)
  })
})

describe('isPast', () => {
  it('should return true for past dates', () => {
    expect(isPast('2020-01-01')).toBe(true)
  })

  it('should return false for future dates', () => {
    expect(isPast('2099-01-01')).toBe(false)
  })
})

describe('isFuture', () => {
  it('should return true for future dates', () => {
    expect(isFuture('2099-01-01')).toBe(true)
  })

  it('should return false for past dates', () => {
    expect(isFuture('2020-01-01')).toBe(false)
  })
})

describe('isLeapYear', () => {
  it('should identify leap years', () => {
    expect(isLeapYear(2024)).toBe(true)
    expect(isLeapYear(2000)).toBe(true)
  })

  it('should identify non-leap years', () => {
    expect(isLeapYear(2023)).toBe(false)
    expect(isLeapYear(1900)).toBe(false)
  })

  it('should accept date input', () => {
    expect(isLeapYear('2024-06-15')).toBe(true)
  })
})

describe('isWeekend', () => {
  it('should return true for Saturday and Sunday', () => {
    expect(isWeekend('2024-01-13')).toBe(true) // Saturday
    expect(isWeekend('2024-01-14')).toBe(true) // Sunday
  })

  it('should return false for weekdays', () => {
    expect(isWeekend('2024-01-15')).toBe(false) // Monday
  })
})

describe('isWeekday', () => {
  it('should return true for weekdays', () => {
    expect(isWeekday('2024-01-15')).toBe(true) // Monday
    expect(isWeekday('2024-01-19')).toBe(true) // Friday
  })

  it('should return false for weekends', () => {
    expect(isWeekday('2024-01-13')).toBe(false) // Saturday
  })
})

describe('isSameDay', () => {
  it('should return true for same day', () => {
    expect(isSameDay('2024-01-15', '2024-01-15')).toBe(true)
  })

  it('should return false for different days', () => {
    expect(isSameDay('2024-01-15', '2024-01-16')).toBe(false)
  })

  it('should ignore time component', () => {
    expect(isSameDay('2024-01-15T10:00:00', '2024-01-15T22:00:00')).toBe(true)
  })
})

describe('parseDate', () => {
  it('should parse various formats', () => {
    expect(parseDate('2024-01-15').isValid).toBe(true)
    expect(parseDate('01/15/2024').isValid).toBe(true)
    expect(parseDate('15-01-2024').isValid).toBe(true)
  })

  it('should accept custom formats', () => {
    const result = parseDate('15.01.2024', ['DD.MM.YYYY'])
    expect(result.isValid).toBe(true)
  })
})

describe('toISO8601', () => {
  it('should convert to ISO string', () => {
    const result = toISO8601('2024-01-15T10:30:00Z')
    expect(result).toContain('2024-01-15')
  })

  it('should return null for invalid dates', () => {
    expect(toISO8601('invalid')).toBeNull()
  })
})
