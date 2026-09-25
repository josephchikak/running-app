import { describe, expect, it, vi } from 'vitest'
import {
  calculateDistanceMetres,
  createGpsTracker,
  filterGpsSample,
  type GpsSample
} from './gps'

const goodPoint: GpsSample = {
  latitude: 9.0765,
  longitude: 7.3986,
  accuracy: 8,
  timestamp: 1_000_000
}

const nextPoint: GpsSample = {
  latitude: 9.07659,
  longitude: 7.3986,
  accuracy: 8,
  timestamp: 1_003_000
}

describe('GPS filtering', () => {
  it('rejects an inaccurate point without adding distance', () => {
    const result = filterGpsSample(goodPoint, { ...nextPoint, accuracy: 80 }, 1_003_000)
    expect(result).toEqual({ accepted: false, reason: 'poor-accuracy' })
  })

  it('rejects stale, tiny, and implausibly fast movement', () => {
    expect(filterGpsSample(null, goodPoint, goodPoint.timestamp + 20_000)).toEqual({
      accepted: false,
      reason: 'stale'
    })
    expect(filterGpsSample(goodPoint, { ...goodPoint, latitude: 9.07651, timestamp: 1_003_000 }, 1_003_000)).toEqual({
      accepted: false,
      reason: 'too-close'
    })
    expect(filterGpsSample(goodPoint, { ...goodPoint, latitude: 9.0775, timestamp: 1_001_000 }, 1_001_000)).toEqual({
      accepted: false,
      reason: 'implausible-speed'
    })
  })

  it('accepts a credible point and reports its segment distance', () => {
    const result = filterGpsSample(goodPoint, nextPoint, 1_003_000)

    expect(result.accepted).toBe(true)
    if (result.accepted) expect(result.distanceMetres).toBeCloseTo(10, 0)
  })

  it('always clears the browser position watch when stopped', async () => {
    const clearWatch = vi.fn()
    const watchPosition = vi.fn(() => 42)
    const tracker = createGpsTracker({
      geolocation: { watchPosition, clearWatch },
      now: () => 1_000_000
    })

    await tracker.start(vi.fn())
    tracker.stop()

    expect(watchPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    })
    expect(clearWatch).toHaveBeenCalledWith(42)
    expect(tracker.getStatus()).toBe('idle')
  })

  it('calculates a known north-south segment', () => {
    expect(calculateDistanceMetres(goodPoint, nextPoint)).toBeCloseTo(10, 0)
  })
})
