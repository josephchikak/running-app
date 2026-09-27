import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { workoutCatalog } from '../../data/plans/catalog'
import { createTrainingRepository, type TrainingRepository } from '../../storage/database'
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
})
