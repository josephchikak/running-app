import { describe, expect, it } from 'vitest'
import type { WorkoutTemplate } from './models'
import { createWorkoutState, getStepRemaining, reduceWorkout } from './workout-engine'

const timedWorkout: WorkoutTemplate = {
  id: 'engine-test',
  version: 1,
  kind: 'strength',
  title: 'Engine test',
  description: 'A small deterministic workout for reducer tests.',
  estimatedMinutes: 2,
  steps: [
    {
      id: 'timed-work',
      kind: 'exercise',
      exerciseId: 'side-plank',
      title: 'Timed work',
      instruction: 'Hold with control.',
      cue: 'Begin.',
      side: 'both',
      completion: { type: 'time', seconds: 30 }
    },
    {
      id: 'repetitions',
      kind: 'exercise',
      exerciseId: 'chair-squat',
      title: 'Repetitions',
      instruction: 'Move with control.',
      cue: 'Ten repetitions.',
      side: 'both',
      completion: { type: 'repetitions', count: 10 }
    },
    {
      id: 'final-rest',
      kind: 'rest',
      title: 'Rest',
      instruction: 'Breathe.',
      cue: 'Rest.',
      completion: { type: 'time', seconds: 20 }
    }
  ]
}

describe('workout engine', () => {
  it('advances a timed step exactly once', () => {
    const ready = createWorkoutState(timedWorkout)
    const active = reduceWorkout(ready, { type: 'START' })
    const next = reduceWorkout(active, { type: 'TICK', elapsedSeconds: 30 })

    expect(next.currentStepIndex).toBe(1)
    expect(next.events).toContainEqual({ type: 'STEP_CHANGED', stepIndex: 1 })
    expect(next.totalElapsedSeconds).toBe(30)
  })

  it('does not consume time while paused', () => {
    const active = reduceWorkout(createWorkoutState(timedWorkout), { type: 'START' })
    const paused = reduceWorkout(active, { type: 'PAUSE' })
    const unchanged = reduceWorkout(paused, { type: 'TICK', elapsedSeconds: 5 })

    expect(unchanged.status).toBe('paused')
    expect(getStepRemaining(unchanged)).toBe(30)
    expect(unchanged.totalElapsedSeconds).toBe(0)
  })

  it('requires explicit completion for a repetition step', () => {
    const active = reduceWorkout(createWorkoutState(timedWorkout), { type: 'START' })
    const repetitions = reduceWorkout(active, { type: 'TICK', elapsedSeconds: 30 })
    const waiting = reduceWorkout(repetitions, { type: 'TICK', elapsedSeconds: 30 })
    const rest = reduceWorkout(waiting, { type: 'COMPLETE_STEP' })

    expect(waiting.currentStepIndex).toBe(1)
    expect(getStepRemaining(waiting)).toBe(10)
    expect(rest.currentStepIndex).toBe(2)
  })

  it('can return to the previous step and finish early', () => {
    const active = reduceWorkout(createWorkoutState(timedWorkout), { type: 'START' })
    const second = reduceWorkout(active, { type: 'SKIP' })
    const previous = reduceWorkout(second, { type: 'PREVIOUS' })
    const finished = reduceWorkout(previous, { type: 'FINISH' })

    expect(previous.currentStepIndex).toBe(0)
    expect(finished.status).toBe('completed')
    expect(finished.events).toEqual([{ type: 'WORKOUT_COMPLETED' }])
  })

  it('advances a distance step from accepted metres', () => {
    const distanceWorkout: WorkoutTemplate = {
      ...timedWorkout,
      id: 'distance-test',
      kind: 'run',
      steps: [
        {
          id: 'distance-run',
          kind: 'run',
          title: 'Distance run',
          instruction: 'Run easy.',
          cue: 'Begin running.',
          intensity: 'easy',
          completion: { type: 'distance', metres: 1000 }
        },
        timedWorkout.steps[2]
      ]
    }
    const active = reduceWorkout(createWorkoutState(distanceWorkout), { type: 'START' })
    const partial = reduceWorkout(active, { type: 'DISTANCE', metres: 400 })
    const next = reduceWorkout(partial, { type: 'DISTANCE', metres: 600 })

    expect(getStepRemaining(partial)).toBe(600)
    expect(next.currentStepIndex).toBe(1)
    expect(next.totalDistanceMetres).toBe(1000)
  })
})
