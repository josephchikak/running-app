import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTrainingRepository, type TrainingRepository } from '../../storage/database'
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
})
