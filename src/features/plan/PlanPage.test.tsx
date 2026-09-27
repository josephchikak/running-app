import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Route, Routes, useParams } from 'react-router-dom'
import { trainingCatalog, workoutCatalog } from '../../data/plans/catalog'
import { expandPlanSchedule } from '../../domain/schedule'
import { createTrainingRepository, type TrainingRepository } from '../../storage/database'
import { enrollment } from '../../storage/test-fixtures'
import { renderWithTraining } from '../../test/renderWithTraining'
import { PlanPage } from './PlanPage'

let repository: TrainingRepository
let databaseIndex = 0

beforeEach(() => {
  databaseIndex += 1
  repository = createTrainingRepository(`plan-page-test-${databaseIndex}`)
})

afterEach(async () => repository.destroy())

describe('PlanPage', () => {
  it('shows the complete phased plan and expands the first week', async () => {
    renderWithTraining(<PlanPage />, { repository })

    expect(await screen.findByText('17 weeks')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Faster 5K' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Build to 10K' })).toBeVisible()
    expect(screen.getByText('Monday')).toBeVisible()
  })

  it('starts any unfinished session from the plan', async () => {
    const schedule = createStoredSchedule()
    const firstWorkout = workoutCatalog[schedule[0].workoutId ?? '']
    await repository.saveEnrollment(enrollment)
    await repository.replaceSchedule(schedule)

    renderWithTraining(
      <Routes>
        <Route element={<PlanPage />} path='/plan' />
        <Route element={<SelectedWorkout />} path='/workout/:scheduledWorkoutId' />
      </Routes>,
      { repository, route: '/plan' }
    )

    fireEvent.click(await screen.findByRole('button', { name: `Start ${firstWorkout.title}` }))

    expect(await screen.findByText(schedule[0].id)).toBeVisible()
  })

  it('requires confirmation before skipping a workout', async () => {
    const schedule = createStoredSchedule()
    const firstWorkout = workoutCatalog[schedule[0].workoutId ?? '']
    await repository.saveEnrollment(enrollment)
    await repository.replaceSchedule(schedule)

    renderWithTraining(<PlanPage />, { repository })

    fireEvent.click(await screen.findByRole('button', { name: `Skip ${firstWorkout.title}` }))
    fireEvent.click(screen.getByRole('button', { name: `Confirm skip ${firstWorkout.title}` }))

    await waitFor(async () => {
      const savedSchedule = await repository.listSchedule()
      expect(savedSchedule[0].status).toBe('skipped')
    })
    expect(screen.getByText('Skipped')).toBeVisible()
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
