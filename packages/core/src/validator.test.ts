import { describe, it, expect } from 'vitest'
import {
  validateTimezone,
  validateLocale,
  validateDateInput,
  validateISO8601,
  validateBusinessRules,
  validateHoliday,
  sanitizeString,
  validatePositiveInteger,
  validateRange,
  ValidationError
} from '../src/validator'

describe('validateTimezone', () => {
  it('should accept valid IANA timezones', () => {
    expect(() => validateTimezone('Asia/Shanghai')).not.toThrow()
    expect(() => validateTimezone('America/New_York')).not.toThrow()
    expect(() => validateTimezone('Europe/London')).not.toThrow()
  })

  it('should accept UTC', () => {
    expect(() => validateTimezone('UTC')).not.toThrow()
  })

  it('should accept offset format', () => {
    expect(() => validateTimezone('+08:00')).not.toThrow()
    expect(() => validateTimezone('-05:00')).not.toThrow()
  })

  it('should reject invalid timezones', () => {
    expect(() => validateTimezone('invalid')).toThrow(ValidationError)
    expect(() => validateTimezone('')).toThrow(ValidationError)
  })

  it('should reject XSS attempts', () => {
    expect(() => validateTimezone('<script>alert(1)</script>')).toThrow(ValidationError)
    expect(() => validateTimezone('javascript:void(0)')).toThrow(ValidationError)
  })

  it('should reject non-string input', () => {
    expect(() => validateTimezone(123 as unknown as string)).toThrow(ValidationError)
  })

  it('should reject too long strings', () => {
    const longString = 'A'.repeat(100)
    expect(() => validateTimezone(longString)).toThrow(ValidationError)
  })
})

describe('validateLocale', () => {
  it('should accept valid locales', () => {
    expect(() => validateLocale('en')).not.toThrow()
    expect(() => validateLocale('zh-cn')).not.toThrow()
    expect(() => validateLocale('ja')).not.toThrow()
  })

  it('should reject invalid locales', () => {
    expect(() => validateLocale('invalid-locale-code')).toThrow(ValidationError)
    expect(() => validateLocale('')).toThrow(ValidationError)
  })

  it('should reject XSS attempts', () => {
    expect(() => validateLocale('<script>')).toThrow(ValidationError)
  })
})

describe('validateDateInput', () => {
  it('should accept null and undefined', () => {
    expect(() => validateDateInput(null)).not.toThrow()
    expect(() => validateDateInput(undefined)).not.toThrow()
  })

  it('should accept valid date strings', () => {
    expect(() => validateDateInput('2024-01-15')).not.toThrow()
    expect(() => validateDateInput('2024-01-15T10:30:00Z')).not.toThrow()
  })

  it('should reject XSS attempts', () => {
    expect(() => validateDateInput('<script>alert(1)</script>')).toThrow(ValidationError)
  })

  it('should reject too long strings', () => {
    const longString = '2024-01-15' + 'A'.repeat(200)
    expect(() => validateDateInput(longString)).toThrow(ValidationError)
  })
})

describe('validateISO8601', () => {
  it('should accept valid ISO 8601 dates', () => {
    expect(() => validateISO8601('2024-01-15')).not.toThrow()
    expect(() => validateISO8601('2024-01-15T10:30:00')).not.toThrow()
    expect(() => validateISO8601('2024-01-15T10:30:00Z')).not.toThrow()
    expect(() => validateISO8601('2024-01-15T10:30:00+08:00')).not.toThrow()
  })

  it('should reject invalid formats', () => {
    expect(() => validateISO8601('15-01-2024')).toThrow(ValidationError)
    expect(() => validateISO8601('01/15/2024')).toThrow(ValidationError)
  })

  it('should reject non-string input', () => {
    expect(() => validateISO8601(123 as unknown as string)).toThrow(ValidationError)
  })
})

describe('validateBusinessRules', () => {
  it('should accept valid business rules', () => {
    expect(() =>
      validateBusinessRules({
        workdays: [1, 2, 3, 4, 5],
        holidays: []
      })
    ).not.toThrow()
  })

  it('should accept rules with holidays', () => {
    expect(() =>
      validateBusinessRules({
        workdays: [1, 2, 3, 4, 5],
        holidays: [{ date: '2024-01-01', name: 'New Year', type: 'public' }]
      })
    ).not.toThrow()
  })

  it('should accept rules with fiscal year', () => {
    expect(() =>
      validateBusinessRules({
        workdays: [1, 2, 3, 4, 5],
        holidays: [],
        fiscalYearStart: { month: 4, day: 1 }
      })
    ).not.toThrow()
  })

  it('should reject invalid workdays', () => {
    expect(() =>
      validateBusinessRules({
        workdays: [1, 2, 7], // 7 is invalid
        holidays: []
      })
    ).toThrow(ValidationError)
  })

  it('should reject non-object input', () => {
    expect(() => validateBusinessRules(null as unknown as never)).toThrow(ValidationError)
  })
})

describe('validateHoliday', () => {
  it('should accept valid holiday', () => {
    expect(() =>
      validateHoliday({
        date: '2024-01-01',
        name: 'New Year',
        type: 'public'
      })
    ).not.toThrow()
  })

  it('should accept recurring holiday', () => {
    expect(() =>
      validateHoliday({
        date: '2024-12-25',
        name: 'Christmas',
        type: 'public',
        recurring: true
      })
    ).not.toThrow()
  })

  it('should reject invalid type', () => {
    expect(() =>
      validateHoliday({
        date: '2024-01-01',
        name: 'Holiday',
        type: 'invalid' as never
      })
    ).toThrow(ValidationError)
  })

  it('should reject empty name', () => {
    expect(() =>
      validateHoliday({
        date: '2024-01-01',
        name: '',
        type: 'public'
      })
    ).toThrow(ValidationError)
  })
})

describe('sanitizeString', () => {
  it('should escape HTML characters', () => {
    expect(sanitizeString('<script>')).toBe('&lt;script&gt;')
    expect(sanitizeString('"test"')).toBe('&quot;test&quot;')
    expect(sanitizeString("'test'")).toBe('&#x27;test&#x27;')
  })
})

describe('validatePositiveInteger', () => {
  it('should accept positive integers', () => {
    expect(() => validatePositiveInteger(0, 'field')).not.toThrow()
    expect(() => validatePositiveInteger(42, 'field')).not.toThrow()
  })

  it('should reject negative numbers', () => {
    expect(() => validatePositiveInteger(-1, 'field')).toThrow(ValidationError)
  })

  it('should reject non-integers', () => {
    expect(() => validatePositiveInteger(3.14, 'field')).toThrow(ValidationError)
  })
})

describe('validateRange', () => {
  it('should accept values within range', () => {
    expect(() => validateRange(5, 1, 10, 'field')).not.toThrow()
  })

  it('should reject values outside range', () => {
    expect(() => validateRange(0, 1, 10, 'field')).toThrow(ValidationError)
    expect(() => validateRange(11, 1, 10, 'field')).toThrow(ValidationError)
  })
})
