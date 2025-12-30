import dayjs, { Dayjs } from 'dayjs'
import type { ConfigType, PluginFunc } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type {
  DayjsBusinessConfig,
  CreateDayjsOptions,
  BusinessDayjs,
  BusinessDate,
  ISO8601String
} from './types'
import {
  DEFAULT_CONFIG,
  DEFAULT_BUSINESS_RULES
} from './types'
import {
  validateTimezone,
  validateLocale,
  validateDateInput,
  validateBusinessRules,
  ValidationError
} from './validator'

/**
 * Generate unique instance ID
 */
function generateInstanceId(): string {
  return `djb_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Plugin registry for managing plugin instances per factory
 */
class PluginRegistry {
  private plugins: Set<PluginFunc> = new Set()
  private initialized = false

  register(plugin: PluginFunc): void {
    if (!this.plugins.has(plugin)) {
      this.plugins.add(plugin)
    }
  }

  getPlugins(): PluginFunc[] {
    return Array.from(this.plugins)
  }

  isInitialized(): boolean {
    return this.initialized
  }

  markInitialized(): void {
    this.initialized = true
  }
}

/**
 * Configuration manager for scoped configurations
 */
class ConfigManager {
  private config: DayjsBusinessConfig

  constructor(config: Partial<DayjsBusinessConfig> = {}) {
    this.config = this.mergeWithDefaults(config)
  }

  private mergeWithDefaults(config: Partial<DayjsBusinessConfig>): DayjsBusinessConfig {
    return {
      locale: config.locale ?? DEFAULT_CONFIG.locale,
      timezone: config.timezone ?? DEFAULT_CONFIG.timezone,
      businessRules: config.businessRules
        ? { ...DEFAULT_BUSINESS_RULES, ...config.businessRules }
        : DEFAULT_BUSINESS_RULES,
      plugins: config.plugins ?? DEFAULT_CONFIG.plugins,
      strict: config.strict ?? DEFAULT_CONFIG.strict,
      debugMode: config.debugMode ?? DEFAULT_CONFIG.debugMode
    }
  }

  getConfig(): Readonly<DayjsBusinessConfig> {
    return Object.freeze({ ...this.config })
  }

  updateConfig(updates: Partial<DayjsBusinessConfig>): void {
    this.config = this.mergeWithDefaults({ ...this.config, ...updates })
  }
}

/**
 * Debug logger for development mode
 */
class DebugLogger {
  constructor(private enabled: boolean) {}

  log(message: string, data?: unknown): void {
    if (this.enabled && typeof console !== 'undefined') {
      console.log(`[dayjs-business] ${message}`, data ?? '')
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.enabled && typeof console !== 'undefined') {
      console.warn(`[dayjs-business] ${message}`, data ?? '')
    }
  }
}

/**
 * DayjsFactory - Creates isolated dayjs instances with business configuration
 */
export class DayjsFactory {
  private readonly registry: PluginRegistry
  private readonly configManager: ConfigManager
  private readonly logger: DebugLogger
  private readonly instanceId: string
  private localDayjs: typeof dayjs

  constructor(config: Partial<DayjsBusinessConfig> = {}) {
    this.instanceId = generateInstanceId()
    this.registry = new PluginRegistry()
    this.configManager = new ConfigManager(config)
    this.logger = new DebugLogger(config.debugMode ?? false)

    // Create isolated dayjs instance
    this.localDayjs = dayjs

    this.initializePlugins(config)
    this.validateConfig()
  }

  private initializePlugins(config: Partial<DayjsBusinessConfig>): void {
    if (this.registry.isInitialized()) {
      return
    }

    // Register core plugins
    this.localDayjs.extend(utc)
    this.localDayjs.extend(timezone)

    // Register custom plugins
    if (config.plugins) {
      for (const plugin of config.plugins) {
        this.registry.register(plugin)
        this.localDayjs.extend(plugin)
      }
    }

    this.registry.markInitialized()
    this.logger.log('Plugins initialized', { instanceId: this.instanceId })
  }

  private validateConfig(): void {
    const config = this.configManager.getConfig()

    if (config.strict) {
      if (config.timezone) {
        validateTimezone(config.timezone)
      }
      if (config.locale) {
        validateLocale(config.locale)
      }
      if (config.businessRules) {
        validateBusinessRules(config.businessRules)
      }
    }
  }

  /**
   * Creates a new dayjs instance with business extensions
   */
  create(options: CreateDayjsOptions = {}): BusinessDayjs {
    const config = this.configManager.getConfig()
    const mergedConfig = { ...config, ...options }

    // Validate input in strict mode
    if (mergedConfig.strict) {
      validateDateInput(options.input)
    }

    // Create base dayjs instance
    let instance: Dayjs

    if (options.input !== undefined) {
      instance = this.localDayjs(options.input)
    } else {
      instance = this.localDayjs()
    }

    // Apply timezone if specified
    if (mergedConfig.timezone && mergedConfig.timezone !== 'UTC') {
      instance = instance.tz(mergedConfig.timezone)
    }

    // Apply locale if specified
    if (mergedConfig.locale) {
      instance = instance.locale(mergedConfig.locale)
    }

    // Extend with business methods
    return this.extendWithBusinessMethods(instance, mergedConfig)
  }

  private extendWithBusinessMethods(instance: Dayjs, config: DayjsBusinessConfig): BusinessDayjs {
    const businessInstance = instance as BusinessDayjs

    Object.defineProperties(businessInstance, {
      $businessConfig: {
        value: Object.freeze({ ...config }),
        writable: false,
        enumerable: false
      },
      $instanceId: {
        value: this.instanceId,
        writable: false,
        enumerable: false
      }
    })

    // Add toBusinessDate method
    ;(businessInstance as unknown as Record<string, unknown>).toBusinessDate = function (
      this: BusinessDayjs
    ): BusinessDate {
      return {
        value: this,
        timezone: config.timezone ?? 'UTC',
        locale: config.locale ?? 'en'
      }
    }

    // Add toISO8601 method
    ;(businessInstance as unknown as Record<string, unknown>).toISO8601 = function (
      this: BusinessDayjs
    ): ISO8601String {
      return this.toISOString() as ISO8601String
    }

    // Add isBusinessDay method
    ;(businessInstance as unknown as Record<string, unknown>).isBusinessDay = function (
      this: BusinessDayjs
    ): boolean {
      const dayOfWeek = this.day()
      const workdays = config.businessRules?.workdays ?? DEFAULT_BUSINESS_RULES.workdays
      const holidays = config.businessRules?.holidays ?? []

      // Check if it's a workday
      if (!workdays.includes(dayOfWeek)) {
        return false
      }

      // Check if it's a holiday
      const dateStr = this.format('YYYY-MM-DD')
      for (const holiday of holidays) {
        if (holiday.date === dateStr) {
          return false
        }
        // Handle recurring holidays (same month and day each year)
        if (holiday.recurring) {
          const holidayDate = dayjs(holiday.date)
          if (this.month() === holidayDate.month() && this.date() === holidayDate.date()) {
            return false
          }
        }
      }

      return true
    }

    return businessInstance
  }

  /**
   * Register a plugin for this factory instance
   */
  use(plugin: PluginFunc): this {
    this.registry.register(plugin)
    this.localDayjs.extend(plugin)
    this.logger.log('Plugin registered', { plugin: plugin.name ?? 'anonymous' })
    return this
  }

  /**
   * Update configuration
   */
  configure(updates: Partial<DayjsBusinessConfig>): void {
    if (this.configManager.getConfig().strict) {
      if (updates.timezone) {
        validateTimezone(updates.timezone)
      }
      if (updates.locale) {
        validateLocale(updates.locale)
      }
      if (updates.businessRules) {
        validateBusinessRules(updates.businessRules)
      }
    }

    this.configManager.updateConfig(updates)
    this.logger.log('Configuration updated', updates)
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<DayjsBusinessConfig> {
    return this.configManager.getConfig()
  }

  /**
   * Get instance ID
   */
  getInstanceId(): string {
    return this.instanceId
  }

  /**
   * Parse date string with validation
   */
  parse(input: ConfigType, strict = true): BusinessDayjs {
    if (strict) {
      validateDateInput(input)
    }
    return this.create({ input })
  }

  /**
   * Get current date/time
   */
  now(): BusinessDayjs {
    return this.create()
  }

  /**
   * Create UTC date
   */
  utc(input?: ConfigType): BusinessDayjs {
    const instance = input !== undefined ? this.localDayjs.utc(input) : this.localDayjs.utc()
    return this.extendWithBusinessMethods(instance, {
      ...this.configManager.getConfig(),
      timezone: 'UTC'
    })
  }
}

/**
 * Create a new dayjs-business factory instance
 * @param config - Configuration options
 * @returns DayjsFactory instance
 */
export function createDayjsFactory(config: Partial<DayjsBusinessConfig> = {}): DayjsFactory {
  return new DayjsFactory(config)
}

/**
 * Shorthand function to create a dayjs instance with default configuration
 * @param input - Date input
 * @param config - Optional configuration
 * @returns BusinessDayjs instance
 */
export function createDayjs(
  input?: ConfigType,
  config?: Partial<DayjsBusinessConfig>
): BusinessDayjs {
  const factory = new DayjsFactory(config)
  return factory.create({ input })
}

// Re-export ValidationError for external use
export { ValidationError }
