import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Route, Routes, useParams } from 'react-router-dom'
import { legacyTrainingCatalog, trainingCatalog, workoutCatalog } from '../../data/plans/catalog'
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
    expect(screen.getByRole('list', { name: /week 1 sessions/i })).toBeVisible()
    expect(screen.getByText('Monday')).toBeVisible()
    expect(screen.getAllByText('Easy run')).toHaveLength(2)
    expect(screen.getByText(/easy days build endurance and help you absorb the faster work/i)).toBeVisible()
    expect(screen.getByText('Six short efforts reintroduce leg speed without a hard opening week.')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Restart from Week 1' })).not.toBeInTheDocument()
  })

  it('explains the restart, defaults to next Monday, and can be cancelled', async () => {
    await repository.saveEnrollment(enrollment)
    await repository.replaceSchedule(createStoredSchedule())

    renderWithTraining(<PlanPage />, { repository, now: new Date('2026-10-06T12:00:00') })

    fireEvent.click(await screen.findByRole('button', { name: 'Restart from Week 1' }))

    expect(screen.getByLabelText('New start date')).toHaveValue('2026-10-12')
    expect(screen.getByText(/saved run history stays in History/i)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel restart' }))

    expect(screen.queryByRole('button', { name: 'Confirm restart' })).not.toBeInTheDocument()
    expect((await repository.getEnrollment())?.startDate).toBe(enrollment.startDate)
  })

  it('restarts on the chosen Monday and reports invalid dates', async () => {
    await repository.saveEnrollment(enrollment)
    await repository.replaceSchedule(createStoredSchedule())

    renderWithTraining(<PlanPage />, { repository, now: new Date('2026-10-06T12:00:00') })

    fireEvent.click(await screen.findByRole('button', { name: 'Restart from Week 1' }))
    fireEvent.change(screen.getByLabelText('New start date'), { target: { value: '2026-10-13' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm restart' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Monday')
    expect((await repository.getEnrollment())?.startDate).toBe(enrollment.startDate)

    fireEvent.change(screen.getByLabelText('New start date'), { target: { value: '2026-10-12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm restart' }))

    await waitFor(async () => {
      expect((await repository.getEnrollment())?.startDate).toBe('2026-10-12')
    })
    expect(screen.getByRole('status')).toHaveTextContent('Week 1 begins 12 Oct')
    expect(screen.getByRole('list', { name: /week 1 sessions/i })).toBeVisible()
  })

  it('keeps the original workout title for a completed session after plan upgrade', async () => {
    const schedule = expandPlanSchedule(legacyTrainingCatalog, enrollment.startDate).map(entry => ({
      id: entry.id,
      date: entry.date,
      weekNumber: entry.weekNumber,
      workoutId: entry.workoutId,
      status: entry.weekNumber === 1 && entry.id.includes('monday')
        ? 'completed' as const
        : 'scheduled' as const
    }))
    await repository.saveEnrollment(enrollment)
    await repository.replaceSchedule(schedule)

    renderWithTraining(<PlanPage />, { repository })

    const completedRow = (await screen.findByText('Easy run · week 1')).closest('li')
    expect(completedRow).toHaveTextContent('Relaxed aerobic running with a gentle warm-up and cool-down.')
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

    fireEvent.click(await screen.findByRole(
      'button',
      { name: `Start ${firstWorkout.title} on Monday` },
      { timeout: 5000 }
    ))

    expect(await screen.findByText(schedule[0].id)).toBeVisible()
  })

  it('requires confirmation before skipping a workout', async () => {
    const schedule = createStoredSchedule()
    const firstWorkout = workoutCatalog[schedule[0].workoutId ?? '']
    await repository.saveEnrollment(enrollment)
    await repository.replaceSchedule(schedule)

    renderWithTraining(<PlanPage />, { repository })

    fireEvent.click(await screen.findByRole('button', { name: `Skip ${firstWorkout.title} on Monday` }))
    fireEvent.click(screen.getByRole('button', { name: `Confirm skip ${firstWorkout.title} on Monday` }))

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
