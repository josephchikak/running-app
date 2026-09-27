import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { workoutCatalog } from '../../data/plans/catalog'
import { createTrainingRepository, type TrainingRepository } from '../../storage/database'
import { scheduledWorkout } from '../../storage/test-fixtures'
import { renderWithTraining } from '../../test/renderWithTraining'
import { WorkoutPage } from './WorkoutPage'

let repository: TrainingRepository
let databaseIndex = 0

beforeEach(() => {
  databaseIndex += 1
  repository = createTrainingRepository(`workout-page-test-${databaseIndex}`)
})

afterEach(async () => repository.destroy())

describe('WorkoutPage', () => {
  it('restores an interrupted run from its checkpoint', async () => {
    const workout = workoutCatalog['f5-w1-quality']
    await repository.saveActiveSession({
      id: 'active-test-scheduled',
      scheduledWorkoutId: 'test-scheduled',
      workoutId: workout.id,
      workoutVersion: workout.version,
      status: 'paused',
      currentStepIndex: 5,
      stepElapsedSeconds: 20,
      totalElapsedSeconds: 680,
      acceptedDistanceMetres: 1800,
      startedAt: '2026-09-28T06:00:00.000Z',
      updatedAt: '2026-09-28T06:11:20.000Z'
    })

    renderWithTraining(
      <WorkoutPage scheduledWorkoutId='test-scheduled' workout={workout} />,
      { repository }
    )

    expect(await screen.findByRole('heading', { name: /controlled effort 3 of 6/i })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /resume run/i }))
    expect(screen.getByText(/1\.80 km/i)).toBeVisible()
  })

  it('shows capability status before a new run begins', async () => {
    renderWithTraining(
      <WorkoutPage scheduledWorkoutId='test-scheduled' workout={workoutCatalog['f5-w1-easy']} />,
      { repository }
    )

    expect(await screen.findByRole('button', { name: /start run/i })).toBeVisible()
    expect(screen.getByText(/gps idle/i)).toBeVisible()
    expect(screen.getByText(/screen lock off/i)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /^finish$/i }))
    expect(screen.getByText(/end this run now/i)).toBeVisible()
  })

  it('records the planned date when a run is completed later', async () => {
    await repository.replaceSchedule([scheduledWorkout])
    renderWithTraining(
      <Routes>
        <Route element={<WorkoutPage />} path='/workout/:scheduledWorkoutId' />
        <Route element={<p>History opened</p>} path='/history' />
      </Routes>,
      { repository, route: `/workout/${scheduledWorkout.id}` }
    )

    fireEvent.click(await screen.findByRole('button', { name: /^finish$/i }))
    fireEvent.click(screen.getByRole('button', { name: /save and finish/i }))

    expect(await screen.findByText('History opened')).toBeVisible()
    await expect(repository.listResults()).resolves.toEqual([
      expect.objectContaining({ plannedDate: scheduledWorkout.date })
    ])
  })

  it('opens and saves a selected strength workout', async () => {
    const strengthSchedule = {
      ...scheduledWorkout,
      id: 'week-1-tuesday-2026-09-29',
      date: '2026-09-29',
      workoutId: 'strength-a'
    }
    await repository.replaceSchedule([strengthSchedule])
    renderWithTraining(
      <Routes>
        <Route element={<WorkoutPage />} path='/workout/:scheduledWorkoutId' />
        <Route element={<p>History opened</p>} path='/history' />
      </Routes>,
      { repository, route: `/workout/${strengthSchedule.id}` }
    )

    expect(await screen.findByText(workoutCatalog['strength-a'].title)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /^finish$/i }))

    expect(await screen.findByText('History opened')).toBeVisible()
    await expect(repository.listResults()).resolves.toEqual([
      expect.objectContaining({
        workoutId: 'strength-a',
        plannedDate: strengthSchedule.date
      })
    ])
  })
})
