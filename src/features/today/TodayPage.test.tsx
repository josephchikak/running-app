import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Route, Routes, useParams } from 'react-router-dom'
import { trainingCatalog, workoutCatalog } from '../../data/plans/catalog'
import { expandPlanSchedule } from '../../domain/schedule'
import { createTrainingRepository, type TrainingRepository } from '../../storage/database'
import { enrollment } from '../../storage/test-fixtures'
import { renderWithTraining } from '../../test/renderWithTraining'
import { SetupCompletePage } from '../onboarding/SetupCompletePage'
import { TodayPage } from './TodayPage'

let repository: TrainingRepository
let databaseIndex = 0

beforeEach(() => {
  databaseIndex += 1
  repository = createTrainingRepository(`today-page-test-${databaseIndex}`)
})

afterEach(async () => repository.destroy())

describe('TodayPage', () => {
  it('starts the plan and presents the Monday workout', async () => {
    renderWithTraining(
      <Routes>
        <Route element={<TodayPage />} path='/' />
        <Route element={<SetupCompletePage />} path='/setup-complete' />
      </Routes>,
      { repository, now: new Date('2026-09-28T08:00:00+01:00') }
    )

    fireEvent.click(await screen.findByRole('button', { name: /start plan/i }))

    expect(await screen.findByRole('heading', { name: /plan ready/i })).toBeVisible()
    expect(screen.getByText(/monday · easy run/i)).toBeVisible()
    expect(screen.getByRole('button', { name: /start workout/i })).toBeVisible()
  })

  it('shows an enrolled workout and weekly progress', async () => {
    renderWithTraining(<TodayPage />, {
      repository,
      now: new Date('2026-09-28T08:00:00+01:00')
    })
    fireEvent.click(await screen.findByRole('button', { name: /start plan/i }))

    await waitFor(async () => {
      await expect(repository.getEnrollment()).resolves.not.toBeNull()
    })
  })

  it('offers overdue workouts without replacing today’s planned session', async () => {
    const schedule = createStoredSchedule()
    await repository.saveEnrollment(enrollment)
    await repository.replaceSchedule(schedule)

    renderWithTraining(
      <Routes>
        <Route element={<TodayPage />} path='/' />
        <Route element={<SelectedWorkout />} path='/workout/:scheduledWorkoutId' />
      </Routes>,
      { repository, now: new Date('2026-09-30T08:00:00+01:00') }
    )

    expect(await screen.findByRole('heading', { name: workoutCatalog[schedule[2].workoutId ?? ''].title })).toBeVisible()
    expect(screen.getByRole('heading', { name: /catch up/i })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: /do easy run.*week 1 today/i }))

    expect(await screen.findByText('week-1-monday-2026-09-28')).toBeVisible()
  })
})

function SelectedWorkout () {
  const { scheduledWorkoutId } = useParams()
  return <p>{scheduledWorkoutId}</p>
}

function createStoredSchedule () {
  return expandPlanSchedule(trainingCatalog, enrollment.startDate).map(entry => ({
    id: entry.id,
    date: entry.date,
    weekNumber: entry.weekNumber,
    workoutId: entry.workoutId,
    status: entry.status
  }))
}
