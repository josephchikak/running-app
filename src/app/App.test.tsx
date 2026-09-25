import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('opens on Today and exposes mobile navigation', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /today/i })).toBeVisible()
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeVisible()
    expect(screen.getByRole('link', { name: /plan/i })).toBeVisible()
  })
})
