import { describe, expect, it } from 'vitest'
import { formatPace, getPaceGuidance } from './pace'

describe('pace guidance', () => {
  it('creates a controlled 5K range from a 30-minute baseline', () => {
    expect(getPaceGuidance(1800, 'five-k')).toEqual({
      minimumSecondsPerKilometre: 354,
      maximumSecondsPerKilometre: 366,
      effort: 'Hard but controlled'
    })
  })

  it('keeps easy guidance slower than current 5K pace', () => {
    expect(getPaceGuidance(1800, 'easy')).toEqual({
      minimumSecondsPerKilometre: 450,
      maximumSecondsPerKilometre: 504,
      effort: 'Easy conversation pace'
    })
  })

  it('rejects an impossible baseline', () => {
    expect(() => getPaceGuidance(0, 'easy')).toThrow(/five kilometre time/i)
  })

  it('formats pace for display', () => {
    expect(formatPace(360)).toBe('6:00/km')
    expect(formatPace(359)).toBe('5:59/km')
  })
})
