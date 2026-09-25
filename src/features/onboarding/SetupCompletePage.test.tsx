import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTrainingRepository, type TrainingRepository } from '../../storage/database'
import { renderWithTraining } from '../../test/renderWithTraining'
import { SetupCompletePage } from './SetupCompletePage'

let repository: TrainingRepository
let databaseIndex = 0

beforeEach(() => {
  databaseIndex += 1
  repository = createTrainingRepository(`setup-page-test-${databaseIndex}`)
})

afterEach(async () => repository.destroy())

describe('SetupCompletePage', () => {
  it('provides a concise setup confirmation and next action', () => {
    renderWithTraining(<SetupCompletePage />, { repository })

    expect(screen.getByRole('heading', { name: /plan ready/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /start workout/i })).toBeVisible()
  })
})
