import type { PluginFunc, Dayjs } from 'dayjs'
import type { FinancialQuarter } from '@dayjs-business/core'

export interface FiscalYearConfig {
  /** Month when fiscal year starts (1-12) */
  startMonth: number
  /** Day when fiscal year starts (1-31) */
  startDay?: number
}

export interface FinancialQuarterMethods {
  fiscalYear(): number
  fiscalQuarter(): 1 | 2 | 3 | 4
  fiscalQuarterInfo(): FinancialQuarter
  startOfFiscalYear(): Dayjs
  endOfFiscalYear(): Dayjs
  startOfFiscalQuarter(): Dayjs
  endOfFiscalQuarter(): Dayjs
  isSameFiscalQuarter(other: Dayjs): boolean
  isSameFiscalYear(other: Dayjs): boolean
  addFiscalQuarters(quarters: number): Dayjs
  subtractFiscalQuarters(quarters: number): Dayjs
  fiscalQuartersBetween(other: Dayjs): number
}

declare module 'dayjs' {
  interface Dayjs extends FinancialQuarterMethods {}
}

// Default: Calendar year (January 1)
const DEFAULT_FISCAL_CONFIG: FiscalYearConfig = {
  startMonth: 1,
  startDay: 1
}

/**
 * Financial Quarter Plugin for dayjs-business
 * Supports custom fiscal year definitions for enterprise accounting
 */
export const financialQuarterPlugin: PluginFunc<FiscalYearConfig> = (
  option,
  dayjsClass,
  _dayjsFactory
) => {
  const config: FiscalYearConfig = {
    startMonth: option?.startMonth ?? DEFAULT_FISCAL_CONFIG.startMonth,
    startDay: option?.startDay ?? DEFAULT_FISCAL_CONFIG.startDay
  }

  /**
   * Calculate fiscal year for a given date
   */
  const calculateFiscalYear = (date: Dayjs): number => {
    const fiscalStartMonth = config.startMonth - 1 // 0-indexed
    const fiscalStartDay = config.startDay ?? 1

    const year = date.year()
    const month = date.month()
    const day = date.date()

    // If current date is before fiscal year start, it belongs to previous fiscal year
    if (month < fiscalStartMonth || (month === fiscalStartMonth && day < fiscalStartDay)) {
      return year
    }

    // If fiscal year starts in Jan, fiscal year equals calendar year
    if (fiscalStartMonth === 0 && fiscalStartDay === 1) {
      return year
    }

    // Otherwise, fiscal year is next calendar year
    return year + 1
  }

  /**
   * Calculate fiscal quarter for a given date
   */
  const calculateFiscalQuarter = (date: Dayjs): 1 | 2 | 3 | 4 => {
    const fiscalStartMonth = config.startMonth - 1 // 0-indexed
    const currentMonth = date.month()

    // Calculate months since fiscal year start
    let monthsFromFiscalStart = currentMonth - fiscalStartMonth
    if (monthsFromFiscalStart < 0) {
      monthsFromFiscalStart += 12
    }

    // Each quarter is 3 months
    const quarterIndex = Math.floor(monthsFromFiscalStart / 3)
    return (quarterIndex + 1) as 1 | 2 | 3 | 4
  }

  /**
   * Get the start date of a fiscal year
   */
  const getFiscalYearStart = (date: Dayjs): Dayjs => {
    const fiscalYear = calculateFiscalYear(date)
    const fiscalStartMonth = config.startMonth - 1
    const fiscalStartDay = config.startDay ?? 1

    // Fiscal year 2024 for a July start would start July 1, 2023
    let startYear = fiscalYear
    if (fiscalStartMonth > 0 || fiscalStartDay > 1) {
      startYear = fiscalYear - 1
    }

    return date.year(startYear).month(fiscalStartMonth).date(fiscalStartDay).startOf('day')
  }

  /**
   * Get the end date of a fiscal year
   */
  const getFiscalYearEnd = (date: Dayjs): Dayjs => {
    const startOfFiscalYear = getFiscalYearStart(date)
    return startOfFiscalYear.add(1, 'year').subtract(1, 'day').endOf('day')
  }

  /**
   * Get the start date of a fiscal quarter
   */
  const getFiscalQuarterStart = (date: Dayjs): Dayjs => {
    const fiscalQuarter = calculateFiscalQuarter(date)
    const startOfFiscalYear = getFiscalYearStart(date)

    // Add months based on quarter (Q1=0, Q2=3, Q3=6, Q4=9)
    const monthsToAdd = (fiscalQuarter - 1) * 3
    return startOfFiscalYear.add(monthsToAdd, 'month').startOf('day')
  }

  /**
   * Get the end date of a fiscal quarter
   */
  const getFiscalQuarterEnd = (date: Dayjs): Dayjs => {
    const startOfQuarter = getFiscalQuarterStart(date)
    return startOfQuarter.add(3, 'month').subtract(1, 'day').endOf('day')
  }

  // Dayjs prototype methods

  dayjsClass.prototype.fiscalYear = function (this: Dayjs): number {
    return calculateFiscalYear(this)
  }

  dayjsClass.prototype.fiscalQuarter = function (this: Dayjs): 1 | 2 | 3 | 4 {
    return calculateFiscalQuarter(this)
  }

  dayjsClass.prototype.fiscalQuarterInfo = function (this: Dayjs): FinancialQuarter {
    return {
      quarter: calculateFiscalQuarter(this),
      year: calculateFiscalYear(this),
      startDate: getFiscalQuarterStart(this),
      endDate: getFiscalQuarterEnd(this)
    }
  }

  dayjsClass.prototype.startOfFiscalYear = function (this: Dayjs): Dayjs {
    return getFiscalYearStart(this)
  }

  dayjsClass.prototype.endOfFiscalYear = function (this: Dayjs): Dayjs {
    return getFiscalYearEnd(this)
  }

  dayjsClass.prototype.startOfFiscalQuarter = function (this: Dayjs): Dayjs {
    return getFiscalQuarterStart(this)
  }

  dayjsClass.prototype.endOfFiscalQuarter = function (this: Dayjs): Dayjs {
    return getFiscalQuarterEnd(this)
  }

  dayjsClass.prototype.isSameFiscalQuarter = function (this: Dayjs, other: Dayjs): boolean {
    return (
      calculateFiscalYear(this) === calculateFiscalYear(other) &&
      calculateFiscalQuarter(this) === calculateFiscalQuarter(other)
    )
  }

  dayjsClass.prototype.isSameFiscalYear = function (this: Dayjs, other: Dayjs): boolean {
    return calculateFiscalYear(this) === calculateFiscalYear(other)
  }

  dayjsClass.prototype.addFiscalQuarters = function (this: Dayjs, quarters: number): Dayjs {
    if (quarters === 0) {
      return this
    }

    // Add 3 months per quarter
    return this.add(quarters * 3, 'month')
  }

  dayjsClass.prototype.subtractFiscalQuarters = function (this: Dayjs, quarters: number): Dayjs {
    return this.addFiscalQuarters(-quarters)
  }

  dayjsClass.prototype.fiscalQuartersBetween = function (this: Dayjs, other: Dayjs): number {
    const thisYear = calculateFiscalYear(this)
    const thisQuarter = calculateFiscalQuarter(this)
    const otherYear = calculateFiscalYear(other)
    const otherQuarter = calculateFiscalQuarter(other)

    const thisTotal = thisYear * 4 + thisQuarter
    const otherTotal = otherYear * 4 + otherQuarter

    return otherTotal - thisTotal
  }
}

/**
 * Create a financial quarter plugin with custom fiscal year configuration
 */
export function createFinancialQuarterPlugin(config: FiscalYearConfig): PluginFunc {
  return (option, dayjsClass, dayjsFactory) => {
    financialQuarterPlugin({ ...config, ...option }, dayjsClass, dayjsFactory)
  }
}

/**
 * Common fiscal year configurations
 */
export const FiscalYearPresets = {
  /** Calendar year (Jan 1 - Dec 31) */
  CALENDAR: { startMonth: 1, startDay: 1 } as FiscalYearConfig,

  /** US Government (Oct 1 - Sep 30) */
  US_GOVERNMENT: { startMonth: 10, startDay: 1 } as FiscalYearConfig,

  /** UK Government (Apr 6 - Apr 5) */
  UK_GOVERNMENT: { startMonth: 4, startDay: 6 } as FiscalYearConfig,

  /** Apple Inc. (Oct 1 - Sep 30) */
  APPLE: { startMonth: 10, startDay: 1 } as FiscalYearConfig,

  /** Microsoft (Jul 1 - Jun 30) */
  MICROSOFT: { startMonth: 7, startDay: 1 } as FiscalYearConfig,

  /** Japan Government (Apr 1 - Mar 31) */
  JAPAN: { startMonth: 4, startDay: 1 } as FiscalYearConfig,

  /** Australia Government (Jul 1 - Jun 30) */
  AUSTRALIA: { startMonth: 7, startDay: 1 } as FiscalYearConfig
} as const

/**
 * Get fiscal year label (e.g., "FY2024")
 */
export function getFiscalYearLabel(date: Dayjs, prefix = 'FY'): string {
  const fiscalYear = date.fiscalYear()
  return `${prefix}${fiscalYear}`
}

/**
 * Get fiscal quarter label (e.g., "Q1 FY2024")
 */
export function getFiscalQuarterLabel(date: Dayjs, prefix = 'FY'): string {
  const fiscalYear = date.fiscalYear()
  const fiscalQuarter = date.fiscalQuarter()
  return `Q${fiscalQuarter} ${prefix}${fiscalYear}`
}

/**
 * Get all quarters in a fiscal year
 */
export function getFiscalYearQuarters(date: Dayjs): FinancialQuarter[] {
  const quarters: FinancialQuarter[] = []
  const startOfYear = date.startOfFiscalYear()

  for (let i = 0; i < 4; i++) {
    const quarterStart = startOfYear.add(i * 3, 'month')
    quarters.push(quarterStart.fiscalQuarterInfo())
  }

  return quarters
}

export default financialQuarterPlugin
