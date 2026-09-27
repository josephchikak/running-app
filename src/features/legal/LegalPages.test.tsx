import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LegalPage } from './LegalPages'

describe('legal pages', () => {
  it('explains local-only storage and route-coordinate deletion', () => {
    render(<LegalPage type='privacy' />)

    expect(screen.getByRole('heading', { name: /privacy/i })).toBeVisible()
    expect(screen.getByText(/stored only on this device/i)).toBeVisible()
    expect(screen.getByText(/raw gps coordinates are discarded/i)).toBeVisible()
  })

  it('states the personal training and safety terms', () => {
    render(<LegalPage type='terms' />)

    expect(screen.getByRole('heading', { name: /terms/i })).toBeVisible()
    expect(screen.getByText(/not medical advice/i)).toBeVisible()
    expect(screen.getByText(/raytheboffin@gmail.com/i)).toBeVisible()
  })
})
