import { useState } from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { legacyTrainingCatalog, trainingCatalog } from '../data/plans/catalog'
import { expandPlanSchedule } from '../domain/schedule'
import { summarizeWeek } from '../domain/training-summary'
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

describe('TrainingProvider plan restarts', () => {
  it('starts a fresh Week 1 even on the original Monday without counting old results', async () => {
    const schedule = createStoredSchedule('2026-09-28')
    await repository.saveEnrollment({ ...enrollment, planVersion: 2 })
    await repository.replaceSchedule(schedule)
    await repository.saveResult({ ...result, scheduledWorkoutId: schedule[0].id, workoutId: schedule[0].workoutId ?? result.workoutId })

    renderWithTraining(<RestartProbe startDate='2026-09-28' />, {
      repository,
      now: new Date('2026-09-28T08:00:00+01:00')
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Restart probe' }))

    await waitFor(async () => {
      const restarted = await repository.listSchedule()
      expect(restarted).toHaveLength(119)
      expect(restarted[0]).toMatchObject({ date: '2026-09-28', weekNumber: 1, status: 'scheduled' })
      expect(restarted[0].id).not.toBe(schedule[0].id)
      expect(summarizeWeek(restarted, await repository.listResults(), 1).sessions).toBe(0)
    })
    await expect(repository.listResults()).resolves.toHaveLength(1)
  })

  it('restarts on Wednesday with an easy run today and no old-week catch-up', async () => {
    const original = { ...enrollment, planVersion: 2 }
    await repository.saveEnrollment(original)
    await repository.replaceSchedule(createStoredSchedule(original.startDate))

    renderWithTraining(<RestartProbe startDate='2026-10-07' />, {
      repository,
      now: new Date('2026-10-07T08:00:00+01:00')
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Restart probe' }))
    await waitFor(async () => {
      expect((await repository.getEnrollment())?.startDate).toBe('2026-10-07')
    })
    const schedule = await repository.listSchedule()
    expect(schedule[0]).toMatchObject({
      date: '2026-10-07',
      workoutId: trainingCatalog.weeks[0].schedule.monday,
      status: 'scheduled'
    })
    expect(schedule.some(entry => entry.date < '2026-10-07')).toBe(false)
  })

  it('rejects a past Monday without changing the saved plan', async () => {
    const original = { ...enrollment, planVersion: 2 }
    await repository.saveEnrollment(original)
    await repository.replaceSchedule(createStoredSchedule(original.startDate))

    renderWithTraining(<RestartProbe startDate='2026-09-28' />, {
      repository,
      now: new Date('2026-10-05T08:00:00+01:00')
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Restart probe' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/future date/i)
    await expect(repository.getEnrollment()).resolves.toEqual(original)
  })

  it('leaves the plan unchanged when a workout checkpoint exists', async () => {
    const original = { ...enrollment, planVersion: 2 }
    await repository.saveEnrollment(original)
    await repository.replaceSchedule(createStoredSchedule(original.startDate))
    await repository.saveActiveSession(activeSession)

    renderWithTraining(<RestartProbe startDate='2026-10-05' />, {
      repository,
      now: new Date('2026-10-05T08:00:00+01:00')
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Restart probe' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/in-progress workout/i)
    await expect(repository.getEnrollment()).resolves.toEqual(original)
  })
})

function PlanVersionProbe () {
  const { enrollment: currentEnrollment } = useTraining()
  return <p>Plan version {currentEnrollment?.planVersion ?? 'none'}</p>
}

function RestartProbe ({ startDate }: { startDate: string }) {
  const { enrollment: currentEnrollment, restartPlan } = useTraining()
  const [message, setMessage] = useState('')

  function handleRestart () {
    void restartPlan(startDate).catch(error => setMessage(error instanceof Error ? error.message : 'Restart failed'))
  }

  return <>{currentEnrollment && <button onClick={handleRestart} type='button'>Restart probe</button>}{message && <p role='alert'>{message}</p>}</>
}

function createStoredSchedule (startDate: string) {
  return expandPlanSchedule(trainingCatalog, startDate).map(entry => ({
    id: entry.id,
    date: entry.date,
    weekNumber: entry.weekNumber,
    workoutId: entry.workoutId,
    status: entry.status
  }))
}
