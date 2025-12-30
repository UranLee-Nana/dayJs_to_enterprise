import type { LocaleCode, DateInput, BusinessRules, Holiday } from './types'

/**
 * Validation error class for dayjs-business
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Timezone validation regex pattern
 * Matches IANA timezone format like "Asia/Shanghai", "America/New_York"
 */
const TIMEZONE_PATTERN = /^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/

/**
 * UTC timezone pattern
 */
const UTC_PATTERN = /^UTC$/i

/**
 * Offset timezone pattern like "+08:00", "-05:00"
 */
const OFFSET_PATTERN = /^[+-]\d{2}:\d{2}$/

/**
 * ISO 8601 date pattern
 */
const ISO8601_PATTERN = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$/

/**
 * XSS dangerous characters pattern
 */
const XSS_PATTERN = /<script|javascript:|on\w+\s*=/i

/**
 * Safe locale code pattern
 */
const LOCALE_PATTERN = /^[a-z]{2}(-[a-z]{2})?$/i

/**
 * Validates timezone string
 * @throws {ValidationError} if timezone is invalid
 */
export function validateTimezone(timezone: string): void {
  if (typeof timezone !== 'string') {
    throw new ValidationError('Timezone must be a string', 'timezone', timezone)
  }

  const trimmed = timezone.trim()

  if (trimmed.length === 0) {
    throw new ValidationError('Timezone cannot be empty', 'timezone', timezone)
  }

  if (trimmed.length > 50) {
    throw new ValidationError('Timezone string too long', 'timezone', timezone)
  }

  if (XSS_PATTERN.test(trimmed)) {
    throw new ValidationError('Timezone contains invalid characters', 'timezone', '[REDACTED]')
  }

  const isValid =
    TIMEZONE_PATTERN.test(trimmed) || UTC_PATTERN.test(trimmed) || OFFSET_PATTERN.test(trimmed)

  if (!isValid) {
    throw new ValidationError(
      `Invalid timezone format: ${trimmed}. Expected IANA format (e.g., "Asia/Shanghai") or offset (e.g., "+08:00")`,
      'timezone',
      trimmed
    )
  }
}

/**
 * Validates locale code
 * @throws {ValidationError} if locale is invalid
 */
export function validateLocale(locale: LocaleCode): void {
  if (typeof locale !== 'string') {
    throw new ValidationError('Locale must be a string', 'locale', locale)
  }

  const trimmed = locale.trim()

  if (trimmed.length === 0) {
    throw new ValidationError('Locale cannot be empty', 'locale', locale)
  }

  if (trimmed.length > 10) {
    throw new ValidationError('Locale string too long', 'locale', locale)
  }

  if (XSS_PATTERN.test(trimmed)) {
    throw new ValidationError('Locale contains invalid characters', 'locale', '[REDACTED]')
  }

  if (!LOCALE_PATTERN.test(trimmed)) {
    throw new ValidationError(
      `Invalid locale format: ${trimmed}. Expected format like "en" or "zh-cn"`,
      'locale',
      trimmed
    )
  }
}

/**
 * Validates date input for potential XSS
 * @throws {ValidationError} if input contains XSS patterns
 */
export function validateDateInput(input: DateInput): void {
  if (input === null || input === undefined) {
    return
  }

  if (typeof input === 'string') {
    if (XSS_PATTERN.test(input)) {
      throw new ValidationError('Date input contains invalid characters', 'input', '[REDACTED]')
    }

    if (input.length > 100) {
      throw new ValidationError('Date input string too long', 'input', input.substring(0, 50))
    }
  }
}

/**
 * Validates ISO 8601 date string format
 * @throws {ValidationError} if format is invalid
 */
export function validateISO8601(dateString: string): void {
  if (typeof dateString !== 'string') {
    throw new ValidationError('ISO8601 date must be a string', 'dateString', dateString)
  }

  if (!ISO8601_PATTERN.test(dateString)) {
    throw new ValidationError(
      `Invalid ISO 8601 format: ${dateString}`,
      'dateString',
      dateString.substring(0, 50)
    )
  }
}

/**
 * Validates business rules configuration
 * @throws {ValidationError} if rules are invalid
 */
export function validateBusinessRules(rules: BusinessRules): void {
  if (typeof rules !== 'object' || rules === null) {
    throw new ValidationError('Business rules must be an object', 'businessRules', rules)
  }

  // Validate workdays
  if (!Array.isArray(rules.workdays)) {
    throw new ValidationError('Workdays must be an array', 'workdays', rules.workdays)
  }

  for (const day of rules.workdays) {
    if (typeof day !== 'number' || day < 0 || day > 6 || !Number.isInteger(day)) {
      throw new ValidationError('Workday must be an integer between 0-6', 'workdays', day)
    }
  }

  // Validate holidays
  if (!Array.isArray(rules.holidays)) {
    throw new ValidationError('Holidays must be an array', 'holidays', rules.holidays)
  }

  for (const holiday of rules.holidays) {
    validateHoliday(holiday)
  }

  // Validate fiscal year start
  if (rules.fiscalYearStart !== undefined) {
    const { month, day } = rules.fiscalYearStart
    if (
      typeof month !== 'number' ||
      month < 1 ||
      month > 12 ||
      typeof day !== 'number' ||
      day < 1 ||
      day > 31
    ) {
      throw new ValidationError(
        'Invalid fiscal year start date',
        'fiscalYearStart',
        rules.fiscalYearStart
      )
    }
  }
}

/**
 * Validates holiday definition
 * @throws {ValidationError} if holiday is invalid
 */
export function validateHoliday(holiday: Holiday): void {
  if (typeof holiday !== 'object' || holiday === null) {
    throw new ValidationError('Holiday must be an object', 'holiday', holiday)
  }

  if (typeof holiday.date !== 'string' || !ISO8601_PATTERN.test(holiday.date.split('T')[0] ?? '')) {
    throw new ValidationError('Holiday date must be a valid date string', 'holiday.date', holiday.date)
  }

  if (typeof holiday.name !== 'string' || holiday.name.length === 0) {
    throw new ValidationError('Holiday name must be a non-empty string', 'holiday.name', holiday.name)
  }

  if (XSS_PATTERN.test(holiday.name)) {
    throw new ValidationError('Holiday name contains invalid characters', 'holiday.name', '[REDACTED]')
  }

  const validTypes = ['public', 'company', 'regional']
  if (!validTypes.includes(holiday.type)) {
    throw new ValidationError(
      `Holiday type must be one of: ${validTypes.join(', ')}`,
      'holiday.type',
      holiday.type
    )
  }
}

/**
 * Sanitizes string input by removing potential XSS vectors
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validates that a value is a valid positive integer
 */
export function validatePositiveInteger(value: number, field: string): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new ValidationError(`${field} must be a positive integer`, field, value)
  }
}

/**
 * Validates that a value is within a range
 */
export function validateRange(value: number, min: number, max: number, field: string): void {
  if (typeof value !== 'number' || value < min || value > max) {
    throw new ValidationError(`${field} must be between ${min} and ${max}`, field, value)
  }
}
