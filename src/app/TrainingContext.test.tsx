import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { legacyTrainingCatalog } from '../data/plans/catalog'
import { expandPlanSchedule } from '../domain/schedule'
import { createTrainingRepository, type TrainingRepository } from '../storage/database'
import { activeSession, enrollment, result } from '../storage/test-fixtures'
import { renderWithTraining } from '../test/renderWithTraining'
import { useTraining } from './TrainingContext'

let repository: TrainingRepository
let databaseIndex = 0

beforeEach(() => {
  databaseIndex += 1
  repository = createTrainingRepository(`training-upgrade-test-${databaseIndex}`)
})

afterEach(async () => repository.destroy())

describe('TrainingProvider plan upgrades', () => {
  it('upgrades pending workouts without changing finished results or an active run', async () => {
    const schedule = expandPlanSchedule(legacyTrainingCatalog, enrollment.startDate).map(entry => ({
      id: entry.id,
      date: entry.date,
      weekNumber: entry.weekNumber,
      workoutId: entry.workoutId,
      status: entry.id.includes('monday') && entry.weekNumber === 1
        ? 'completed' as const
        : 'scheduled' as const
    }))
    const active = {
      ...activeSession,
      scheduledWorkoutId: schedule[2].id,
      workoutId: schedule[2].workoutId ?? activeSession.workoutId
    }
    await repository.saveEnrollment(enrollment)
    await repository.replaceSchedule(schedule)
    await repository.saveResult(result)
    await repository.saveActiveSession(active)

    renderWithTraining(<PlanVersionProbe />, { repository })

    expect(await screen.findByText('Plan version 2')).toBeVisible()
    await waitFor(async () => {
      const revised = await repository.listSchedule()
      expect(revised[0]).toEqual(schedule[0])
      expect(revised[2]).toEqual(schedule[2])
      expect(revised[4].workoutId).toBe('v2-w1-friday')
    })
    await expect(repository.getEnrollment()).resolves.toMatchObject({ planVersion: 2 })
    await expect(repository.listResults()).resolves.toEqual([result])
    await expect(repository.getActiveSession()).resolves.toEqual(active)
  })
})

function PlanVersionProbe () {
  const { enrollment: currentEnrollment } = useTraining()
  return <p>Plan version {currentEnrollment?.planVersion ?? 'none'}</p>
}
