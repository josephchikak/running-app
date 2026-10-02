import type { ScheduledWorkout, WorkoutResult } from './models'

export interface TrainingSummary {
  sessions: number
  durationSeconds: number
  distanceMetres: number
}

export function summarizeResults (results: WorkoutResult[]): TrainingSummary {
  return results
    .filter(result => result.status === 'completed')
    .reduce((summary, result) => ({
      sessions: summary.sessions + 1,
      durationSeconds: summary.durationSeconds + result.durationSeconds,
      distanceMetres: summary.distanceMetres + result.distanceMetres
    }), { sessions: 0, durationSeconds: 0, distanceMetres: 0 })
}

export function summarizeWeek (
  schedule: ScheduledWorkout[],
  results: WorkoutResult[],
  weekNumber: number
): TrainingSummary {
  const scheduledIds = new Set(
    schedule.filter(entry => entry.weekNumber === weekNumber).map(entry => entry.id)
  )

  return summarizeResults(results.filter(result => scheduledIds.has(result.scheduledWorkoutId)))
}
