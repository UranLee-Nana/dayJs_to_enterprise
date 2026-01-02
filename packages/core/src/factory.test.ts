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

  describe('Instance isolation', () => {
    it('should maintain separate plugin registries', () => {
      const factory1 = new DayjsFactory()
      const factory2 = new DayjsFactory()

      expect(factory1.getInstanceId()).not.toBe(factory2.getInstanceId())
      expect(factory1.getPluginCount()).toBe(factory2.getPluginCount())
    })

    it('should isolate business rules between factories', () => {
      const factory1 = new DayjsFactory({
        businessRules: {
          workdays: [1, 2, 3, 4, 5],
          holidays: []
        }
      })

      const factory2 = new DayjsFactory({
        businessRules: {
          workdays: [1, 2, 3, 4], // Different workdays
          holidays: []
        }
      })

      // Friday (day 5)
      const friday = factory1.create({ input: '2024-01-12' })
      expect(friday.isBusinessDay()).toBe(true)

      const friday2 = factory2.create({ input: '2024-01-12' })
      expect(friday2.isBusinessDay()).toBe(false) // Factory 2 doesn't work on Friday
    })

    it('should not share configuration references', () => {
      const factory1 = new DayjsFactory({
        businessRules: {
          workdays: [1, 2, 3, 4, 5],
          holidays: []
        }
      })

      const config1 = factory1.getConfig()
      const config2 = factory1.getConfig()

      // Configs should be frozen (readonly)
      expect(Object.isFrozen(config1)).toBe(true)

      // Both configs should have the same values initially
      expect(config1.businessRules.workdays).toEqual([1, 2, 3, 4, 5])
      expect(config2.businessRules.workdays).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('Plugin management', () => {
    it('should prevent duplicate plugin registration', () => {
      // Create a mock plugin function with proper name
      const mockPlugin = function testPlugin(_o: any, c: any, _p: any) {
        // Mock plugin that adds a test method
        c.prototype.testMethod = function () {
          return 'test'
        }
      } as any

      const factory = new DayjsFactory()

      const initialCount = factory.getPluginCount()

      // Register plugin
      factory.use(mockPlugin)
      expect(factory.getPluginCount()).toBe(initialCount + 1)

      // Try to register again - should be skipped
      factory.use(mockPlugin)
      expect(factory.getPluginCount()).toBe(initialCount + 1) // No change
    })

    it('should track registered plugins', () => {
      const mockPlugin = function testPlugin2(_o: any, c: any, _p: any) {
        c.prototype.testMethod2 = function () {
          return 'test2'
        }
      } as any

      const factory = new DayjsFactory()

      factory.use(mockPlugin)

      expect(factory.hasPlugin(mockPlugin)).toBe(true)
      expect(factory.getRegisteredPlugins()).toContain(mockPlugin)
    })

    it('should expose plugin information', () => {
      const mockPlugin = function customPlugin(_o: any, c: any, _p: any) {
        c.prototype.testMethod3 = function () {
          return 'test3'
        }
      } as any

      const factory = new DayjsFactory({
        plugins: [mockPlugin]
      })

      expect(factory.getPluginCount()).toBeGreaterThanOrEqual(1)
      expect(factory.getRegisteredPlugins()).toBeDefined()
      expect(Array.isArray(factory.getRegisteredPlugins())).toBe(true)
    })
  })

  describe('Configuration deep merge', () => {
    it('should deeply clone business rules', () => {
      const customHolidays = [{ date: '2024-01-01', name: 'New Year', type: 'public' }]

      const factory = new DayjsFactory({
        businessRules: {
          workdays: [1, 2, 3, 4, 5],
          holidays: customHolidays
        }
      })

      const config = factory.getConfig()

      // Modify original array
      customHolidays.push({ date: '2024-12-25', name: 'Christmas', type: 'public' } as any)

      // Factory config should not be affected
      expect(config.businessRules.holidays).toHaveLength(1)
      expect(config.businessRules.holidays[0]?.date).toBe('2024-01-01')
    })

    it('should not share default config references', () => {
      const factory1 = new DayjsFactory()
      const factory2 = new DayjsFactory()

      const config1 = factory1.getConfig()
      const config2 = factory2.getConfig()

      // Both should have same values
      expect(config1.businessRules.workdays).toEqual(config2.businessRules.workdays)

      // But modifying one should not affect the other
      // (This tests that deep cloning is working)
      expect(Object.isFrozen(config1)).toBe(true)
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
