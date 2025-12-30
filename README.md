# dayjs-business

企业级 Day.js 二次封装 npm 包，专为 B 端复杂业务场景设计。

## 特性

- **不可变与安全性** - 所有操作返回新实例，内置输入校验防止 XSS 与时区注入
- **零副作用** - 避免修改全局 dayjs 配置，支持多实例并行（满足多租户隔离需求）
- **TypeScript 优先** - 提供强类型推导与业务语义化类型
- **按需加载** - 插件与业务模块分离，支持 Tree-shaking
- **ESM/CJS 双格式** - 同时支持现代 ESM 和传统 CommonJS

## 安装

```bash
# 使用 pnpm
pnpm add dayjs-business dayjs

# 使用 npm
npm install dayjs-business dayjs

# 使用 yarn
yarn add dayjs-business dayjs
```

## 快速开始

```typescript
import { createDayjsFactory, createDayjs } from 'dayjs-business'

// 方式一：使用工厂函数（推荐，支持配置隔离）
const factory = createDayjsFactory({
  timezone: 'Asia/Shanghai',
  locale: 'zh-cn',
  businessRules: {
    workdays: [1, 2, 3, 4, 5], // 周一至周五
    holidays: [
      { date: '2024-01-01', name: '元旦', type: 'public' },
      { date: '2024-02-10', name: '春节', type: 'public' }
    ]
  }
})

const date = factory.create({ input: '2024-01-15' })
console.log(date.isBusinessDay()) // true
console.log(date.toISO8601())     // "2024-01-15T00:00:00.000Z"

// 方式二：直接创建实例
const simpleDate = createDayjs('2024-06-15')
console.log(simpleDate.format('YYYY-MM-DD'))
```

## 架构设计

```
dayjs-business/
├── @dayjs-business/core           # 核心层 - 工厂函数、类型定义、输入校验
├── @dayjs-business/plugins/
│   ├── business-day               # 工作日计算插件
│   ├── financial-quarter          # 财年季度插件
│   ├── subscription-cycle         # 订阅周期插件
│   └── data-range                 # 时间范围插件
├── @dayjs-business/services/
│   ├── timezone                   # 时区服务
│   ├── billing                    # 账单日期服务
│   └── analytics                  # 分析范围服务
└── @dayjs-business/utils          # 工具函数层
```

## 核心模块

### 工厂函数 (Core)

```typescript
import { createDayjsFactory, DayjsFactory } from 'dayjs-business'

// 创建带配置的工厂
const factory = createDayjsFactory({
  timezone: 'Asia/Shanghai',
  locale: 'zh-cn',
  strict: true,        // 严格模式，启用输入校验
  debugMode: false,    // 调试模式
  businessRules: {
    workdays: [1, 2, 3, 4, 5],
    holidays: [],
    fiscalYearStart: { month: 4, day: 1 } // 财年从4月1日开始
  }
})

// 创建日期实例
const now = factory.now()
const parsed = factory.parse('2024-01-15')
const utc = factory.utc()

// 动态更新配置
factory.configure({ timezone: 'America/New_York' })

// 获取实例ID（用于多租户隔离）
console.log(factory.getInstanceId())
```

### BusinessDayjs 扩展方法

```typescript
const date = factory.create({ input: '2024-01-15' })

// 转换为业务日期对象
const businessDate = date.toBusinessDate()
// { value: Dayjs, timezone: 'Asia/Shanghai', locale: 'zh-cn' }

// 转换为 ISO8601 字符串
const iso = date.toISO8601()
// "2024-01-15T00:00:00.000Z"

// 检查是否为工作日
date.isBusinessDay() // true (周一)
```

## 插件

### business-day 工作日插件

```typescript
import dayjs from 'dayjs'
import { businessDayPlugin } from 'dayjs-business'

dayjs.extend(businessDayPlugin)

const date = dayjs('2024-01-15') // 周一

// 基本方法
date.isBusinessDay()           // true
date.isHoliday()               // false
date.getHolidayInfo()          // null

// 导航
date.nextBusinessDay()         // 下一个工作日
date.prevBusinessDay()         // 上一个工作日

// 计算
date.addBusinessDays(5)        // 加5个工作日
date.subtractBusinessDays(3)   // 减3个工作日
date.businessDaysBetween(otherDate) // 两个日期间的工作日数

// 获取月份所有工作日
date.getBusinessDaysInMonth()  // Dayjs[]
```

**自定义配置：**

```typescript
import { createBusinessDayPlugin } from 'dayjs-business'

const customPlugin = createBusinessDayPlugin({
  workdays: [1, 2, 3, 4], // 周一至周四
  holidays: [
    { date: '2024-01-01', name: '元旦', type: 'public' },
    { date: '2024-12-25', name: '圣诞节', type: 'public', recurring: true }
  ]
})

dayjs.extend(customPlugin)
```

### financial-quarter 财年季度插件

```typescript
import dayjs from 'dayjs'
import { financialQuarterPlugin, FiscalYearPresets } from 'dayjs-business'

// 使用默认配置（日历年）
dayjs.extend(financialQuarterPlugin)

const date = dayjs('2024-02-15')

date.fiscalYear()              // 2024
date.fiscalQuarter()           // 1 (Q1)
date.fiscalQuarterInfo()       // { quarter: 1, year: 2024, startDate, endDate }

date.startOfFiscalYear()       // 2024-01-01
date.endOfFiscalYear()         // 2024-12-31
date.startOfFiscalQuarter()    // 2024-01-01
date.endOfFiscalQuarter()      // 2024-03-31

date.isSameFiscalQuarter(otherDate)
date.isSameFiscalYear(otherDate)

date.addFiscalQuarters(2)      // 加2个季度
date.fiscalQuartersBetween(otherDate)
```

**预设财年配置：**

```typescript
import { createFinancialQuarterPlugin, FiscalYearPresets } from 'dayjs-business'

// 使用预设
dayjs.extend(createFinancialQuarterPlugin(FiscalYearPresets.US_GOVERNMENT))
// 美国政府财年：10月1日 - 9月30日

dayjs.extend(createFinancialQuarterPlugin(FiscalYearPresets.JAPAN))
// 日本财年：4月1日 - 3月31日

// 可用预设
FiscalYearPresets.CALENDAR      // 日历年 (1月1日)
FiscalYearPresets.US_GOVERNMENT // 美国政府 (10月1日)
FiscalYearPresets.UK_GOVERNMENT // 英国政府 (4月6日)
FiscalYearPresets.JAPAN         // 日本 (4月1日)
FiscalYearPresets.AUSTRALIA     // 澳大利亚 (7月1日)
FiscalYearPresets.MICROSOFT     // 微软 (7月1日)
FiscalYearPresets.APPLE         // 苹果 (10月1日)
```

### subscription-cycle 订阅周期插件

```typescript
import dayjs from 'dayjs'
import { subscriptionCyclePlugin } from 'dayjs-business'

dayjs.extend(subscriptionCyclePlugin)

const today = dayjs()

// 计算下次账单日期
today.nextBillingDate('monthly', 15)     // 每月15日
today.nextBillingDate('quarterly', 1)    // 每季度1日
today.nextBillingDate('yearly', 1)       // 每年1日
today.previousBillingDate('monthly', 15)

// 订阅信息
const info = today.subscriptionInfo(subscriptionStart, 'monthly', 15)
// {
//   cycle: 'monthly',
//   startDate: Dayjs,
//   endDate: Dayjs,
//   billingDate: Dayjs,
//   isTrialPeriod: false,
//   daysRemaining: 10,
//   cycleNumber: 3
// }

// 试用期检查
today.isInTrialPeriod(subscriptionStart, 14) // 14天试用期

// 距离下次账单的天数
today.daysUntilBilling('monthly', 15)

// 当前周期的起止日期
today.cycleStartDate('monthly', 15)
today.cycleEndDate('monthly', 15)

// 对齐到账单日
today.alignToBillingDay(15)
```

**工具函数：**

```typescript
import { calculateProratedAmount, getBillingDatesInRange } from 'dayjs-business'

// 计算按比例分摊金额
const prorated = calculateProratedAmount(100, cycleStart, cycleEnd, effectiveDate)

// 获取范围内的所有账单日期
const dates = getBillingDatesInRange(start, end, 'monthly', 15)
```

### data-range 时间范围插件

```typescript
import dayjs from 'dayjs'
import { dataRangePlugin } from 'dayjs-business'

dayjs.extend(dataRangePlugin)

const today = dayjs()

// 预设范围
today.range('today')           // 今天
today.range('yesterday')       // 昨天
today.range('thisWeek')        // 本周
today.range('lastWeek')        // 上周
today.range('thisMonth')       // 本月
today.range('lastMonth')       // 上月
today.range('thisQuarter')     // 本季度
today.range('lastQuarter')     // 上季度
today.range('thisYear')        // 今年
today.range('lastYear')        // 去年
today.range('last7Days')       // 最近7天
today.range('last30Days')      // 最近30天
today.range('last90Days')      // 最近90天
today.range('monthToDate')     // 本月至今
today.range('yearToDate')      // 今年至今

// 返回值: { start: Dayjs, end: Dayjs, label: string }

// 自定义范围
today.customRange(start, end, 'Custom Label')
today.rangeFromDays(60)        // 最近60天
today.rangeFromWeeks(4)        // 最近4周
today.rangeFromMonths(6)       // 最近6个月

// 比较范围
today.comparePreviousPeriod(range)  // 上一周期对比
today.compareYearOverYear(range)    // 同比

// 范围操作
today.splitRange(range, 'day')      // 按天拆分
today.splitRange(range, 'week')     // 按周拆分
today.splitRange(range, 'month')    // 按月拆分

today.isInRange(range)              // 是否在范围内
today.overlapsRange(range1, range2) // 两个范围是否重叠
```

## 领域服务

### TimezoneService 时区服务

```typescript
import { TimezoneService, createTimezoneService, TimezonePresets } from 'dayjs-business'

const tzService = new TimezoneService({
  storageTimezone: 'UTC',           // 存储时区
  displayTimezone: 'Asia/Shanghai', // 显示时区
  strictValidation: true
})

// UTC 存储与本地显示
const utcDate = tzService.toStorage('2024-01-15 10:00', 'Asia/Shanghai')
const localDate = tzService.toDisplay(utcDate, 'America/New_York')

// 时区转换
const result = tzService.convert('2024-01-15 10:00', 'Asia/Shanghai', 'Europe/London')
// { original, converted, sourceTimezone, targetTimezone, offset }

// 当前时间
tzService.now('America/New_York')
tzService.utcNow()

// 跨时区对齐（多地区协作）
const aligned = tzService.alignCrossTimezone(
  '2024-01-15T10:00:00Z',
  ['Asia/Shanghai', 'America/New_York', 'Europe/London'],
  'startOfDay'
)

// 查找重叠的工作时间
const overlap = tzService.findOverlappingHours(
  ['Asia/Shanghai', 'America/New_York'],
  9, 17 // 9:00-17:00
)

// 获取时区信息
const info = tzService.getTimezoneInfo('Asia/Shanghai')
// { id, offset, offsetString, abbreviation, isDst }

// 预设时区
TimezonePresets.US_EAST      // 'America/New_York'
TimezonePresets.CHINA        // 'Asia/Shanghai'
TimezonePresets.UK           // 'Europe/London'
```

### BillingDateService 账单日期服务

```typescript
import { BillingDateService, createBillingService } from 'dayjs-business'

const billingService = new BillingDateService({
  defaultBillingDay: 15,
  skipWeekends: true,
  skipHolidays: true,
  holidays: ['2024-01-01', '2024-12-25'],
  gracePeriodDays: 3,
  defaultTrialDays: 14
})

// 计算账单日期
billingService.getNextBillingDate('2024-01-10', 'monthly', 15)
billingService.getPreviousBillingDate('2024-01-20', 'monthly', 15)

// 获取账单周期信息
const cycleInfo = billingService.getBillingCycleInfo('2024-01-20', 'monthly', 15)
// {
//   currentCycleStart, currentCycleEnd,
//   nextBillingDate, previousBillingDate,
//   daysUntilBilling, daysInCurrentCycle,
//   cycleProgress: 0.5
// }

// 计算按比例分摊
const proration = billingService.calculateProration(subscriptionStart, cycleEnd, 99.00)
// { totalDays, usedDays, remainingDays, proratedAmount, dailyRate }

// 试用期信息
const trialInfo = billingService.getTrialPeriodInfo(subscriptionStart, today)
// { isInTrial, trialStartDate, trialEndDate, daysRemaining, trialProgress }

// 试用期后的账单日期
billingService.getBillingDateAfterTrial(subscriptionStart, 'monthly', 14, 15)

// 生成账单计划
const schedule = billingService.generateBillingSchedule(start, end, 'monthly', 99.00, 15)
// { billingDates: Dayjs[], totalCycles, totalAmount }

// 检查账单状态
billingService.isBillingDue(today, 'monthly', 15)
billingService.isOverdue(lastPaymentDate, 'monthly')
```

### AnalyticsRangeService 分析范围服务

```typescript
import { AnalyticsRangeService, createAnalyticsService, QuickRanges } from 'dayjs-business'

const analyticsService = new AnalyticsRangeService({
  weekStartsOn: 1,        // 周一开始
  includeToday: true,
  timezone: 'Asia/Shanghai'
})

// 获取预设范围
analyticsService.getPresetRange('last30Days')
analyticsService.getPresetRange('thisQuarter')

// 批量获取
analyticsService.getMultiplePresets(['today', 'yesterday', 'last7Days'])

// 自定义范围
analyticsService.createCustomRange(start, end, 'Campaign Period')
analyticsService.createRelativeRange(45) // 最近45天

// 对比分析
const comparison = analyticsService.getPreviousPeriod(currentRange)
// { current, previous, changeType: 'period' }

const yoy = analyticsService.getYearOverYear(currentRange)
// { current, previous, changeType: 'yoy' }

// 范围拆分（用于图表）
const buckets = analyticsService.splitIntoBuckets(range, 'day')
// [{ start, end, label: 'Jan 15', index: 0 }, ...]

// 范围统计
const metrics = analyticsService.getRangeMetrics(range)
// { totalDays, weekdays, weekends, months, weeks, quarters }

// 范围操作
analyticsService.isDateInRange(date, range)
analyticsService.rangesOverlap(range1, range2)
analyticsService.mergeRanges([range1, range2])

// 快捷预设
QuickRanges.TODAY         // 'today'
QuickRanges.LAST_7_DAYS   // 'last7Days'
QuickRanges.THIS_MONTH    // 'thisMonth'
QuickRanges.YEAR_TO_DATE  // 'yearToDate'
```

## 工具函数

### 格式化工具

```typescript
import { batchFormat, smartFormat, relativeFormat, formatDuration, formatters } from 'dayjs-business'

// 批量格式化（性能优化）
const results = batchFormat(
  ['2024-01-15', '2024-02-20', 'invalid'],
  { format: 'YYYY年MM月DD日', locale: 'zh-cn' }
)
// [{ original, formatted, isValid }, ...]

// 智能格式化（根据时间远近自动选择格式）
smartFormat('2024-01-15T10:30:00')
// 今天: "10:30"
// 昨天: "Yesterday 10:30"
// 本周: "Mon 10:30"
// 今年: "Jan 15"
// 其他: "Jan 15, 2023"

// 相对时间格式化
relativeFormat('2024-01-15T10:30:00')
// "2 hours ago", "3 days ago", "in 5 minutes"

// 持续时间格式化
formatDuration('2024-01-15', '2024-01-18')
// "3d 0h 0m"

// 预设格式化器
formatters.iso(date)       // "2024-01-15T10:30:00"
formatters.date(date)      // "2024-01-15"
formatters.time(date)      // "10:30:00"
formatters.shortDate(date) // "01/15/24"
formatters.longDate(date)  // "January 15, 2024"
formatters.dateTime(date)  // "2024-01-15 10:30"
formatters.monthYear(date) // "January 2024"
```

### 校验工具

```typescript
import {
  validateDate,
  validateISO8601,
  validateDateRange,
  isToday,
  isPast,
  isFuture,
  isWeekend,
  isWeekday,
  isLeapYear,
  isSameDay,
  parseDate,
  toISO8601
} from 'dayjs-business'

// 日期校验
validateDate('2024-01-15')
// { isValid: true, normalized: Dayjs }

validateISO8601('2024-01-15T10:30:00Z')
// { isValid: true, normalized: Dayjs }

validateDateRange('2024-01-01', '2024-01-31')
// { isValid: true, start: Dayjs, end: Dayjs }

// 日期检查
isToday(date)              // 是否是今天
isPast(date)               // 是否是过去
isFuture(date)             // 是否是将来
isWeekend(date)            // 是否是周末
isWeekday(date)            // 是否是工作日
isLeapYear(2024)           // 是否是闰年
isSameDay(date1, date2)    // 是否是同一天

// 多格式解析
parseDate('15.01.2024', ['DD.MM.YYYY'])
// { isValid: true, normalized: Dayjs }

// 转换为 ISO8601
toISO8601(date)            // "2024-01-15T10:30:00.000Z" | null
```

### 辅助工具

```typescript
import {
  dateDiff,
  addDuration,
  getDatesBetween,
  getWeekdaysBetween,
  minDate,
  maxDate,
  sortDatesAsc,
  uniqueDates,
  groupDatesByUnit,
  calculateAge,
  clampDate
} from 'dayjs-business'

// 日期计算
dateDiff(date1, date2, 'day')        // 天数差
addDuration(date, 5, 'day')          // 加5天

// 日期范围
getDatesBetween(start, end)          // 范围内所有日期
getWeekdaysBetween(start, end)       // 范围内所有工作日

// 数组操作
minDate([date1, date2, date3])       // 最早日期
maxDate([date1, date2, date3])       // 最晚日期
sortDatesAsc(dates)                  // 升序排序
sortDatesDesc(dates)                 // 降序排序
uniqueDates(dates)                   // 去重

// 分组
groupDatesByUnit(dates, 'month')
// Map { '2024-01': [Dayjs, ...], '2024-02': [...] }

// 其他
calculateAge('1990-05-15')           // 计算年龄
clampDate(date, min, max)            // 限制日期范围
```

## 输入校验与安全

所有输入都经过严格校验，防止 XSS 和注入攻击：

```typescript
import { validateTimezone, validateLocale, ValidationError } from 'dayjs-business'

try {
  validateTimezone('<script>alert(1)</script>')
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.message)  // "Timezone contains invalid characters"
    console.log(error.field)    // "timezone"
    console.log(error.value)    // "[REDACTED]"
  }
}
```

## 多租户隔离

每个工厂实例拥有独立的配置，互不干扰：

```typescript
// 租户 A
const factoryA = createDayjsFactory({
  timezone: 'Asia/Shanghai',
  businessRules: { workdays: [1, 2, 3, 4, 5] }
})

// 租户 B
const factoryB = createDayjsFactory({
  timezone: 'America/New_York',
  businessRules: { workdays: [1, 2, 3, 4] } // 周四休息
})

// 配置完全隔离
factoryA.getInstanceId() !== factoryB.getInstanceId()
```

## TypeScript 支持

完整的类型定义：

```typescript
import type {
  BusinessDate,
  BusinessDayjs,
  ISO8601String,
  Holiday,
  BusinessRules,
  DayjsBusinessConfig,
  SubscriptionCycle,
  FinancialQuarter,
  DateRange,
  BillingDate,
  TimezoneConversionResult
} from 'dayjs-business'
```

## 开发

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test

# 构建所有包
pnpm build

# 类型检查
pnpm typecheck

# 代码格式化
pnpm format
```

## 项目结构

```
dayjs-business/
├── packages/
│   ├── core/                    # 核心层
│   ├── plugins/
│   │   ├── business-day/        # 工作日插件
│   │   ├── financial-quarter/   # 财年季度插件
│   │   ├── subscription-cycle/  # 订阅周期插件
│   │   └── data-range/          # 时间范围插件
│   ├── services/
│   │   ├── timezone/            # 时区服务
│   │   ├── billing/             # 账单服务
│   │   └── analytics/           # 分析服务
│   ├── utils/                   # 工具函数
│   └── dayjs-business/          # 主入口包
├── pnpm-workspace.yaml
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

## 许可证

MIT
