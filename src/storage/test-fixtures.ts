import type {
  ActiveSession,
  PlanEnrollment,
  ScheduledWorkout,
  UserSettings,
  WorkoutResult
} from '../domain/models'

export const settings: UserSettings = {
  units: 'metric',
  currentFiveKilometreSeconds: 1800,
  speechEnabled: true,
  vibrationEnabled: true
}

export const enrollment: PlanEnrollment = {
  planId: 'personal-5k-to-10k',
  planVersion: 1,
  startDate: '2026-09-28',
  currentFiveKilometreSeconds: 1800,
  status: 'active'
}

export const scheduledWorkout: ScheduledWorkout = {
  id: 'week-1-monday-2026-09-28',
  date: '2026-09-28',
  weekNumber: 1,
  workoutId: 'f5-w1-easy',
  status: 'scheduled'
}

export const activeSession: ActiveSession = {
  id: 'session-1',
  scheduledWorkoutId: scheduledWorkout.id,
  workoutId: 'f5-w1-easy',
  workoutVersion: 1,
  status: 'paused',
  currentStepIndex: 1,
  stepElapsedSeconds: 120,
  totalElapsedSeconds: 420,
  acceptedDistanceMetres: 850,
  startedAt: '2026-09-28T06:00:00.000Z',
  updatedAt: '2026-09-28T06:07:00.000Z'
}

export const result: WorkoutResult = {
  id: 'result-1',
  scheduledWorkoutId: scheduledWorkout.id,
  workoutId: 'f5-w1-easy',
  completedAt: '2026-09-28T06:35:00.000Z',
  status: 'completed',
  durationSeconds: 1800,
  distanceMetres: 4200,
  averagePaceSecondsPerKilometre: 429,
  completedStepIds: ['f5-w1-easy-warm-up', 'f5-w1-easy-easy', 'f5-w1-easy-cool-down'],
  notes: ''
}
