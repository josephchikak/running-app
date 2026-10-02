import { describe, expect, it } from 'vitest'
import { result, scheduledWorkout } from '../storage/test-fixtures'
import { summarizeResults, summarizeWeek } from './training-summary'

describe('training summaries', () => {
  it('counts only completed results', () => {
    expect(summarizeResults([
      result,
      {
        ...result,
        id: 'result-stopped',
        status: 'stopped',
        durationSeconds: 300,
        distanceMetres: 500
      }
    ])).toEqual({ sessions: 1, durationSeconds: 1800, distanceMetres: 4200 })
  })

  it('limits a weekly summary to scheduled workout ids in that week', () => {
    const otherSchedule = {
      ...scheduledWorkout,
      id: 'week-2-monday-2026-10-05',
      weekNumber: 2
    }

    expect(summarizeWeek(
      [scheduledWorkout, otherSchedule],
      [result, { ...result, id: 'result-week-2', scheduledWorkoutId: otherSchedule.id }],
      1
    )).toEqual({ sessions: 1, durationSeconds: 1800, distanceMetres: 4200 })
  })
})
