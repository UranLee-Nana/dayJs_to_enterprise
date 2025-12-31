import { describe, expect, it } from 'vitest'

import { formatters } from './format'
import { groupDatesByUnit } from './helpers'

describe('week utilities', () => {
  it('returns formatted week number without errors', () => {
    expect(formatters.weekNumber('2024-01-03')).toBe('Week 1')
  })

  it('groups dates by week number correctly', () => {
    const groups = groupDatesByUnit(
      ['2024-01-01', '2024-01-05', '2024-01-10'],
      'week'
    )

    expect(Array.from(groups.keys())).toEqual(['2024-W01', '2024-W02'])
    expect(groups.get('2024-W01')?.length).toBe(2)
    expect(groups.get('2024-W02')?.length).toBe(1)
  })
})
