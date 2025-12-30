/**
 * dayjs-business
 * Enterprise-grade Day.js wrapper for B2B scenarios
 *
 * @packageDocumentation
 */

// Re-export everything from core
export {
  // Factory
  DayjsFactory,
  createDayjsFactory,
  createDayjs,
  ValidationError,

  // Types
  type ISO8601String,
  type BusinessDate,
  type LocaleCode,
  type TimezoneId,
  type Holiday,
  type BusinessRules,
  type DayjsBusinessConfig,
  type CreateDayjsOptions,
  type PluginContext,
  type BusinessDayjs,
  type DateInput,
  type DurationUnit,
  type SubscriptionCycle,
  type FinancialQuarter,
  type DateRange,
  type BillingDate,
  type TimezoneConversionResult,

  // Constants
  DEFAULT_BUSINESS_RULES,
  DEFAULT_CONFIG,

  // Validators
  validateTimezone,
  validateLocale,
  validateDateInput,
  validateISO8601,
  validateBusinessRules,
  validateHoliday,
  sanitizeString,
  validatePositiveInteger,
  validateRange
} from '@dayjs-business/core'

// Re-export plugins
export { businessDayPlugin, createBusinessDayPlugin } from '@dayjs-business/plugin-business-day'
export {
  financialQuarterPlugin,
  createFinancialQuarterPlugin,
  FiscalYearPresets
} from '@dayjs-business/plugin-financial-quarter'
export {
  subscriptionCyclePlugin,
  createSubscriptionCyclePlugin
} from '@dayjs-business/plugin-subscription-cycle'
export { dataRangePlugin, createDataRangePlugin } from '@dayjs-business/plugin-data-range'

// Re-export services
export { TimezoneService, createTimezoneService, TimezonePresets } from '@dayjs-business/service-timezone'
export { BillingDateService, createBillingService } from '@dayjs-business/service-billing'
export { AnalyticsRangeService, createAnalyticsService, QuickRanges } from '@dayjs-business/service-analytics'

// Re-export utils
export {
  batchFormat,
  smartFormat,
  relativeFormat,
  formatDuration,
  formatters,
  validateDate,
  validateDateRange,
  isToday,
  isPast,
  isFuture,
  isWeekend,
  isWeekday,
  parseDate,
  toISO8601,
  dateDiff,
  addDuration,
  subtractDuration,
  getDatesBetween,
  minDate,
  maxDate,
  sortDatesAsc,
  sortDatesDesc,
  calculateAge
} from '@dayjs-business/utils'
