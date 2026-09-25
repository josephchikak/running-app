import type { PlanWeek, WorkoutTemplate } from '../../domain/models'
import {
  createBenchmarkRun,
  createEasyRun,
  createLongRun,
  createRepeatedRun,
  createStrideRun,
  createTempoRun
} from './workout-builders'

const planWeeks = [10, 11, 12, 13, 14, 15, 16, 17]

const easyRuns = [32, 35, 38, 35, 40, 42, 45, 25].map((minutes, index) => {
  return createEasyRun(`b10-w${planWeeks[index]}-easy`, `Easy run · week ${planWeeks[index]}`, minutes)
})

const strideRuns = [24, 25, 26, 24, 27, 28, 30, 18].map((minutes, index) => {
  return createStrideRun(`b10-w${planWeeks[index]}-strides`, `Easy run and strides · week ${planWeeks[index]}`, minutes)
})

const qualityRuns: WorkoutTemplate[] = [
  createRepeatedRun('b10-w10-quality', 'Five three-minute steady efforts', 5, {
    title: 'Steady effort', seconds: 180, recoverySeconds: 90, intensity: 'steady',
    instruction: 'Run purposefully while staying well below an all-out effort.', cue: 'Three minutes steady. Smooth and controlled.'
  }, 'A controlled return to quality running after the transition week.'),
  createTempoRun('b10-w11-quality', 'Three threshold blocks', [1, 2, 3].map(number => ({
    title: `Threshold block ${number} of 3`, seconds: 420, intensity: 'threshold' as const,
    instruction: 'Run comfortably hard and keep your effort even.', cue: `Seven-minute threshold block ${number}.`
  })), 120, 'Three threshold blocks to develop sustainable speed.'),
  createRepeatedRun('b10-w12-quality', 'Six four-minute efforts', 6, {
    title: 'Ten-k effort', seconds: 240, recoverySeconds: 90, intensity: 'threshold',
    instruction: 'Hold a strong repeatable effort that never becomes a sprint.', cue: 'Four minutes at controlled 10K effort.'
  }, 'Repeatable 10K-oriented efforts with short easy recoveries.'),
  createRepeatedRun('b10-w13-quality', 'Four relaxed hill efforts', 4, {
    title: 'Uphill effort', seconds: 75, recoverySeconds: 135, intensity: 'five-k',
    instruction: 'Run tall and strong on a gentle hill, then recover fully.', cue: 'Seventy-five seconds uphill. Smooth power.'
  }, 'A reduced-load strength and form session on a gentle incline.'),
  createTempoRun('b10-w14-quality', 'Two twelve-minute threshold blocks', [1, 2].map(number => ({
    title: `Threshold block ${number} of 2`, seconds: 720, intensity: 'threshold' as const,
    instruction: 'Settle into a strong sustainable rhythm and keep your breathing controlled.', cue: `Twelve-minute threshold block ${number}.`
  })), 180, 'Long threshold work to support a stronger 10K rhythm.'),
  createRepeatedRun('b10-w15-quality', 'Five five-minute 10K efforts', 5, {
    title: 'Ten-k effort', seconds: 300, recoverySeconds: 120, intensity: 'threshold',
    instruction: 'Run firmly but leave enough control to repeat the same effort.', cue: 'Five minutes at 10K effort.'
  }, 'Five controlled repetitions at an effort close to current 10K intensity.'),
  createTempoRun('b10-w16-quality', 'Thirty-minute progression', [
    {
      title: 'Progression · steady', seconds: 600, intensity: 'steady',
      instruction: 'Run with purpose while keeping the effort comfortable.', cue: 'Ten minutes steady.'
    },
    {
      title: 'Progression · threshold', seconds: 600, intensity: 'threshold',
      instruction: 'Lift to comfortably hard and keep your form relaxed.', cue: 'Ten minutes comfortably hard.'
    },
    {
      title: 'Progression · controlled finish', seconds: 600, intensity: 'threshold',
      instruction: 'Hold the rhythm or ease slightly if your form begins to fade.', cue: 'Final ten minutes. Stay controlled.'
    }
  ], 0, 'A continuous progression that finishes controlled rather than all-out.'),
  createEasyRun('b10-w17-quality', 'Benchmark-week easy run', 20)
]

const longRuns = [
  createLongRun('b10-w10-long', 'Long easy run · week 10', 45),
  createLongRun('b10-w11-long', 'Long easy run · week 11', 50),
  createLongRun('b10-w12-long', 'Long run with steady finish', 55, 10),
  createLongRun('b10-w13-long', 'Reduced long easy run', 48),
  createLongRun('b10-w14-long', 'Long run with steady finish', 60, 12),
  createLongRun('b10-w15-long', 'Long easy run · week 15', 65),
  createLongRun('b10-w16-long', 'Long run with controlled finish', 70, 15),
  createBenchmarkRun('b10-w17-benchmark', '10K completion run', 10000, 75, 'steady')
]

export const buildToTenKilometreWorkouts = [
  ...easyRuns,
  ...strideRuns,
  ...qualityRuns,
  ...longRuns
]

export const buildToTenKilometreWeeks: PlanWeek[] = planWeeks.map(week => {
  const isReduced = week === 13 || week === 17

  return {
    number: week,
    phase: 'build-to-10k',
    title: week === 17 ? 'Freshen up and complete your 10K' : `Build to 10K · week ${week - 9}`,
    schedule: {
      monday: `b10-w${week}-easy`,
      tuesday: isReduced ? 'strength-a-light' : 'strength-a',
      wednesday: `b10-w${week}-quality`,
      thursday: isReduced ? 'strength-b-light' : 'strength-b',
      friday: `b10-w${week}-strides`,
      saturday: week === 17 ? 'b10-w17-benchmark' : `b10-w${week}-long`,
      sunday: null
    }
  }
})
