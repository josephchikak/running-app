import type { Intensity } from './models'

export interface PaceGuidance {
  minimumSecondsPerKilometre: number
  maximumSecondsPerKilometre: number
  effort: string
}

interface PaceBand {
  minimumMultiplier: number
  maximumMultiplier: number
  effort: string
}

export function getPaceGuidance (
  fiveKilometreSeconds: number,
  intensity: Intensity
): PaceGuidance {
  assertValidFiveKilometreTime(fiveKilometreSeconds)

  const baselinePace = fiveKilometreSeconds / 5
  const band = paceBands[intensity]

  return {
    minimumSecondsPerKilometre: Math.round(baselinePace * band.minimumMultiplier),
    maximumSecondsPerKilometre: Math.round(baselinePace * band.maximumMultiplier),
    effort: band.effort
  }
}

export function formatPace (secondsPerKilometre: number) {
  if (!Number.isFinite(secondsPerKilometre) || secondsPerKilometre <= 0) {
    throw new Error('Pace must be a positive number')
  }

  const roundedSeconds = Math.round(secondsPerKilometre)
  const minutes = Math.floor(roundedSeconds / 60)
  const seconds = roundedSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
}

function assertValidFiveKilometreTime (seconds: number) {
  const isPlausible = Number.isFinite(seconds) && seconds >= 600 && seconds <= 10800

  if (!isPlausible) {
    throw new Error('Five kilometre time must be between 10 minutes and 3 hours')
  }
}

const paceBands: Record<Intensity, PaceBand> = {
  recovery: {
    minimumMultiplier: 1.4,
    maximumMultiplier: 1.55,
    effort: 'Very easy and relaxed'
  },
  easy: {
    minimumMultiplier: 1.25,
    maximumMultiplier: 1.4,
    effort: 'Easy conversation pace'
  },
  steady: {
    minimumMultiplier: 1.15,
    maximumMultiplier: 1.25,
    effort: 'Smooth and sustainable'
  },
  threshold: {
    minimumMultiplier: 1.05,
    maximumMultiplier: 1.12,
    effort: 'Comfortably hard'
  },
  'five-k': {
    minimumMultiplier: 59 / 60,
    maximumMultiplier: 61 / 60,
    effort: 'Hard but controlled'
  },
  stride: {
    minimumMultiplier: 0.82,
    maximumMultiplier: 0.92,
    effort: 'Fast and relaxed'
  }
}
