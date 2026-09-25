export const MAX_ACCEPTED_ACCURACY_METRES = 50
export const MINIMUM_MOVEMENT_METRES = 3
export const MAXIMUM_PLAUSIBLE_SPEED_METRES_PER_SECOND = 10
export const STALE_SAMPLE_AGE_MILLISECONDS = 15_000
export const ROLLING_PACE_WINDOW_SECONDS = 30

const EARTH_RADIUS_METRES = 6_371_000

export interface GpsSample {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export type RejectedGpsReason =
  | 'poor-accuracy'
  | 'stale'
  | 'too-close'
  | 'implausible-speed'

export type GpsFilterResult =
  | { accepted: true, distanceMetres: number }
  | { accepted: false, reason: RejectedGpsReason }

export type GpsStatus = 'idle' | 'acquiring' | 'tracking' | 'weak' | 'error'

export type GpsEvent =
  | { type: 'sample', sample: GpsSample, distanceMetres: number }
  | { type: 'rejected', sample: GpsSample, reason: RejectedGpsReason }
  | { type: 'error', message: string }

export type GpsListener = (event: GpsEvent) => void

interface GeolocationAdapter {
  watchPosition: (
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    options?: PositionOptions
  ) => number
  clearWatch: (watchId: number) => void
}

interface GpsTrackerOptions {
  geolocation?: GeolocationAdapter
  now?: () => number
}

export interface GpsTracker {
  start: (listener: GpsListener) => Promise<void>
  stop: () => void
  getStatus: () => GpsStatus
}

export function calculateDistanceMetres (a: GpsSample, b: GpsSample) {
  const latitudeA = toRadians(a.latitude)
  const latitudeB = toRadians(b.latitude)
  const latitudeDelta = toRadians(b.latitude - a.latitude)
  const longitudeDelta = toRadians(b.longitude - a.longitude)
  const haversine = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2
  const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  return EARTH_RADIUS_METRES * angularDistance
}

export function filterGpsSample (
  previous: GpsSample | null,
  sample: GpsSample,
  now = Date.now()
): GpsFilterResult {
  if (!isCoordinateValid(sample) || sample.accuracy > MAX_ACCEPTED_ACCURACY_METRES) {
    return { accepted: false, reason: 'poor-accuracy' }
  }
  if (now - sample.timestamp > STALE_SAMPLE_AGE_MILLISECONDS || sample.timestamp - now > 5000) {
    return { accepted: false, reason: 'stale' }
  }
  if (!previous) return { accepted: true, distanceMetres: 0 }

  const distanceMetres = calculateDistanceMetres(previous, sample)
  if (distanceMetres < MINIMUM_MOVEMENT_METRES) {
    return { accepted: false, reason: 'too-close' }
  }

  const elapsedSeconds = (sample.timestamp - previous.timestamp) / 1000
  if (elapsedSeconds <= 0 || distanceMetres / elapsedSeconds > MAXIMUM_PLAUSIBLE_SPEED_METRES_PER_SECOND) {
    return { accepted: false, reason: 'implausible-speed' }
  }

  return { accepted: true, distanceMetres }
}

export function createGpsTracker (options: GpsTrackerOptions = {}): GpsTracker {
  const geolocation = options.geolocation ?? globalThis.navigator?.geolocation
  const now = options.now ?? Date.now
  let watchId: number | null = null
  let status: GpsStatus = 'idle'
  let previousSample: GpsSample | null = null

  return {
    async start (listener) {
      if (!geolocation) {
        status = 'error'
        throw new Error('Location tracking is not available in this browser')
      }
      if (watchId !== null) geolocation.clearWatch(watchId)

      status = 'acquiring'
      previousSample = null
      watchId = geolocation.watchPosition(
        position => {
          const sample = toGpsSample(position)
          const result = filterGpsSample(previousSample, sample, now())
          if (result.accepted) {
            previousSample = sample
            status = 'tracking'
            listener({ type: 'sample', sample, distanceMetres: result.distanceMetres })
          } else {
            status = 'weak'
            listener({ type: 'rejected', sample, reason: result.reason })
          }
        },
        positionError => {
          status = 'error'
          listener({ type: 'error', message: positionError.message || 'Location could not be read' })
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      )
    },

    stop () {
      if (watchId !== null && geolocation) geolocation.clearWatch(watchId)
      watchId = null
      previousSample = null
      status = 'idle'
    },

    getStatus () {
      return status
    }
  }
}

function toGpsSample (position: GeolocationPosition): GpsSample {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp
  }
}

function isCoordinateValid (sample: GpsSample) {
  return Number.isFinite(sample.latitude) &&
    Number.isFinite(sample.longitude) &&
    Number.isFinite(sample.accuracy) &&
    sample.accuracy >= 0 &&
    sample.latitude >= -90 &&
    sample.latitude <= 90 &&
    sample.longitude >= -180 &&
    sample.longitude <= 180
}

function toRadians (degrees: number) {
  return degrees * Math.PI / 180
}
