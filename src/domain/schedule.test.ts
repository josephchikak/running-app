import { describe, expect, it } from 'vitest'
import { trainingCatalog } from '../data/plans/catalog'
import {
  expandPlanSchedule,
  getOverdueWorkouts,
  getNextMonday,
  getTodayEntry,
  getWeeklyProgress,
  updateWorkoutStatus
} from './schedule'

describe('plan scheduling', () => {
  it('chooses today when it is Monday or the next Monday otherwise', () => {
    expect(getNextMonday('2026-10-05')).toBe('2026-10-05')
    expect(getNextMonday('2026-10-06')).toBe('2026-10-12')
    expect(() => getNextMonday('2026-02-30')).toThrow(/valid date/i)
  })

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

  it('returns only unfinished workouts scheduled before today', () => {
    const schedule = expandPlanSchedule(trainingCatalog, '2026-09-28').map(entry => {
      if (entry.date === '2026-09-28') return { ...entry, status: 'completed' as const }
      return entry
    })

    expect(getOverdueWorkouts(schedule, '2026-10-04').map(entry => entry.date)).toEqual([
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03'
    ])
  })

  it('changes one workout status without moving any planned dates', () => {
    const schedule = expandPlanSchedule(trainingCatalog, '2026-09-28')
    const updated = updateWorkoutStatus(schedule, schedule[0].id, 'skipped')

    expect(updated[0]).toMatchObject({ date: '2026-09-28', status: 'skipped' })
    expect(updated.slice(1).map(entry => entry.date)).toEqual(schedule.slice(1).map(entry => entry.date))
    expect(() => updateWorkoutStatus(schedule, 'missing-workout', 'skipped')).toThrow(/not found/i)
  })
})
