import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TrainingProvider } from '../app/TrainingContext'
import type { TrainingRepository } from '../storage/database'

interface RenderWithTrainingOptions {
  repository: TrainingRepository
  route?: string
  now?: Date
}

export function renderWithTraining (children: ReactNode, options: RenderWithTrainingOptions) {
  return render(
    <MemoryRouter initialEntries={[options.route ?? '/']}>
      <TrainingProvider now={options.now} repository={options.repository}>
        {children}
      </TrainingProvider>
    </MemoryRouter>
  )
}
