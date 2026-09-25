import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Backup } from '../domain/models'
import { exportBackup, importBackup } from './backup'
import { createTrainingRepository, type TrainingRepository } from './database'
import { activeSession, enrollment, result, scheduledWorkout, settings } from './test-fixtures'

let repository: TrainingRepository
let databaseIndex = 0

beforeEach(() => {
  databaseIndex += 1
  repository = createTrainingRepository(`running-backup-test-${databaseIndex}`)
})

afterEach(async () => {
  await repository.destroy()
})

describe('training backups', () => {
  it('exports a versioned snapshot without raw location data', async () => {
    await repository.saveSettings(settings)
    await repository.saveEnrollment(enrollment)
    await repository.replaceSchedule([scheduledWorkout])
    await repository.saveActiveSession(activeSession)
    await repository.saveResult(result)

    const json = await exportBackup(repository, new Date('2026-09-30T12:00:00.000Z'))
    const backup = JSON.parse(json) as Backup

    expect(backup.schemaVersion).toBe(1)
    expect(backup.exportedAt).toBe('2026-09-30T12:00:00.000Z')
    expect(backup.results).toEqual([result])
    expect(json).not.toContain('latitude')
    expect(json).not.toContain('longitude')
  })

  it('imports a valid backup as one replacement', async () => {
    const backup: Backup = {
      schemaVersion: 1,
      exportedAt: '2026-09-30T12:00:00.000Z',
      settings: { ...settings, currentFiveKilometreSeconds: 1700 },
      enrollment,
      scheduledWorkouts: [scheduledWorkout],
      results: [result],
      activeSession
    }

    await importBackup(repository, JSON.stringify(backup))

    await expect(repository.getSettings()).resolves.toEqual(backup.settings)
    await expect(repository.listSchedule()).resolves.toEqual([scheduledWorkout])
    await expect(repository.getActiveSession()).resolves.toEqual(activeSession)
  })

  it('does not replace existing data when an import is invalid', async () => {
    await repository.saveSettings(settings)

    await expect(importBackup(repository, '{"schemaVersion":99}')).rejects.toThrow()
    await expect(repository.getSettings()).resolves.toEqual(settings)
  })

  it('rejects an oversized backup before parsing it', async () => {
    const oversized = ' '.repeat(5_000_001)

    await expect(importBackup(repository, oversized)).rejects.toThrow(/too large/i)
  })
})
