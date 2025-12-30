import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import {
  validateTimezone,
  ValidationError,
  type TimezoneConversionResult,
  type DateInput
} from '@dayjs-business/core'

// Ensure plugins are loaded
dayjs.extend(utc)
dayjs.extend(timezone)

export interface TimezoneServiceConfig {
  /** Default storage timezone (recommended: UTC) */
  storageTimezone?: string
  /** Default display timezone */
  displayTimezone?: string
  /** Whether to validate all timezone inputs */
  strictValidation?: boolean
}

export interface CrossTimezoneAlignment {
  /** Reference date in UTC */
  referenceUtc: Dayjs
  /** Aligned dates in each timezone */
  alignedDates: Map<string, Dayjs>
  /** Alignment type used */
  alignmentType: 'startOfDay' | 'endOfDay' | 'exact'
}

export interface TimezoneInfo {
  id: string
  offset: number
  offsetString: string
  abbreviation: string
  isDst: boolean
}

/**
 * TimezoneService - Enterprise timezone management service
 * Handles UTC storage, user timezone rendering, and cross-timezone collaboration
 */
export class TimezoneService {
  private readonly config: Required<TimezoneServiceConfig>

  constructor(config: TimezoneServiceConfig = {}) {
    this.config = {
      storageTimezone: config.storageTimezone ?? 'UTC',
      displayTimezone: config.displayTimezone ?? 'UTC',
      strictValidation: config.strictValidation ?? true
    }

    if (this.config.strictValidation) {
      validateTimezone(this.config.storageTimezone)
      validateTimezone(this.config.displayTimezone)
    }
  }

  /**
   * Convert local time to UTC for storage
   */
  toStorage(input: DateInput, sourceTimezone?: string): Dayjs {
    const tz = sourceTimezone ?? this.config.displayTimezone

    if (this.config.strictValidation && sourceTimezone) {
      validateTimezone(sourceTimezone)
    }

    const localDate = dayjs.tz(input, tz)
    return localDate.utc()
  }

  /**
   * Convert UTC storage time to user's display timezone
   */
  toDisplay(input: DateInput, targetTimezone?: string): Dayjs {
    const tz = targetTimezone ?? this.config.displayTimezone

    if (this.config.strictValidation && targetTimezone) {
      validateTimezone(targetTimezone)
    }

    const utcDate = dayjs.utc(input)
    return utcDate.tz(tz)
  }

  /**
   * Convert between any two timezones
   */
  convert(
    input: DateInput,
    sourceTimezone: string,
    targetTimezone: string
  ): TimezoneConversionResult {
    if (this.config.strictValidation) {
      validateTimezone(sourceTimezone)
      validateTimezone(targetTimezone)
    }

    const original = dayjs.tz(input, sourceTimezone)
    const converted = original.tz(targetTimezone)

    return {
      original,
      converted,
      sourceTimezone,
      targetTimezone,
      offset: converted.utcOffset() - original.utcOffset()
    }
  }

  /**
   * Get current time in a specific timezone
   */
  now(timezone?: string): Dayjs {
    const tz = timezone ?? this.config.displayTimezone

    if (this.config.strictValidation && timezone) {
      validateTimezone(timezone)
    }

    return dayjs().tz(tz)
  }

  /**
   * Get UTC timestamp
   */
  utcNow(): Dayjs {
    return dayjs.utc()
  }

  /**
   * Align times across multiple timezones for collaboration
   * Example: Find start of day in each timezone
   */
  alignCrossTimezone(
    referenceDate: DateInput,
    timezones: string[],
    alignmentType: 'startOfDay' | 'endOfDay' | 'exact' = 'startOfDay'
  ): CrossTimezoneAlignment {
    const alignedDates = new Map<string, Dayjs>()

    if (this.config.strictValidation) {
      for (const tz of timezones) {
        validateTimezone(tz)
      }
    }

    const referenceUtc = dayjs.utc(referenceDate)

    for (const tz of timezones) {
      let aligned = referenceUtc.tz(tz)

      switch (alignmentType) {
        case 'startOfDay':
          aligned = aligned.startOf('day')
          break
        case 'endOfDay':
          aligned = aligned.endOf('day')
          break
        case 'exact':
          // Keep as is
          break
      }

      alignedDates.set(tz, aligned)
    }

    return {
      referenceUtc,
      alignedDates,
      alignmentType
    }
  }

  /**
   * Find overlapping business hours across timezones
   */
  findOverlappingHours(
    timezones: string[],
    businessHoursStart = 9,
    businessHoursEnd = 17,
    referenceDate?: DateInput
  ): { start: Dayjs; end: Dayjs } | null {
    if (this.config.strictValidation) {
      for (const tz of timezones) {
        validateTimezone(tz)
      }
    }

    const reference = dayjs.utc(referenceDate)

    // Calculate business hours range in UTC for each timezone
    const ranges: Array<{ start: number; end: number }> = []

    for (const tz of timezones) {
      const tzDate = reference.tz(tz)
      const startLocal = tzDate.hour(businessHoursStart).minute(0).second(0)
      const endLocal = tzDate.hour(businessHoursEnd).minute(0).second(0)

      const startUtc = startLocal.utc().hour()
      let endUtc = endLocal.utc().hour()

      // Handle day boundary crossing
      if (endUtc < startUtc) {
        endUtc += 24
      }

      ranges.push({ start: startUtc, end: endUtc })
    }

    // Find overlapping range
    let overlapStart = Math.max(...ranges.map(r => r.start))
    let overlapEnd = Math.min(...ranges.map(r => r.end))

    if (overlapStart >= overlapEnd) {
      return null // No overlap
    }

    // Normalize hours
    overlapStart = overlapStart % 24
    overlapEnd = overlapEnd % 24

    const resultStart = reference.utc().hour(overlapStart).minute(0).second(0)
    const resultEnd = reference.utc().hour(overlapEnd).minute(0).second(0)

    return { start: resultStart, end: resultEnd }
  }

  /**
   * Get timezone information
   */
  getTimezoneInfo(timezone: string, referenceDate?: DateInput): TimezoneInfo {
    if (this.config.strictValidation) {
      validateTimezone(timezone)
    }

    const date = referenceDate ? dayjs.tz(referenceDate, timezone) : dayjs().tz(timezone)
    const offset = date.utcOffset()

    // Calculate offset string
    const hours = Math.floor(Math.abs(offset) / 60)
    const minutes = Math.abs(offset) % 60
    const sign = offset >= 0 ? '+' : '-'
    const offsetString = `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

    // Detect DST (simplified - compare with standard offset)
    const january = date.month(0).utcOffset()
    const july = date.month(6).utcOffset()
    const standardOffset = Math.min(january, july)
    const isDst = offset !== standardOffset

    return {
      id: timezone,
      offset,
      offsetString,
      abbreviation: date.format('z'),
      isDst
    }
  }

  /**
   * Format date for display with timezone
   */
  formatWithTimezone(
    input: DateInput,
    format: string,
    timezone?: string
  ): string {
    const tz = timezone ?? this.config.displayTimezone

    if (this.config.strictValidation && timezone) {
      validateTimezone(timezone)
    }

    return dayjs.utc(input).tz(tz).format(format)
  }

  /**
   * Parse date string with timezone
   */
  parseWithTimezone(
    dateString: string,
    format: string,
    timezone: string
  ): Dayjs {
    if (this.config.strictValidation) {
      validateTimezone(timezone)
    }

    return dayjs.tz(dateString, format, timezone)
  }

  /**
   * Check if two dates represent the same moment in time
   */
  isSameMoment(date1: DateInput, tz1: string, date2: DateInput, tz2: string): boolean {
    if (this.config.strictValidation) {
      validateTimezone(tz1)
      validateTimezone(tz2)
    }

    const utc1 = dayjs.tz(date1, tz1).utc()
    const utc2 = dayjs.tz(date2, tz2).utc()

    return utc1.isSame(utc2)
  }

  /**
   * Get all supported timezones (common ones)
   */
  static getSupportedTimezones(): string[] {
    return [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Sao_Paulo',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Moscow',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Shanghai',
      'Asia/Hong_Kong',
      'Asia/Tokyo',
      'Asia/Singapore',
      'Australia/Sydney',
      'Pacific/Auckland'
    ]
  }

  /**
   * Update configuration
   */
  configure(updates: Partial<TimezoneServiceConfig>): void {
    if (this.config.strictValidation) {
      if (updates.storageTimezone) {
        validateTimezone(updates.storageTimezone)
      }
      if (updates.displayTimezone) {
        validateTimezone(updates.displayTimezone)
      }
    }

    Object.assign(this.config, updates)
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<TimezoneServiceConfig>> {
    return Object.freeze({ ...this.config })
  }
}

/**
 * Create a pre-configured timezone service
 */
export function createTimezoneService(config?: TimezoneServiceConfig): TimezoneService {
  return new TimezoneService(config)
}

/**
 * Common timezone presets
 */
export const TimezonePresets = {
  US_EAST: 'America/New_York',
  US_CENTRAL: 'America/Chicago',
  US_MOUNTAIN: 'America/Denver',
  US_PACIFIC: 'America/Los_Angeles',
  UK: 'Europe/London',
  CENTRAL_EUROPE: 'Europe/Paris',
  CHINA: 'Asia/Shanghai',
  JAPAN: 'Asia/Tokyo',
  INDIA: 'Asia/Kolkata',
  AUSTRALIA: 'Australia/Sydney'
} as const

export default TimezoneService
