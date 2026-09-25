import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { WorkoutResult } from '../domain/models'
import { createTrainingRepository, type TrainingRepository } from './database'
import { activeSession, enrollment, result, scheduledWorkout, settings } from './test-fixtures'

let repository: TrainingRepository
let databaseIndex = 0

beforeEach(() => {
  databaseIndex += 1
  repository = createTrainingRepository(`running-coach-test-${databaseIndex}`)
})

afterEach(async () => {
  await repository.destroy()
})

describe('training repository', () => {
  it('restores settings, enrollment, and the scheduled plan', async () => {
    await repository.saveSettings(settings)
    await repository.saveEnrollment(enrollment)
    await repository.replaceSchedule([scheduledWorkout])

    await expect(repository.getSettings()).resolves.toEqual(settings)
    await expect(repository.getEnrollment()).resolves.toEqual(enrollment)
    await expect(repository.listSchedule()).resolves.toEqual([scheduledWorkout])
  })

  it('restores and clears the most recent active-session checkpoint', async () => {
    await repository.saveActiveSession(activeSession)
    await expect(repository.getActiveSession()).resolves.toEqual(activeSession)

    await repository.clearActiveSession()
    await expect(repository.getActiveSession()).resolves.toBeNull()
  })

  it('returns completed results newest first', async () => {
    await repository.saveResult(result)
    await repository.saveResult({
      ...result,
      id: 'result-2',
      completedAt: '2026-09-29T06:35:00.000Z'
    })

    await expect(repository.listResults()).resolves.toEqual([
      expect.objectContaining({ id: 'result-2' }),
      expect.objectContaining({ id: 'result-1' })
    ])
  })

  it('tracks anonymous local counters without adding them to a workout result', async () => {
    await repository.incrementCounter('workouts-started')
    await repository.incrementCounter('workouts-started')

    await expect(repository.getCounter('workouts-started')).resolves.toBe(2)
    await expect(repository.saveResult({ ...result, coordinates: [] } as unknown as WorkoutResult)).rejects.toThrow()
  })

  it('erases all local training and analytics data', async () => {
    await repository.saveSettings(settings)
    await repository.saveEnrollment(enrollment)
    await repository.replaceSchedule([scheduledWorkout])
    await repository.saveActiveSession(activeSession)
    await repository.saveResult(result)
    await repository.incrementCounter('workouts-started')

    await repository.clearAllData()

    await expect(repository.getSettings()).resolves.toBeNull()
    await expect(repository.getEnrollment()).resolves.toBeNull()
    await expect(repository.listSchedule()).resolves.toEqual([])
    await expect(repository.getActiveSession()).resolves.toBeNull()
    await expect(repository.listResults()).resolves.toEqual([])
    await expect(repository.getCounter('workouts-started')).resolves.toBe(0)
  })
})
