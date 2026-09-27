import { screen } from '@testing-library/react'
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
    renderWithTraining(<HistoryPage />, { repository })

    expect(await screen.findByText('4.20 km')).toBeVisible()
    expect(screen.getByText('30:00')).toBeVisible()
    expect(screen.getByText(/planned 27 sept? · completed 28 sept?/i)).toBeVisible()
    expect(screen.queryByText(/route map/i)).not.toBeInTheDocument()
  })
})
