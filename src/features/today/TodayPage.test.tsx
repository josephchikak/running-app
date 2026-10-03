import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Route, Routes, useParams } from 'react-router-dom'
import { trainingCatalog, workoutCatalog } from '../../data/plans/catalog'
import { expandPlanSchedule } from '../../domain/schedule'
import { createTrainingRepository, type TrainingRepository } from '../../storage/database'
import { enrollment, result } from '../../storage/test-fixtures'
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

    expect(screen.queryByRole('region', { name: /this week/i })).not.toBeInTheDocument()

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

  it('shows the current training week and real saved totals', async () => {
    const schedule = createStoredSchedule().map((entry, index) => ({
      ...entry,
      status: index === 0 ? 'completed' as const : entry.status
    }))
    await repository.saveEnrollment(enrollment)
    await repository.replaceSchedule(schedule)
    await repository.saveResult({
      ...result,
      scheduledWorkoutId: schedule[0].id,
      workoutId: schedule[0].workoutId ?? result.workoutId
    })

    renderWithTraining(<TodayPage />, {
      repository,
      now: new Date('2026-09-28T08:00:00+01:00')
    })

    expect(await screen.findByRole('list', { name: /training week/i })).toBeVisible()
    expect(screen.getByRole('region', { name: /this week/i })).toHaveTextContent('1 session')
    expect(screen.getByRole('region', { name: /this week/i })).toHaveTextContent('30 min')
    expect(screen.getByRole('region', { name: /this week/i })).toHaveTextContent('4.20 km')
  })

  it('does not count a stopped workout toward completed weekly progress', async () => {
    const schedule = createStoredSchedule().map((entry, index) => ({
      ...entry,
      status: index === 0 ? 'completed' as const : entry.status
    }))
    await repository.saveEnrollment(enrollment)
    await repository.replaceSchedule(schedule)
    await repository.saveResult({
      ...result,
      scheduledWorkoutId: schedule[0].id,
      status: 'stopped'
    })

    renderWithTraining(<TodayPage />, {
      repository,
      now: new Date('2026-09-28T08:00:00+01:00')
    })

    expect(await screen.findByRole('region', { name: /this week/i })).toHaveTextContent('0/6 planned')
    expect(screen.getByRole('progressbar', { name: /weekly session progress/i })).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByRole('region', { name: /this week/i })).toHaveTextContent('0 sessions')
    expect(screen.getByText('Stopped early')).toBeVisible()
  })

  it('numbers the displayed workout by its plan position, even after a missed session', async () => {
    await repository.saveEnrollment(enrollment)
    await repository.replaceSchedule(createStoredSchedule())

    renderWithTraining(<TodayPage />, {
      repository,
      now: new Date('2026-09-30T08:00:00+01:00')
    })

    expect(await screen.findByRole('heading', { name: workoutCatalog[createStoredSchedule()[2].workoutId ?? ''].title })).toBeVisible()
    expect(screen.getByText('3 of 6')).toBeVisible()
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
