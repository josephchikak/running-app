import { describe, expect, it } from 'vitest'
import { trainingCatalog } from '../data/plans/catalog'
import type { ScheduledWorkout } from './models'
import { upgradeScheduledWorkouts } from './plan-upgrade'

const schedule: ScheduledWorkout[] = [
  { id: 'week-1-monday-2026-09-28', date: '2026-09-28', weekNumber: 1, workoutId: 'f5-w1-easy', status: 'completed' },
  { id: 'week-1-tuesday-2026-09-29', date: '2026-09-29', weekNumber: 1, workoutId: 'strength-a', status: 'skipped' },
  { id: 'week-1-wednesday-2026-09-30', date: '2026-09-30', weekNumber: 1, workoutId: 'f5-w1-quality', status: 'scheduled' },
  { id: 'week-1-thursday-2026-10-01', date: '2026-10-01', weekNumber: 1, workoutId: 'strength-b', status: 'scheduled' },
  { id: 'week-1-friday-2026-10-02', date: '2026-10-02', weekNumber: 1, workoutId: 'f5-w1-strides', status: 'scheduled' },
  { id: 'week-1-saturday-2026-10-03', date: '2026-10-03', weekNumber: 1, workoutId: 'f5-w1-long', status: 'scheduled' },
  { id: 'week-1-sunday-2026-10-04', date: '2026-10-04', weekNumber: 1, workoutId: null, status: 'scheduled' }
]

describe('upgradeScheduledWorkouts', () => {
  it('changes only unstarted sessions while preserving dates, results and rest', () => {
    const upgraded = upgradeScheduledWorkouts(schedule, trainingCatalog, null)

    expect(upgraded).toHaveLength(7)
    expect(upgraded[0]).toEqual(schedule[0])
    expect(upgraded[1]).toEqual(schedule[1])
    expect(upgraded[2]).toMatchObject({
      id: schedule[2].id,
      date: schedule[2].date,
      workoutId: 'v2-f5-w1-key',
      status: 'scheduled'
    })
    expect(upgraded[4].workoutId).toBe('v2-w1-friday')
    expect(upgraded[5].workoutId).toBe('v2-w1-saturday')
    expect(upgraded[6]).toEqual(schedule[6])
  })

  it('keeps the workout attached to an active checkpoint until that session finishes', () => {
    const upgraded = upgradeScheduledWorkouts(schedule, trainingCatalog, schedule[2].id)

    expect(upgraded[2]).toEqual(schedule[2])
    expect(upgraded[4].workoutId).toBe('v2-w1-friday')
  })
})
