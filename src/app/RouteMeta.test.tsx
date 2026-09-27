import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { RouteMeta } from './RouteMeta'

describe('RouteMeta', () => {
  it('uses setup metadata for the setup confirmation route', async () => {
    render(
      <MemoryRouter initialEntries={['/setup-complete']}>
        <RouteMeta />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(document.title).toBe('Plan ready — Running Coach')
    })
  })
})
