import type { Dayjs, ConfigType, PluginFunc } from 'dayjs'

/**
 * ISO 8601 formatted date string
 * @example "2024-01-15T10:30:00.000Z"
 */
export type ISO8601String = string & { readonly __brand: 'ISO8601String' }

/**
 * Business date wrapper type for enhanced type safety
 */
export interface BusinessDate {
  readonly value: Dayjs
  readonly timezone: string
  readonly locale: string
}

/**
 * Supported locale codes
 */
export type LocaleCode = 'zh-cn' | 'en' | 'ja' | 'ko' | 'de' | 'fr' | 'es' | 'pt' | 'ru' | string

/**
 * Valid IANA timezone identifier
 * @example "Asia/Shanghai", "America/New_York"
 */
export type TimezoneId = string & { readonly __brand: 'TimezoneId' }

/**
 * Holiday definition
 */
export interface Holiday {
  readonly date: string
  readonly name: string
  readonly type: 'public' | 'company' | 'regional'
  readonly recurring?: boolean
}

/**
 * Business rules configuration
 */
export interface BusinessRules {
  readonly workdays: readonly number[]
  readonly holidays: readonly Holiday[]
  readonly fiscalYearStart?: { month: number; day: number }
}

/**
 * Configuration options for dayjs-business instance
 */
export interface DayjsBusinessConfig {
  readonly locale?: LocaleCode
  readonly timezone?: string
  readonly businessRules?: BusinessRules
  readonly plugins?: readonly PluginFunc[]
  readonly strict?: boolean
  readonly debugMode?: boolean
}

/**
 * Factory options passed to createDayjs
 */
export interface CreateDayjsOptions extends DayjsBusinessConfig {
  readonly input?: ConfigType
}

/**
 * Plugin context provided to custom plugins
 */
export interface PluginContext {
  readonly config: Readonly<DayjsBusinessConfig>
  readonly instanceId: string
}

/**
 * Extended Dayjs instance with business methods
 */
export interface BusinessDayjs extends Dayjs {
  readonly $businessConfig: Readonly<DayjsBusinessConfig>
  readonly $instanceId: string

  toBusinessDate(): BusinessDate
  toISO8601(): ISO8601String
  isBusinessDay(): boolean
}

/**
 * Default business rules (Monday to Friday, no holidays)
 */
export const DEFAULT_BUSINESS_RULES: BusinessRules = {
  workdays: [1, 2, 3, 4, 5],
  holidays: []
} as const

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: DayjsBusinessConfig = {
  locale: 'en',
  timezone: 'UTC',
  businessRules: DEFAULT_BUSINESS_RULES,
  plugins: [],
  strict: true,
  debugMode: false
} as const

/**
 * Date input types that can be parsed
 */
export type DateInput = Date | string | number | Dayjs | null | undefined

/**
 * Duration unit types
 */
export type DurationUnit =
  | 'millisecond'
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'

/**
 * Subscription cycle types
 */
export type SubscriptionCycle = 'monthly' | 'quarterly' | 'yearly' | 'weekly'

/**
 * Financial quarter definition
 */
export interface FinancialQuarter {
  readonly quarter: 1 | 2 | 3 | 4
  readonly year: number
  readonly startDate: Dayjs
  readonly endDate: Dayjs
}

/**
 * Date range representation
 */
export interface DateRange {
  readonly start: Dayjs
  readonly end: Dayjs
  readonly label?: string
}

/**
 * Billing date calculation result
 */
export interface BillingDate {
  readonly nextBillingDate: Dayjs
  readonly daysUntilBilling: number
  readonly isTrialPeriod: boolean
}

/**
 * Timezone conversion result
 */
export interface TimezoneConversionResult {
  readonly original: Dayjs
  readonly converted: Dayjs
  readonly sourceTimezone: string
  readonly targetTimezone: string
  readonly offset: number
}
