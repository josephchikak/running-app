import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTrainingRepository, type TrainingRepository } from '../../storage/database'
import { settings } from '../../storage/test-fixtures'
import { renderWithTraining } from '../../test/renderWithTraining'
import { SettingsPage } from './SettingsPage'

let repository: TrainingRepository
let databaseIndex = 0

beforeEach(async () => {
  databaseIndex += 1
  repository = createTrainingRepository(`settings-page-test-${databaseIndex}`)
  await repository.saveSettings(settings)
})

afterEach(async () => repository.destroy())

describe('SettingsPage', () => {
  it('updates the five-k baseline and cue preferences', async () => {
    renderWithTraining(<SettingsPage />, { repository })

    const baseline = await screen.findByLabelText(/current 5k time/i)
    fireEvent.change(baseline, { target: { value: '29:30' } })
    fireEvent.click(screen.getByLabelText(/spoken cues/i))
    fireEvent.click(screen.getByRole('button', { name: /save settings/i }))

    await waitFor(async () => {
      await expect(repository.getSettings()).resolves.toMatchObject({
        currentFiveKilometreSeconds: 1770,
        speechEnabled: false
      })
    })
  })

  it('requires confirmation before erasing local data', async () => {
    renderWithTraining(<SettingsPage />, { repository })

    fireEvent.click(await screen.findByRole('button', { name: /erase local data/i }))
    expect(screen.getByText(/this removes your plan and history/i)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /yes, erase everything/i }))

    await waitFor(async () => {
      await expect(repository.getSettings()).resolves.toBeNull()
    })
  })
})
