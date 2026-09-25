import { describe, expect, it } from 'vitest'
import type { GpsSample } from '../../capabilities/gps'
import { calculateRollingPace, calculateTrackDistance } from './run-metrics'

const oneKilometreTrack: GpsSample[] = [
  { latitude: 9, longitude: 7, accuracy: 5, timestamp: 0 },
  { latitude: 9.0045, longitude: 7, accuracy: 5, timestamp: 150_000 },
  { latitude: 9.009, longitude: 7, accuracy: 5, timestamp: 300_000 }
]

describe('run metrics', () => {
  it('calculates a known one-kilometre route within tolerance', () => {
    expect(calculateTrackDistance(oneKilometreTrack)).toBeCloseTo(1000, -1)
  })

  it('calculates rolling pace from only the requested recent window', () => {
    expect(calculateRollingPace(oneKilometreTrack, 150)).toBeCloseTo(300, 0)
  })

  it('returns null before there is enough movement or elapsed time', () => {
    expect(calculateRollingPace(oneKilometreTrack.slice(0, 1), 30)).toBeNull()
    expect(calculateRollingPace([
      oneKilometreTrack[0],
      { ...oneKilometreTrack[0], timestamp: 10_000 }
    ], 30)).toBeNull()
  })
})
