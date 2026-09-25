import { describe, expect, it } from 'vitest'
import { trainingCatalog } from '../data/plans/catalog'
import { expandPlanSchedule, getTodayEntry, getWeeklyProgress } from './schedule'

describe('plan scheduling', () => {
  it('places the agreed sessions from Monday through Sunday', () => {
    const schedule = expandPlanSchedule(trainingCatalog, '2026-09-28')

    expect(schedule.slice(0, 7).map(entry => entry.kind)).toEqual([
      'easy-run',
      'strength-a',
      'quality-run',
      'strength-b',
      'short-easy',
      'long-run',
      'rest'
    ])
    expect(schedule.slice(0, 7).map(entry => entry.date)).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04'
    ])
  })

  it('requires the selected plan date to be a Monday', () => {
    expect(() => expandPlanSchedule(trainingCatalog, '2026-09-29')).toThrow(/monday/i)
  })

  it('rejects impossible or loosely formatted dates', () => {
    expect(() => expandPlanSchedule(trainingCatalog, '2026-02-30')).toThrow(/valid date/i)
    expect(() => expandPlanSchedule(trainingCatalog, '28-09-2026')).toThrow(/valid date/i)
  })

  it('returns today and weekly progress without counting the rest day', () => {
    const schedule = expandPlanSchedule(trainingCatalog, '2026-09-28')
    const withResults = schedule.map(entry => {
      if (entry.date === '2026-09-28' || entry.date === '2026-09-29') {
        return { ...entry, status: 'completed' as const }
      }
      return entry
    })

    expect(getTodayEntry(withResults, '2026-09-30')?.kind).toBe('quality-run')
    expect(getWeeklyProgress(withResults, '2026-09-30')).toEqual({ completed: 2, total: 6 })
  })
})
