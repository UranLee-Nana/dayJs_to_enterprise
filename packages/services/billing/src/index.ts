import dayjs, { Dayjs } from 'dayjs'
import type { SubscriptionCycle, BillingDate, DateInput } from '@dayjs-business/core'

export interface BillingServiceConfig {
  /** Default billing day of month (1-31) */
  defaultBillingDay?: number
  /** Whether to skip weekends for billing */
  skipWeekends?: boolean
  /** Whether to skip holidays for billing */
  skipHolidays?: boolean
  /** Holiday dates (YYYY-MM-DD format) */
  holidays?: string[]
  /** Grace period in days */
  gracePeriodDays?: number
  /** Default trial period in days */
  defaultTrialDays?: number
}

export interface BillingCycleInfo {
  currentCycleStart: Dayjs
  currentCycleEnd: Dayjs
  nextBillingDate: Dayjs
  previousBillingDate: Dayjs
  daysUntilBilling: number
  daysInCurrentCycle: number
  cycleProgress: number // 0-1
}

export interface ProrationInfo {
  totalDays: number
  usedDays: number
  remainingDays: number
  proratedAmount: number
  dailyRate: number
}

export interface TrialPeriodInfo {
  isInTrial: boolean
  trialStartDate: Dayjs
  trialEndDate: Dayjs
  daysRemaining: number
  trialProgress: number // 0-1
}

export interface SubscriptionSchedule {
  billingDates: Dayjs[]
  totalCycles: number
  totalAmount: number
}

/**
 * BillingDateService - Enterprise billing date management
 * Handles billing dates, trial periods, proration, and subscription management
 */
export class BillingDateService {
  private readonly config: Required<BillingServiceConfig>

  constructor(config: BillingServiceConfig = {}) {
    this.config = {
      defaultBillingDay: config.defaultBillingDay ?? 1,
      skipWeekends: config.skipWeekends ?? false,
      skipHolidays: config.skipHolidays ?? false,
      holidays: config.holidays ?? [],
      gracePeriodDays: config.gracePeriodDays ?? 0,
      defaultTrialDays: config.defaultTrialDays ?? 0
    }
  }

  /**
   * Adjust date if it falls on weekend or holiday
   */
  private adjustForNonBusinessDay(date: Dayjs): Dayjs {
    let adjusted = date

    // Skip weekends
    if (this.config.skipWeekends) {
      const dayOfWeek = adjusted.day()
      if (dayOfWeek === 0) {
        // Sunday -> Monday
        adjusted = adjusted.add(1, 'day')
      } else if (dayOfWeek === 6) {
        // Saturday -> Monday
        adjusted = adjusted.add(2, 'day')
      }
    }

    // Skip holidays
    if (this.config.skipHolidays && this.config.holidays.length > 0) {
      let attempts = 0
      while (this.isHoliday(adjusted) && attempts < 30) {
        adjusted = adjusted.add(1, 'day')
        attempts++

        // Re-check weekends after holiday adjustment
        if (this.config.skipWeekends) {
          const dayOfWeek = adjusted.day()
          if (dayOfWeek === 0) {
            adjusted = adjusted.add(1, 'day')
          } else if (dayOfWeek === 6) {
            adjusted = adjusted.add(2, 'day')
          }
        }
      }
    }

    return adjusted
  }

  /**
   * Check if date is a holiday
   */
  private isHoliday(date: Dayjs): boolean {
    const dateStr = date.format('YYYY-MM-DD')
    return this.config.holidays.includes(dateStr)
  }

  /**
   * Adjust billing day for months with fewer days
   */
  private adjustBillingDay(date: Dayjs, targetDay: number): Dayjs {
    const daysInMonth = date.daysInMonth()
    const actualDay = Math.min(targetDay, daysInMonth)
    return date.date(actualDay)
  }

  /**
   * Get cycle duration in months
   */
  private getCycleMonths(cycle: SubscriptionCycle): number {
    switch (cycle) {
      case 'weekly':
        return 0
      case 'monthly':
        return 1
      case 'quarterly':
        return 3
      case 'yearly':
        return 12
    }
  }

  /**
   * Calculate next billing date
   */
  getNextBillingDate(
    fromDate: DateInput,
    cycle: SubscriptionCycle,
    billingDay?: number
  ): Dayjs {
    const from = dayjs(fromDate)
    const day = billingDay ?? this.config.defaultBillingDay

    if (cycle === 'weekly') {
      let next = from.add(7, 'day')
      return this.adjustForNonBusinessDay(next.startOf('day'))
    }

    const months = this.getCycleMonths(cycle)
    let nextDate = from.add(1, 'day').startOf('month')
    nextDate = this.adjustBillingDay(nextDate, day)

    // If the calculated date is before current, move forward by cycle
    while (nextDate.isBefore(from) || nextDate.isSame(from, 'day')) {
      nextDate = nextDate.add(months || 1, 'month')
      nextDate = this.adjustBillingDay(nextDate, day)
    }

    return this.adjustForNonBusinessDay(nextDate.startOf('day'))
  }

  /**
   * Calculate previous billing date
   */
  getPreviousBillingDate(
    fromDate: DateInput,
    cycle: SubscriptionCycle,
    billingDay?: number
  ): Dayjs {
    const from = dayjs(fromDate)
    const day = billingDay ?? this.config.defaultBillingDay

    if (cycle === 'weekly') {
      const prev = from.subtract(7, 'day')
      return this.adjustForNonBusinessDay(prev.startOf('day'))
    }

    const months = this.getCycleMonths(cycle)
    let prevDate = from.startOf('month')
    prevDate = this.adjustBillingDay(prevDate, day)

    // If the calculated date is after current, move backward
    if (prevDate.isAfter(from) || prevDate.isSame(from, 'day')) {
      prevDate = prevDate.subtract(months || 1, 'month')
      prevDate = this.adjustBillingDay(prevDate, day)
    }

    return this.adjustForNonBusinessDay(prevDate.startOf('day'))
  }

  /**
   * Get comprehensive billing cycle information
   */
  getBillingCycleInfo(
    currentDate: DateInput,
    cycle: SubscriptionCycle,
    billingDay?: number
  ): BillingCycleInfo {
    const current = dayjs(currentDate)
    const nextBilling = this.getNextBillingDate(current, cycle, billingDay)
    const previousBilling = this.getPreviousBillingDate(current, cycle, billingDay)

    const daysInCycle = nextBilling.diff(previousBilling, 'day')
    const daysUsed = current.diff(previousBilling, 'day')
    const daysRemaining = nextBilling.diff(current, 'day')

    return {
      currentCycleStart: previousBilling,
      currentCycleEnd: nextBilling.subtract(1, 'day'),
      nextBillingDate: nextBilling,
      previousBillingDate: previousBilling,
      daysUntilBilling: daysRemaining,
      daysInCurrentCycle: daysInCycle,
      cycleProgress: daysUsed / daysInCycle
    }
  }

  /**
   * Calculate prorated amount
   */
  calculateProration(
    subscriptionStart: DateInput,
    cycleEnd: DateInput,
    fullAmount: number
  ): ProrationInfo {
    const start = dayjs(subscriptionStart)
    const end = dayjs(cycleEnd)
    const cycleStart = start.startOf('month')

    const totalDays = end.diff(cycleStart, 'day') + 1
    const remainingDays = end.diff(start, 'day') + 1
    const usedDays = totalDays - remainingDays

    const dailyRate = fullAmount / totalDays
    const proratedAmount = dailyRate * remainingDays

    return {
      totalDays,
      usedDays,
      remainingDays,
      proratedAmount: Math.round(proratedAmount * 100) / 100,
      dailyRate: Math.round(dailyRate * 100) / 100
    }
  }

  /**
   * Get trial period information
   */
  getTrialPeriodInfo(
    subscriptionStart: DateInput,
    currentDate: DateInput,
    trialDays?: number
  ): TrialPeriodInfo {
    const start = dayjs(subscriptionStart)
    const current = dayjs(currentDate)
    const trial = trialDays ?? this.config.defaultTrialDays

    const trialEndDate = start.add(trial, 'day')
    const daysSinceStart = current.diff(start, 'day')
    const daysRemaining = Math.max(0, trial - daysSinceStart)

    return {
      isInTrial: daysSinceStart >= 0 && daysSinceStart < trial,
      trialStartDate: start,
      trialEndDate,
      daysRemaining,
      trialProgress: Math.min(1, daysSinceStart / trial)
    }
  }

  /**
   * Calculate billing date after trial period
   */
  getBillingDateAfterTrial(
    subscriptionStart: DateInput,
    cycle: SubscriptionCycle,
    trialDays?: number,
    billingDay?: number
  ): BillingDate {
    const start = dayjs(subscriptionStart)
    const trial = trialDays ?? this.config.defaultTrialDays

    const trialEndDate = start.add(trial, 'day')
    const nextBillingDate = this.getNextBillingDate(trialEndDate, cycle, billingDay)
    const daysUntilBilling = nextBillingDate.diff(dayjs(), 'day')

    return {
      nextBillingDate,
      daysUntilBilling,
      isTrialPeriod: dayjs().isBefore(trialEndDate)
    }
  }

  /**
   * Generate subscription billing schedule
   */
  generateBillingSchedule(
    startDate: DateInput,
    endDate: DateInput,
    cycle: SubscriptionCycle,
    amountPerCycle: number,
    billingDay?: number
  ): SubscriptionSchedule {
    const billingDates: Dayjs[] = []
    const start = dayjs(startDate)
    const end = dayjs(endDate)

    let currentBilling = this.getNextBillingDate(start, cycle, billingDay)

    while (currentBilling.isBefore(end) || currentBilling.isSame(end, 'day')) {
      billingDates.push(currentBilling)
      currentBilling = this.getNextBillingDate(currentBilling, cycle, billingDay)
    }

    return {
      billingDates,
      totalCycles: billingDates.length,
      totalAmount: billingDates.length * amountPerCycle
    }
  }

  /**
   * Check if billing is due (within grace period)
   */
  isBillingDue(
    currentDate: DateInput,
    cycle: SubscriptionCycle,
    billingDay?: number
  ): boolean {
    const current = dayjs(currentDate)
    const nextBilling = this.getNextBillingDate(current, cycle, billingDay)
    const daysUntilBilling = nextBilling.diff(current, 'day')

    return daysUntilBilling <= this.config.gracePeriodDays
  }

  /**
   * Check if subscription is overdue
   */
  isOverdue(
    lastPaymentDate: DateInput,
    cycle: SubscriptionCycle,
    currentDate?: DateInput
  ): boolean {
    const lastPayment = dayjs(lastPaymentDate)
    const current = currentDate ? dayjs(currentDate) : dayjs()
    const expectedNextPayment = this.getNextBillingDate(lastPayment, cycle)

    return current.isAfter(expectedNextPayment.add(this.config.gracePeriodDays, 'day'))
  }

  /**
   * Align billing day to valid date for the month
   */
  alignBillingDay(date: DateInput, billingDay?: number): Dayjs {
    const d = dayjs(date)
    const day = billingDay ?? this.config.defaultBillingDay
    return this.adjustBillingDay(d, day)
  }

  /**
   * Update holidays configuration
   */
  setHolidays(holidays: string[]): void {
    this.config.holidays = holidays
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<BillingServiceConfig>> {
    return Object.freeze({ ...this.config })
  }
}

/**
 * Create a pre-configured billing service
 */
export function createBillingService(config?: BillingServiceConfig): BillingDateService {
  return new BillingDateService(config)
}

/**
 * Calculate days between two billing dates
 */
export function daysBetweenBillingDates(date1: DateInput, date2: DateInput): number {
  return Math.abs(dayjs(date2).diff(dayjs(date1), 'day'))
}

/**
 * Get all billing dates in a year
 */
export function getAnnualBillingDates(
  year: number,
  cycle: SubscriptionCycle,
  billingDay = 1
): Dayjs[] {
  const service = new BillingDateService({ defaultBillingDay: billingDay })
  const startOfYear = dayjs().year(year).startOf('year')
  const endOfYear = dayjs().year(year).endOf('year')

  return service.generateBillingSchedule(startOfYear, endOfYear, cycle, 0, billingDay).billingDates
}

export default BillingDateService
