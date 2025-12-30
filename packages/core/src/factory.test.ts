import { describe, it, expect, beforeEach } from 'vitest'
import {
  DayjsFactory,
  createDayjsFactory,
  createDayjs,
  ValidationError,
  DEFAULT_BUSINESS_RULES
} from '../src'

describe('DayjsFactory', () => {
  let factory: DayjsFactory

  beforeEach(() => {
    factory = new DayjsFactory()
  })

  describe('constructor', () => {
    it('should create factory with default config', () => {
      const config = factory.getConfig()
      expect(config.locale).toBe('en')
      expect(config.timezone).toBe('UTC')
      expect(config.strict).toBe(true)
    })

    it('should create factory with custom config', () => {
      const customFactory = new DayjsFactory({
        locale: 'zh-cn',
        timezone: 'Asia/Shanghai'
      })
      const config = customFactory.getConfig()
      expect(config.locale).toBe('zh-cn')
      expect(config.timezone).toBe('Asia/Shanghai')
    })

    it('should generate unique instance ID', () => {
      const factory1 = new DayjsFactory()
      const factory2 = new DayjsFactory()
      expect(factory1.getInstanceId()).not.toBe(factory2.getInstanceId())
    })
  })

  describe('create', () => {
    it('should create dayjs instance', () => {
      const instance = factory.create()
      expect(instance).toBeDefined()
      expect(instance.isValid()).toBe(true)
    })

    it('should create instance from date string', () => {
      const instance = factory.create({ input: '2024-01-15' })
      expect(instance.format('YYYY-MM-DD')).toBe('2024-01-15')
    })

    it('should create instance from Date object', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const instance = factory.create({ input: date })
      expect(instance.isValid()).toBe(true)
    })

    it('should create instance with custom timezone', () => {
      const instance = factory.create({
        input: '2024-01-15T10:00:00',
        timezone: 'America/New_York'
      })
      expect(instance.isValid()).toBe(true)
    })
  })

  describe('parse', () => {
    it('should parse valid date string', () => {
      const instance = factory.parse('2024-06-15')
      expect(instance.format('YYYY-MM-DD')).toBe('2024-06-15')
    })

    it('should parse ISO 8601 date', () => {
      const instance = factory.parse('2024-06-15T14:30:00Z')
      expect(instance.isValid()).toBe(true)
    })
  })

  describe('now', () => {
    it('should return current date/time', () => {
      const now = factory.now()
      expect(now.isValid()).toBe(true)
    })
  })

  describe('utc', () => {
    it('should create UTC instance', () => {
      const utcInstance = factory.utc()
      expect(utcInstance.isValid()).toBe(true)
    })

    it('should create UTC instance from input', () => {
      const utcInstance = factory.utc('2024-01-15T10:00:00')
      expect(utcInstance.isValid()).toBe(true)
    })
  })

  describe('configure', () => {
    it('should update configuration', () => {
      factory.configure({ locale: 'ja' })
      expect(factory.getConfig().locale).toBe('ja')
    })

    it('should validate timezone on configure', () => {
      expect(() => {
        factory.configure({ timezone: 'invalid' })
      }).toThrow(ValidationError)
    })
  })

  describe('BusinessDayjs extensions', () => {
    it('should have toBusinessDate method', () => {
      const instance = factory.create()
      const businessDate = instance.toBusinessDate()
      expect(businessDate.timezone).toBe('UTC')
      expect(businessDate.locale).toBe('en')
    })

    it('should have toISO8601 method', () => {
      const instance = factory.create({ input: '2024-01-15T10:30:00Z' })
      const iso = instance.toISO8601()
      expect(typeof iso).toBe('string')
      expect(iso).toContain('2024-01-15')
    })

    it('should have isBusinessDay method', () => {
      // Monday
      const monday = factory.create({ input: '2024-01-15' })
      expect(monday.isBusinessDay()).toBe(true)

      // Sunday
      const sunday = factory.create({ input: '2024-01-14' })
      expect(sunday.isBusinessDay()).toBe(false)
    })

    it('should check holidays in isBusinessDay', () => {
      const factoryWithHoliday = new DayjsFactory({
        businessRules: {
          workdays: [1, 2, 3, 4, 5],
          holidays: [{ date: '2024-01-15', name: 'Test Holiday', type: 'public' }]
        }
      })
      const holiday = factoryWithHoliday.create({ input: '2024-01-15' })
      expect(holiday.isBusinessDay()).toBe(false)
    })
  })
})

describe('createDayjsFactory', () => {
  it('should create factory instance', () => {
    const factory = createDayjsFactory()
    expect(factory).toBeInstanceOf(DayjsFactory)
  })

  it('should accept config options', () => {
    const factory = createDayjsFactory({ timezone: 'Europe/London' })
    expect(factory.getConfig().timezone).toBe('Europe/London')
  })
})

describe('createDayjs', () => {
  it('should create dayjs instance directly', () => {
    const instance = createDayjs('2024-01-15')
    expect(instance.format('YYYY-MM-DD')).toBe('2024-01-15')
  })

  it('should accept config options', () => {
    const instance = createDayjs('2024-01-15', { locale: 'de' })
    expect(instance.$businessConfig.locale).toBe('de')
  })
})

describe('DEFAULT_BUSINESS_RULES', () => {
  it('should have Monday to Friday as workdays', () => {
    expect(DEFAULT_BUSINESS_RULES.workdays).toEqual([1, 2, 3, 4, 5])
  })

  it('should have empty holidays array', () => {
    expect(DEFAULT_BUSINESS_RULES.holidays).toEqual([])
  })
})
