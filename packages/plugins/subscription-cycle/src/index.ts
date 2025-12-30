import type { PluginFunc, Dayjs } from 'dayjs'
import type { SubscriptionCycle, BillingDate } from '@dayjs-business/core'

export interface SubscriptionConfig {
  /** Billing day of month (1-31) */
  billingDay?: number
  /** Whether to skip weekends for billing */
  skipWeekends?: boolean
  /** Grace period in days after billing date */
  gracePeriod?: number
  /** Trial period in days */
  trialPeriod?: number
}

export interface SubscriptionInfo {
  cycle: SubscriptionCycle
  startDate: Dayjs
  endDate: Dayjs
  billingDate: Dayjs
  isTrialPeriod: boolean
  daysRemaining: number
  cycleNumber: number
}

export interface SubscriptionCycleMethods {
  nextBillingDate(cycle: SubscriptionCycle, billingDay?: number): Dayjs
  previousBillingDate(cycle: SubscriptionCycle, billingDay?: number): Dayjs
  subscriptionInfo(
    subscriptionStart: Dayjs,
    cycle: SubscriptionCycle,
    billingDay?: number
  ): SubscriptionInfo
  isInTrialPeriod(subscriptionStart: Dayjs, trialDays: number): boolean
  daysUntilBilling(cycle: SubscriptionCycle, billingDay?: number): number
  cycleStartDate(cycle: SubscriptionCycle, billingDay?: number): Dayjs
  cycleEndDate(cycle: SubscriptionCycle, billingDay?: number): Dayjs
  alignToBillingDay(billingDay: number): Dayjs
}

declare module 'dayjs' {
  interface Dayjs extends SubscriptionCycleMethods {}
}

const DEFAULT_BILLING_DAY = 1

/**
 * Subscription Cycle Plugin for dayjs-business
 * Handles billing cycles, trial periods, and subscription management
 */
export const subscriptionCyclePlugin: PluginFunc<SubscriptionConfig> = (
  option,
  dayjsClass,
  _dayjsFactory
) => {
  const config: SubscriptionConfig = {
    billingDay: option?.billingDay ?? DEFAULT_BILLING_DAY,
    skipWeekends: option?.skipWeekends ?? false,
    gracePeriod: option?.gracePeriod ?? 0,
    trialPeriod: option?.trialPeriod ?? 0
  }

  /**
   * Get the duration of a cycle in months
   */
  const getCycleMonths = (cycle: SubscriptionCycle): number => {
    switch (cycle) {
      case 'weekly':
        return 0 // Handled separately
      case 'monthly':
        return 1
      case 'quarterly':
        return 3
      case 'yearly':
        return 12
    }
  }

  /**
   * Adjust billing day for months with fewer days
   */
  const adjustBillingDay = (date: Dayjs, targetDay: number): Dayjs => {
    const daysInMonth = date.daysInMonth()
    const actualDay = Math.min(targetDay, daysInMonth)
    return date.date(actualDay)
  }

  /**
   * Skip to next business day if needed
   */
  const skipWeekendIfNeeded = (date: Dayjs): Dayjs => {
    if (!config.skipWeekends) {
      return date
    }

    let adjusted = date
    const dayOfWeek = adjusted.day()

    // Saturday -> Monday
    if (dayOfWeek === 6) {
      adjusted = adjusted.add(2, 'day')
    }
    // Sunday -> Monday
    else if (dayOfWeek === 0) {
      adjusted = adjusted.add(1, 'day')
    }

    return adjusted
  }

  /**
   * Calculate next billing date
   */
  dayjsClass.prototype.nextBillingDate = function (
    this: Dayjs,
    cycle: SubscriptionCycle,
    billingDay?: number
  ): Dayjs {
    const day = billingDay ?? config.billingDay ?? DEFAULT_BILLING_DAY

    if (cycle === 'weekly') {
      // For weekly, billing is on the same day of week as the start
      const daysUntilNext = 7 - ((this.day() - day + 7) % 7)
      let next = this.add(daysUntilNext === 7 ? 0 : daysUntilNext, 'day')
      if (next.isSame(this, 'day') || next.isBefore(this)) {
        next = next.add(7, 'day')
      }
      return skipWeekendIfNeeded(next.startOf('day'))
    }

    const months = getCycleMonths(cycle)
    let nextDate = this.add(1, 'month').date(1)
    nextDate = adjustBillingDay(nextDate, day)

    // If the calculated date is before or same as current, move forward
    if (nextDate.isBefore(this) || nextDate.isSame(this, 'day')) {
      nextDate = nextDate.add(months, 'month')
      nextDate = adjustBillingDay(nextDate, day)
    }

    return skipWeekendIfNeeded(nextDate.startOf('day'))
  }

  /**
   * Calculate previous billing date
   */
  dayjsClass.prototype.previousBillingDate = function (
    this: Dayjs,
    cycle: SubscriptionCycle,
    billingDay?: number
  ): Dayjs {
    const day = billingDay ?? config.billingDay ?? DEFAULT_BILLING_DAY

    if (cycle === 'weekly') {
      const daysSinceLast = (this.day() - day + 7) % 7
      const prev = this.subtract(daysSinceLast === 0 ? 7 : daysSinceLast, 'day')
      return skipWeekendIfNeeded(prev.startOf('day'))
    }

    const months = getCycleMonths(cycle)
    let prevDate = this.date(1)
    prevDate = adjustBillingDay(prevDate, day)

    // If the calculated date is after or same as current, move backward
    if (prevDate.isAfter(this) || prevDate.isSame(this, 'day')) {
      prevDate = prevDate.subtract(months, 'month')
      prevDate = adjustBillingDay(prevDate, day)
    }

    return skipWeekendIfNeeded(prevDate.startOf('day'))
  }

  /**
   * Get subscription information
   */
  dayjsClass.prototype.subscriptionInfo = function (
    this: Dayjs,
    subscriptionStart: Dayjs,
    cycle: SubscriptionCycle,
    billingDay?: number
  ): SubscriptionInfo {
    const day = billingDay ?? config.billingDay ?? DEFAULT_BILLING_DAY
    const trialDays = config.trialPeriod ?? 0

    const isInTrial = trialDays > 0 && this.diff(subscriptionStart, 'day') < trialDays

    const cycleStart = this.previousBillingDate(cycle, day)
    const cycleEnd = this.nextBillingDate(cycle, day).subtract(1, 'day')
    const nextBilling = this.nextBillingDate(cycle, day)

    // Calculate cycle number
    let cycleNumber = 1
    if (cycle === 'weekly') {
      cycleNumber = Math.floor(this.diff(subscriptionStart, 'week')) + 1
    } else {
      const months = getCycleMonths(cycle)
      cycleNumber = Math.floor(this.diff(subscriptionStart, 'month') / months) + 1
    }

    return {
      cycle,
      startDate: cycleStart,
      endDate: cycleEnd,
      billingDate: nextBilling,
      isTrialPeriod: isInTrial,
      daysRemaining: nextBilling.diff(this, 'day'),
      cycleNumber: Math.max(1, cycleNumber)
    }
  }

  /**
   * Check if date is in trial period
   */
  dayjsClass.prototype.isInTrialPeriod = function (
    this: Dayjs,
    subscriptionStart: Dayjs,
    trialDays: number
  ): boolean {
    const daysSinceStart = this.diff(subscriptionStart, 'day')
    return daysSinceStart >= 0 && daysSinceStart < trialDays
  }

  /**
   * Calculate days until next billing
   */
  dayjsClass.prototype.daysUntilBilling = function (
    this: Dayjs,
    cycle: SubscriptionCycle,
    billingDay?: number
  ): number {
    const nextBilling = this.nextBillingDate(cycle, billingDay)
    return nextBilling.diff(this, 'day')
  }

  /**
   * Get current cycle start date
   */
  dayjsClass.prototype.cycleStartDate = function (
    this: Dayjs,
    cycle: SubscriptionCycle,
    billingDay?: number
  ): Dayjs {
    return this.previousBillingDate(cycle, billingDay)
  }

  /**
   * Get current cycle end date
   */
  dayjsClass.prototype.cycleEndDate = function (
    this: Dayjs,
    cycle: SubscriptionCycle,
    billingDay?: number
  ): Dayjs {
    return this.nextBillingDate(cycle, billingDay).subtract(1, 'day')
  }

  /**
   * Align date to specific billing day
   */
  dayjsClass.prototype.alignToBillingDay = function (this: Dayjs, billingDay: number): Dayjs {
    return adjustBillingDay(this, billingDay)
  }
}

/**
 * Create subscription cycle plugin with custom configuration
 */
export function createSubscriptionCyclePlugin(config: SubscriptionConfig): PluginFunc {
  return (option, dayjsClass, dayjsFactory) => {
    subscriptionCyclePlugin({ ...config, ...option }, dayjsClass, dayjsFactory)
  }
}

/**
 * Calculate prorated amount for partial cycle
 */
export function calculateProratedAmount(
  totalAmount: number,
  cycleStart: Dayjs,
  cycleEnd: Dayjs,
  effectiveDate: Dayjs
): number {
  const totalDays = cycleEnd.diff(cycleStart, 'day') + 1
  const remainingDays = cycleEnd.diff(effectiveDate, 'day') + 1

  if (remainingDays <= 0) return 0
  if (remainingDays >= totalDays) return totalAmount

  return (totalAmount * remainingDays) / totalDays
}

/**
 * Get all billing dates in a date range
 */
export function getBillingDatesInRange(
  start: Dayjs,
  end: Dayjs,
  cycle: SubscriptionCycle,
  billingDay = 1
): Dayjs[] {
  const dates: Dayjs[] = []
  let current = start.nextBillingDate(cycle, billingDay)

  while (current.isBefore(end) || current.isSame(end, 'day')) {
    dates.push(current)
    current = current.nextBillingDate(cycle, billingDay)
  }

  return dates
}

/**
 * Calculate subscription renewal date considering trial period
 */
export function calculateRenewalDate(
  subscriptionStart: Dayjs,
  cycle: SubscriptionCycle,
  trialDays = 0,
  billingDay?: number
): Dayjs {
  // Add trial period first
  const afterTrial = subscriptionStart.add(trialDays, 'day')

  // Then calculate next billing date
  return afterTrial.nextBillingDate(cycle, billingDay)
}

/**
 * Check if subscription is due for renewal
 */
export function isDueForRenewal(
  currentDate: Dayjs,
  cycle: SubscriptionCycle,
  billingDay?: number,
  gracePeriodDays = 0
): boolean {
  const nextBilling = currentDate.nextBillingDate(cycle, billingDay)
  const daysUntilBilling = nextBilling.diff(currentDate, 'day')

  return daysUntilBilling <= gracePeriodDays
}

export default subscriptionCyclePlugin
