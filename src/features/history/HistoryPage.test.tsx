import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTrainingRepository, type TrainingRepository } from '../../storage/database'
import { result } from '../../storage/test-fixtures'
import { renderWithTraining } from '../../test/renderWithTraining'
import { HistoryPage } from './HistoryPage'

let repository: TrainingRepository
let databaseIndex = 0

beforeEach(() => {
  databaseIndex += 1
  repository = createTrainingRepository(`history-page-test-${databaseIndex}`)
})

afterEach(async () => repository.destroy())

describe('HistoryPage', () => {
  it('shows a clear empty state', async () => {
    renderWithTraining(<HistoryPage />, { repository })

    expect(await screen.findByText(/your completed runs and strength sessions will appear here/i)).toBeVisible()
  })

  it('shows saved summary metrics without a route map', async () => {
    await repository.saveResult({
      ...result,
      plannedDate: '2026-09-27',
      completedAt: '2026-09-28T06:35:00.000Z'
    })
    await repository.saveResult({
      ...result,
      id: 'result-stopped-strength',
      scheduledWorkoutId: 'week-1-tuesday-2026-09-29',
      workoutId: 'strength-a',
      completedAt: '2026-09-29T06:10:00.000Z',
      status: 'stopped',
      durationSeconds: 600,
      distanceMetres: 0,
      averagePaceSecondsPerKilometre: null,
      completedStepIds: []
    })
    renderWithTraining(<HistoryPage />, { repository })

    const summary = await screen.findByRole('region', { name: /history summary/i })
    expect(within(summary).getByText('4.20 km')).toBeVisible()
    expect(screen.getByText('30:00')).toBeVisible()
    expect(screen.getByText(/planned 27 sept? · completed 28 sept?/i)).toBeVisible()
    expect(within(summary).getByText('1')).toBeVisible()
    expect(summary).toHaveTextContent('30 min')
    expect(summary).toHaveTextContent('4.20 km')
    const strengthRow = screen.getByRole('heading', { name: /strength a/i }).closest('li')
    expect(strengthRow).not.toBeNull()
    expect(within(strengthRow as HTMLLIElement).getByText('0.00 km')).toBeVisible()
    expect(within(strengthRow as HTMLLIElement).getByText(/29 sept? 2026/i)).toBeVisible()
    expect(screen.queryByText(/route map/i)).not.toBeInTheDocument()
  })
})
