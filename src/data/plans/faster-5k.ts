import type { PlanWeek, WorkoutTemplate } from '../../domain/models'
import {
  createBenchmarkRun,
  createEasyRun,
  createLongRun,
  createRepeatedRun,
  createStrideRun,
  createTempoRun
} from './workout-builders'

const easyRuns = [30, 32, 35, 30, 36, 38, 40, 25].map((minutes, index) => {
  return createEasyRun(`f5-w${index + 1}-easy`, `Easy run · week ${index + 1}`, minutes)
})

const strideRuns = [25, 25, 25, 20, 26, 26, 28, 18].map((minutes, index) => {
  return createStrideRun(`f5-w${index + 1}-strides`, `Easy run and strides · week ${index + 1}`, minutes)
})

const qualityRuns: WorkoutTemplate[] = [
  createRepeatedRun('f5-w1-quality', 'Six relaxed one-minute efforts', 6, {
    title: 'Controlled effort', seconds: 60, recoverySeconds: 90, intensity: 'five-k',
    instruction: 'Run briskly with relaxed shoulders and finish able to repeat.', cue: 'One minute controlled. Hard, not all-out.'
  }, 'Short controlled efforts to reintroduce speed.'),
  createRepeatedRun('f5-w2-quality', 'Five two-minute efforts', 5, {
    title: 'Controlled effort', seconds: 120, recoverySeconds: 90, intensity: 'five-k',
    instruction: 'Hold an even effort and avoid sprinting the first half.', cue: 'Two minutes at a controlled 5K effort.'
  }, 'Even two-minute repetitions with easy jogging recoveries.'),
  createTempoRun('f5-w3-quality', 'Three threshold blocks', [1, 2, 3].map(number => ({
    title: `Threshold block ${number} of 3`, seconds: 360, intensity: 'threshold' as const,
    instruction: 'Run comfortably hard with a rhythm you could sustain beyond this block.', cue: `Threshold block ${number}. Comfortably hard.`
  })), 120, 'Three controlled threshold blocks with full easy recoveries.'),
  createRepeatedRun('f5-w4-quality', 'Four light hill efforts', 4, {
    title: 'Uphill effort', seconds: 60, recoverySeconds: 120, intensity: 'five-k',
    instruction: 'Run tall up a gentle hill, then recover completely on the way down.', cue: 'One minute uphill. Strong and smooth.'
  }, 'A reduced-load hill session focused on form rather than speed.'),
  createRepeatedRun('f5-w5-quality', 'Five three-minute efforts', 5, {
    title: 'Five-k effort', seconds: 180, recoverySeconds: 120, intensity: 'five-k',
    instruction: 'Settle quickly, stay controlled, and keep the final repetition as tidy as the first.', cue: 'Three minutes at 5K effort.'
  }, 'Five controlled repetitions that build 5K-specific endurance.'),
  createTempoRun('f5-w6-quality', 'Two longer threshold blocks', [1, 2].map(number => ({
    title: `Threshold block ${number} of 2`, seconds: 600, intensity: 'threshold' as const,
    instruction: 'Run at a strong sustainable rhythm with no straining.', cue: `Ten-minute threshold block ${number}. Stay smooth.`
  })), 180, 'Two longer comfortably-hard blocks with an easy reset.'),
  createRepeatedRun('f5-w7-quality', 'Four five-minute 5K efforts', 4, {
    title: 'Five-k effort', seconds: 300, recoverySeconds: 150, intensity: 'five-k',
    instruction: 'Run hard but controlled. Hold form and avoid racing the early repetitions.', cue: 'Five minutes at 5K effort. Controlled.'
  }, 'The most specific session of the block, still short of all-out racing.'),
  createEasyRun('f5-w8-quality', 'Benchmark-week easy run', 20)
]

const longRuns = [
  createLongRun('f5-w1-long', 'Long easy run · week 1', 40),
  createLongRun('f5-w2-long', 'Long easy run · week 2', 42),
  createLongRun('f5-w3-long', 'Long run with steady finish', 45, 8),
  createLongRun('f5-w4-long', 'Reduced long easy run', 38),
  createLongRun('f5-w5-long', 'Long run with steady finish', 48, 10),
  createLongRun('f5-w6-long', 'Long easy run · week 6', 50),
  createLongRun('f5-w7-long', 'Long run with steady finish', 52, 12),
  createBenchmarkRun('f5-w8-benchmark', '5K checkpoint', 5000, 45, 'five-k')
]

export const fasterFiveKilometreWorkouts = [
  ...easyRuns,
  ...strideRuns,
  ...qualityRuns,
  ...longRuns
]

export const fasterFiveKilometreWeeks: PlanWeek[] = Array.from({ length: 8 }, (_, index) => {
  const week = index + 1
  const isReduced = week === 4 || week === 8

  return {
    number: week,
    phase: 'faster-5k',
    title: week === 8 ? 'Freshen up and run your 5K checkpoint' : `Faster 5K · week ${week}`,
    schedule: {
      monday: `f5-w${week}-easy`,
      tuesday: isReduced ? 'strength-a-light' : 'strength-a',
      wednesday: `f5-w${week}-quality`,
      thursday: isReduced ? 'strength-b-light' : 'strength-b',
      friday: `f5-w${week}-strides`,
      saturday: week === 8 ? 'f5-w8-benchmark' : `f5-w${week}-long`,
      sunday: null
    }
  }
})
