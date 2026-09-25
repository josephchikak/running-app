import { calculateDistanceMetres, type GpsSample } from '../../capabilities/gps'

export function calculateTrackDistance (samples: GpsSample[]) {
  let totalMetres = 0
  for (let index = 1; index < samples.length; index += 1) {
    totalMetres += calculateDistanceMetres(samples[index - 1], samples[index])
  }
  return totalMetres
}

export function calculateRollingPace (samples: GpsSample[], windowSeconds: number) {
  if (samples.length < 2 || windowSeconds <= 0) return null

  const finalSample = samples[samples.length - 1]
  const cutoff = finalSample.timestamp - windowSeconds * 1000
  const windowSamples = samples.filter(sample => sample.timestamp >= cutoff)
  if (windowSamples.length < 2) return null

  const elapsedSeconds = (windowSamples[windowSamples.length - 1].timestamp - windowSamples[0].timestamp) / 1000
  const distanceMetres = calculateTrackDistance(windowSamples)
  if (elapsedSeconds <= 0 || distanceMetres < 5) return null

  return elapsedSeconds / (distanceMetres / 1000)
}
