import { describe, expect, it } from 'vitest'
import {
  BackupSchema,
  PlanTemplateSchema,
  WorkoutResultSchema,
  WorkoutStepSchema,
  WorkoutTemplateSchema
} from './models'

describe('training domain validation', () => {
  it('rejects a run step without a completion rule', () => {
    expect(() => WorkoutStepSchema.parse({
      id: 'easy-running',
      kind: 'run',
      title: 'Easy running',
      instruction: 'Run at conversation pace',
      cue: 'Settle into an easy pace',
      intensity: 'easy'
    })).toThrow()
  })

  it('rejects unexpected fields from plan data', () => {
    expect(() => WorkoutStepSchema.parse({
      id: 'easy-running',
      kind: 'run',
      title: 'Easy running',
      instruction: 'Run at conversation pace',
      cue: 'Settle into an easy pace',
      intensity: 'easy',
      completion: { type: 'time', seconds: 600 },
      injected: '<script>alert(1)</script>'
    })).toThrow()
  })

  it('parses a complete run workout', () => {
    const result = WorkoutTemplateSchema.parse({
      id: 'return-easy-30',
      version: 1,
      kind: 'run',
      title: 'Easy return',
      description: 'Relaxed running with a short walk to begin and finish',
      estimatedMinutes: 30,
      steps: [
        {
          id: 'warm-up',
          kind: 'run',
          title: 'Warm up',
          instruction: 'Walk briskly',
          cue: 'Begin with a brisk walk',
          intensity: 'recovery',
          completion: { type: 'time', seconds: 300 }
        }
      ]
    })

    expect(result.id).toBe('return-easy-30')
    expect(result.steps).toHaveLength(1)
  })

  it('rejects a plan with duplicate week numbers', () => {
    const week = {
      number: 1,
      phase: 'faster-5k',
      title: 'Rebuild',
      schedule: {
        monday: 'return-easy-30',
        tuesday: 'strength-a',
        wednesday: 'return-easy-30',
        thursday: 'strength-b',
        friday: 'return-easy-30',
        saturday: 'return-easy-30',
        sunday: null
      }
    }

    expect(() => PlanTemplateSchema.parse({
      id: 'personal-5k-to-10k',
      version: 1,
      title: '5K speed to 10K strength',
      weeks: [week, week]
    })).toThrow(/week numbers/i)
  })

  it('rejects an unsupported backup version', () => {
    const result = BackupSchema.safeParse({
      schemaVersion: 99,
      exportedAt: '2026-09-25T12:00:00.000Z',
      settings: {
        units: 'metric',
        currentFiveKilometreSeconds: 1800,
        speechEnabled: true,
        vibrationEnabled: true
      },
      enrollment: null,
      scheduledWorkouts: [],
      results: [],
      activeSession: null
    })

    expect(result.success).toBe(false)
  })

  it('does not allow route coordinates in a completed result', () => {
    const result = WorkoutResultSchema.safeParse({
      id: 'result-1',
      scheduledWorkoutId: 'scheduled-1',
      workoutId: 'return-easy-30',
      completedAt: '2026-09-25T12:00:00.000Z',
      status: 'completed',
      durationSeconds: 1800,
      distanceMetres: 4800,
      averagePaceSecondsPerKilometre: 375,
      completedStepIds: ['warm-up'],
      notes: '',
      coordinates: [{ latitude: 9.0765, longitude: 7.3986 }]
    })

    expect(result.success).toBe(false)
  })
})
