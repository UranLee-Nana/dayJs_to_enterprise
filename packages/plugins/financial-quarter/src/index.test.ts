import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import {
  financialQuarterPlugin,
  createFinancialQuarterPlugin,
  FiscalYearPresets,
  getFiscalYearLabel,
  getFiscalQuarterLabel,
  getFiscalYearQuarters
} from '../src'

dayjs.extend(quarterOfYear)
dayjs.extend(financialQuarterPlugin)

describe('financialQuarterPlugin', () => {
  describe('fiscalYear (default calendar year)', () => {
    it('should return calendar year for January date', () => {
      const date = dayjs('2024-01-15')
      expect(date.fiscalYear()).toBe(2024)
    })

    it('should return calendar year for December date', () => {
      const date = dayjs('2024-12-15')
      expect(date.fiscalYear()).toBe(2024)
    })
  })

  describe('fiscalQuarter (default calendar year)', () => {
    it('should return Q1 for January-March', () => {
      expect(dayjs('2024-01-15').fiscalQuarter()).toBe(1)
      expect(dayjs('2024-02-15').fiscalQuarter()).toBe(1)
      expect(dayjs('2024-03-15').fiscalQuarter()).toBe(1)
    })

    it('should return Q2 for April-June', () => {
      expect(dayjs('2024-04-15').fiscalQuarter()).toBe(2)
      expect(dayjs('2024-05-15').fiscalQuarter()).toBe(2)
      expect(dayjs('2024-06-15').fiscalQuarter()).toBe(2)
    })

    it('should return Q3 for July-September', () => {
      expect(dayjs('2024-07-15').fiscalQuarter()).toBe(3)
      expect(dayjs('2024-08-15').fiscalQuarter()).toBe(3)
      expect(dayjs('2024-09-15').fiscalQuarter()).toBe(3)
    })

    it('should return Q4 for October-December', () => {
      expect(dayjs('2024-10-15').fiscalQuarter()).toBe(4)
      expect(dayjs('2024-11-15').fiscalQuarter()).toBe(4)
      expect(dayjs('2024-12-15').fiscalQuarter()).toBe(4)
    })
  })

  describe('fiscalQuarterInfo', () => {
    it('should return complete quarter info', () => {
      const date = dayjs('2024-02-15')
      const info = date.fiscalQuarterInfo()

      expect(info.quarter).toBe(1)
      expect(info.year).toBe(2024)
      expect(info.startDate.format('YYYY-MM-DD')).toBe('2024-01-01')
      expect(info.endDate.format('YYYY-MM-DD')).toBe('2024-03-31')
    })
  })

  describe('startOfFiscalYear', () => {
    it('should return January 1 for calendar year', () => {
      const date = dayjs('2024-06-15')
      expect(date.startOfFiscalYear().format('YYYY-MM-DD')).toBe('2024-01-01')
    })
  })

  describe('endOfFiscalYear', () => {
    it('should return December 31 for calendar year', () => {
      const date = dayjs('2024-06-15')
      expect(date.endOfFiscalYear().format('YYYY-MM-DD')).toBe('2024-12-31')
    })
  })

  describe('startOfFiscalQuarter', () => {
    it('should return start of Q1', () => {
      const date = dayjs('2024-02-15')
      expect(date.startOfFiscalQuarter().format('YYYY-MM-DD')).toBe('2024-01-01')
    })

    it('should return start of Q2', () => {
      const date = dayjs('2024-05-15')
      expect(date.startOfFiscalQuarter().format('YYYY-MM-DD')).toBe('2024-04-01')
    })
  })

  describe('endOfFiscalQuarter', () => {
    it('should return end of Q1', () => {
      const date = dayjs('2024-02-15')
      expect(date.endOfFiscalQuarter().format('YYYY-MM-DD')).toBe('2024-03-31')
    })
  })

  describe('isSameFiscalQuarter', () => {
    it('should return true for same quarter', () => {
      const date1 = dayjs('2024-01-15')
      const date2 = dayjs('2024-02-20')
      expect(date1.isSameFiscalQuarter(date2)).toBe(true)
    })

    it('should return false for different quarters', () => {
      const date1 = dayjs('2024-01-15')
      const date2 = dayjs('2024-04-15')
      expect(date1.isSameFiscalQuarter(date2)).toBe(false)
    })
  })

  describe('isSameFiscalYear', () => {
    it('should return true for same year', () => {
      const date1 = dayjs('2024-01-15')
      const date2 = dayjs('2024-12-15')
      expect(date1.isSameFiscalYear(date2)).toBe(true)
    })

    it('should return false for different years', () => {
      const date1 = dayjs('2024-01-15')
      const date2 = dayjs('2023-12-15')
      expect(date1.isSameFiscalYear(date2)).toBe(false)
    })
  })

  describe('addFiscalQuarters', () => {
    it('should add quarters', () => {
      const date = dayjs('2024-01-15')
      const result = date.addFiscalQuarters(1)
      expect(result.format('YYYY-MM-DD')).toBe('2024-04-15')
    })

    it('should handle year boundary', () => {
      const date = dayjs('2024-10-15')
      const result = date.addFiscalQuarters(2)
      expect(result.format('YYYY-MM-DD')).toBe('2025-04-15')
    })
  })

  describe('subtractFiscalQuarters', () => {
    it('should subtract quarters', () => {
      const date = dayjs('2024-07-15')
      const result = date.subtractFiscalQuarters(1)
      expect(result.format('YYYY-MM-DD')).toBe('2024-04-15')
    })
  })

  describe('fiscalQuartersBetween', () => {
    it('should calculate quarters between dates', () => {
      const date1 = dayjs('2024-01-15')
      const date2 = dayjs('2024-10-15')
      expect(date1.fiscalQuartersBetween(date2)).toBe(3)
    })
  })
})

describe('createFinancialQuarterPlugin', () => {
  it('should create plugin with custom fiscal year', () => {
    const plugin = createFinancialQuarterPlugin(FiscalYearPresets.MICROSOFT)
    expect(plugin).toBeTypeOf('function')
  })
})

describe('FiscalYearPresets', () => {
  it('should have calendar preset', () => {
    expect(FiscalYearPresets.CALENDAR).toEqual({ startMonth: 1, startDay: 1 })
  })

  it('should have US Government preset', () => {
    expect(FiscalYearPresets.US_GOVERNMENT).toEqual({ startMonth: 10, startDay: 1 })
  })

  it('should have Japan preset', () => {
    expect(FiscalYearPresets.JAPAN).toEqual({ startMonth: 4, startDay: 1 })
  })
})

describe('getFiscalYearLabel', () => {
  it('should generate fiscal year label', () => {
    const date = dayjs('2024-06-15')
    dayjs.extend(financialQuarterPlugin)
    expect(getFiscalYearLabel(date)).toBe('FY2024')
  })

  it('should accept custom prefix', () => {
    const date = dayjs('2024-06-15')
    expect(getFiscalYearLabel(date, 'Fiscal ')).toBe('Fiscal 2024')
  })
})

describe('getFiscalQuarterLabel', () => {
  it('should generate fiscal quarter label', () => {
    const date = dayjs('2024-02-15')
    expect(getFiscalQuarterLabel(date)).toBe('Q1 FY2024')
  })
})

describe('getFiscalYearQuarters', () => {
  it('should return all 4 quarters', () => {
    const date = dayjs('2024-06-15')
    const quarters = getFiscalYearQuarters(date)
    expect(quarters.length).toBe(4)
    expect(quarters[0]?.quarter).toBe(1)
    expect(quarters[3]?.quarter).toBe(4)
  })
})
