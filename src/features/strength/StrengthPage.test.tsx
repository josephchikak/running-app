import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WorkoutTemplate } from '../../domain/models'
import { StrengthPage } from './StrengthPage'

const strengthWorkout: WorkoutTemplate = {
  id: 'strength-ui-test',
  version: 1,
  kind: 'strength',
  title: 'Strength A',
  description: 'A short strength test.',
  estimatedMinutes: 20,
  steps: [
    {
      id: 'side-plank-hold',
      kind: 'exercise',
      exerciseId: 'side-plank',
      title: 'Side plank',
      instruction: 'Hold a straight line.',
      cue: 'Begin side plank.',
      side: 'both',
      completion: { type: 'time', seconds: 30 }
    },
    {
      id: 'squat-set',
      kind: 'exercise',
      exerciseId: 'chair-squat',
      title: 'Chair squat',
      instruction: 'Move with control.',
      cue: 'Begin squats.',
      side: 'both',
      completion: { type: 'repetitions', count: 10 }
    }
  ]
}

afterEach(() => {
  vi.useRealTimers()
})

describe('StrengthPage', () => {
  it('pauses a strength countdown without consuming time', () => {
    vi.useFakeTimers()
    render(<StrengthPage workout={strengthWorkout} />)

    fireEvent.click(screen.getByRole('button', { name: /pause/i }))
    act(() => vi.advanceTimersByTime(5000))

    expect(screen.getByText('00:30')).toBeVisible()
  })

  it('resumes the timer and exposes the easier exercise variation', () => {
    vi.useFakeTimers()
    render(<StrengthPage workout={strengthWorkout} />)

    fireEvent.click(screen.getByRole('button', { name: /pause/i }))
    fireEvent.click(screen.getByRole('button', { name: /resume/i }))
    act(() => vi.advanceTimersByTime(1000))

    expect(screen.getByText('00:29')).toBeVisible()
    expect(screen.getByText(/lower knee on the floor/i)).toBeVisible()
  })

  it('lets the runner complete a repetition set manually', () => {
    vi.useFakeTimers()
    render(<StrengthPage workout={strengthWorkout} />)
    act(() => vi.advanceTimersByTime(30000))

    expect(screen.getByRole('heading', { name: /chair squat/i })).toBeVisible()
    expect(screen.getByText('10 reps')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /complete set/i }))

    expect(screen.getByRole('heading', { name: /workout complete/i })).toBeVisible()
  })
})
