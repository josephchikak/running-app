import type { Intensity, PlanWeek, WorkoutTemplate } from '../../domain/models'
import {
  createBenchmarkRun,
  createEasyRun,
  createLongRun,
  createRepeatedRun,
  createStrideRun,
  createTempoRun
} from './workout-builders'

interface WeekPrescription {
  number: number
  phase: PlanWeek['phase']
  title: string
  mondayMinutes: number
  fridayMinutes: number
  fridayStrides: boolean
  saturdayMinutes: number
  saturdaySteadyMinutes?: number
  quality: WorkoutTemplate
  isReduced?: boolean
}

function intervals (
  id: string,
  title: string,
  count: number,
  seconds: number,
  recoverySeconds: number,
  intensity: Intensity,
  instruction: string,
  description: string
) {
  return createRepeatedRun(id, title, count, {
    title: 'Controlled effort',
    seconds,
    recoverySeconds,
    intensity,
    instruction,
    cue: title
  }, description)
}

function threshold (
  id: string,
  title: string,
  count: number,
  seconds: number,
  recoverySeconds: number,
  description: string
) {
  return createTempoRun(id, title, Array.from({ length: count }, (_, index) => ({
    title: `Threshold block ${index + 1} of ${count}`,
    seconds,
    intensity: 'threshold' as const,
    instruction: 'Hold a comfortably hard rhythm you can repeat without straining.',
    cue: `Threshold block ${index + 1}. Smooth and controlled.`
  })), recoverySeconds, description)
}

const fiveKilometreQuality = [
  intervals('v2-f5-w1-key', 'Relaxed one-minute fartlek', 6, 60, 90, 'five-k',
    'Run briskly, not all-out, and recover until your breathing settles.',
    'Six short efforts reintroduce leg speed without a hard opening week.'),
  intervals('v2-f5-w2-key', 'Gentle-hill form repeats', 6, 45, 90, 'five-k',
    'Run tall up a gentle hill, then walk or jog back down. Ignore GPS pace.',
    'Short hills build running mechanics; this is not a sprint session.'),
  threshold('v2-f5-w3-key', 'Three controlled tempo blocks', 3, 300, 120,
    'Three five-minute comfortably-hard blocks build sustainable 5K speed.'),
  intervals('v2-f5-w4-key', 'Cutback-week light pickups', 4, 60, 90, 'steady',
    'Stay smooth and finish each pickup feeling able to do more.',
    'A little rhythm during a lower-load recovery week.'),
  intervals('v2-f5-w5-key', 'Five 3-minute 5K efforts', 5, 180, 120, 'five-k',
    'Find current 5K effort, not last year’s pace, and keep all repeats even.',
    'Controlled race-specific work with generous easy recoveries.'),
  threshold('v2-f5-w6-key', 'Two longer tempo blocks', 2, 480, 180,
    'Two eight-minute blocks build the ability to hold a strong rhythm.'),
  intervals('v2-f5-w7-key', 'Four 4-minute 5K efforts', 4, 240, 120, 'five-k',
    'Run at repeatable current 5K effort and protect your form.',
    'Peak 5K-specific work before the checkpoint week.'),
  intervals('v2-f5-w8-key', 'Checkpoint-week relaxed pickups', 4, 60, 90, 'steady',
    'Stay relaxed; the goal is freshness, not fatigue.',
    'Brief pickups keep your legs moving before Saturday’s 5K.')
]

const tenKilometreQuality = [
  intervals('v2-b10-w10-key', 'Steady three-minute fartlek', 5, 180, 90, 'steady',
    'Lift to a purposeful effort, still clearly below a race effort.',
    'Return to controlled work after the transition week.'),
  threshold('v2-b10-w11-key', 'Three 6-minute tempo blocks', 3, 360, 120,
    'Extend comfortably-hard running while preserving an even effort.'),
  intervals('v2-b10-w12-key', 'Five 4-minute 10K efforts', 5, 240, 90, 'threshold',
    'Run at a controlled, repeatable 10K effort; slow if breathing becomes ragged.',
    'Longer repetitions practise a sustainable 10K rhythm.'),
  intervals('v2-b10-w13-key', 'Cutback-week gentle hills', 5, 60, 120, 'steady',
    'Run tall up a gentle slope and recover fully on the way down.',
    'Short form-focused hills during a lower-load week.'),
  threshold('v2-b10-w14-key', 'Two 10-minute tempo blocks', 2, 600, 180,
    'Sustain a comfortably-hard rhythm without racing the first block.'),
  intervals('v2-b10-w15-key', 'Four 6-minute 10K efforts', 4, 360, 120, 'threshold',
    'Hold a strong repeatable rhythm rather than chasing a fixed pace.',
    'The longest 10K-specific repetitions in the plan.'),
  createTempoRun('v2-b10-w16-key', 'Easy-to-steady progression', [
    {
      title: 'Settle in easy', seconds: 600, intensity: 'easy',
      instruction: 'Run at conversation pace and keep plenty in reserve.',
      cue: 'Ten minutes easy.'
    },
    {
      title: 'Lift to steady', seconds: 600, intensity: 'steady',
      instruction: 'Find a purposeful but sustainable rhythm.',
      cue: 'Ten minutes steady.'
    },
    {
      title: 'Controlled finish', seconds: 300, intensity: 'threshold',
      instruction: 'Finish comfortably hard, never all-out.',
      cue: 'Five-minute controlled finish.'
    }
  ], 0, 'Practise changing gears without turning the run into a race.'),
  intervals('v2-b10-w17-key', '10K-week relaxed pickups', 4, 60, 90, 'steady',
    'Keep the effort light and finish feeling fresh.',
    'Brief pickups before the 10K completion run.')
]

const fiveKilometreWeeks: WeekPrescription[] = [
  { number: 1, phase: 'faster-5k', title: 'Find your rhythm', mondayMinutes: 25, fridayMinutes: 20, fridayStrides: false, saturdayMinutes: 35, quality: fiveKilometreQuality[0] },
  { number: 2, phase: 'faster-5k', title: 'Run tall on gentle hills', mondayMinutes: 28, fridayMinutes: 22, fridayStrides: true, saturdayMinutes: 40, quality: fiveKilometreQuality[1] },
  { number: 3, phase: 'faster-5k', title: 'Build a stronger cruising pace', mondayMinutes: 30, fridayMinutes: 22, fridayStrides: false, saturdayMinutes: 45, saturdaySteadyMinutes: 6, quality: fiveKilometreQuality[2] },
  { number: 4, phase: 'faster-5k', title: 'Absorb the work', mondayMinutes: 25, fridayMinutes: 18, fridayStrides: false, saturdayMinutes: 35, quality: fiveKilometreQuality[3], isReduced: true },
  { number: 5, phase: 'faster-5k', title: 'Practise current 5K effort', mondayMinutes: 32, fridayMinutes: 24, fridayStrides: true, saturdayMinutes: 48, quality: fiveKilometreQuality[4] },
  { number: 6, phase: 'faster-5k', title: 'Hold strong form for longer', mondayMinutes: 34, fridayMinutes: 25, fridayStrides: false, saturdayMinutes: 52, saturdaySteadyMinutes: 8, quality: fiveKilometreQuality[5] },
  { number: 7, phase: 'faster-5k', title: 'Sharpen 5K endurance', mondayMinutes: 35, fridayMinutes: 25, fridayStrides: true, saturdayMinutes: 55, quality: fiveKilometreQuality[6] },
  { number: 8, phase: 'faster-5k', title: 'Freshen up and check your 5K', mondayMinutes: 25, fridayMinutes: 18, fridayStrides: false, saturdayMinutes: 45, quality: fiveKilometreQuality[7], isReduced: true }
]

const transitionWeek: WeekPrescription = {
  number: 9,
  phase: 'transition',
  title: 'Recover and reset',
  mondayMinutes: 25,
  fridayMinutes: 18,
  fridayStrides: false,
  saturdayMinutes: 35,
  quality: createEasyRun('v2-transition-w9-key', 'Easy run', 20),
  isReduced: true
}

const tenKilometreWeeks: WeekPrescription[] = [
  { number: 10, phase: 'build-to-10k', title: 'Begin extending endurance', mondayMinutes: 30, fridayMinutes: 22, fridayStrides: false, saturdayMinutes: 45, quality: tenKilometreQuality[0] },
  { number: 11, phase: 'build-to-10k', title: 'Lengthen your tempo', mondayMinutes: 32, fridayMinutes: 23, fridayStrides: true, saturdayMinutes: 50, quality: tenKilometreQuality[1] },
  { number: 12, phase: 'build-to-10k', title: 'Find a 10K rhythm', mondayMinutes: 35, fridayMinutes: 24, fridayStrides: false, saturdayMinutes: 55, saturdaySteadyMinutes: 8, quality: tenKilometreQuality[2] },
  { number: 13, phase: 'build-to-10k', title: 'Absorb the longer work', mondayMinutes: 28, fridayMinutes: 20, fridayStrides: false, saturdayMinutes: 45, quality: tenKilometreQuality[3], isReduced: true },
  { number: 14, phase: 'build-to-10k', title: 'Sustain a strong rhythm', mondayMinutes: 36, fridayMinutes: 25, fridayStrides: true, saturdayMinutes: 60, saturdaySteadyMinutes: 10, quality: tenKilometreQuality[4] },
  { number: 15, phase: 'build-to-10k', title: 'Extend 10K-specific effort', mondayMinutes: 38, fridayMinutes: 26, fridayStrides: false, saturdayMinutes: 65, quality: tenKilometreQuality[5] },
  { number: 16, phase: 'build-to-10k', title: 'Bring endurance and speed together', mondayMinutes: 40, fridayMinutes: 26, fridayStrides: true, saturdayMinutes: 70, saturdaySteadyMinutes: 12, quality: tenKilometreQuality[6] },
  { number: 17, phase: 'build-to-10k', title: 'Freshen up and complete your 10K', mondayMinutes: 25, fridayMinutes: 18, fridayStrides: false, saturdayMinutes: 75, quality: tenKilometreQuality[7], isReduced: true }
]

function buildWeek (prescription: WeekPrescription) {
  const { number, phase, title, mondayMinutes, fridayMinutes, fridayStrides, saturdayMinutes, saturdaySteadyMinutes = 0, quality, isReduced } = prescription
  const prefix = `v2-w${number}`
  const monday = {
    ...createEasyRun(`${prefix}-monday`, 'Easy run', mondayMinutes),
    description: number === 1
      ? 'Ease into the plan at a conversational effort. Finish feeling ready for your next session.'
      : 'An easy conversational run after Saturday’s longer run. Save your energy for Wednesday.'
  }
  const friday = fridayStrides
    ? createStrideRun(`${prefix}-friday`, 'Easy run + strides', fridayMinutes)
    : {
        ...createEasyRun(`${prefix}-friday`, 'Easy run', fridayMinutes),
        description: 'Keep this one short and gentle so you feel ready for Saturday’s longer run.'
      }
  const saturday = number === 8
    ? createBenchmarkRun(`${prefix}-saturday`, '5K checkpoint', 5000, saturdayMinutes, 'five-k')
    : number === 17
      ? createBenchmarkRun(`${prefix}-saturday`, '10K completion run', 10000, saturdayMinutes, 'steady')
      : createLongRun(`${prefix}-saturday`,
        saturdaySteadyMinutes > 0 ? 'Long run with a steady finish' : 'Long easy run',
        saturdayMinutes, saturdaySteadyMinutes)

  const week: PlanWeek = {
    number,
    phase,
    title,
    schedule: {
      monday: monday.id,
      tuesday: isReduced ? 'strength-a-light' : 'strength-a',
      wednesday: quality.id,
      thursday: isReduced ? 'strength-b-light' : 'strength-b',
      friday: friday.id,
      saturday: saturday.id,
      sunday: null
    }
  }

  return { week, workouts: [monday, quality, friday, saturday] }
}

const builtWeeks = [...fiveKilometreWeeks, transitionWeek, ...tenKilometreWeeks].map(buildWeek)

export const revisedPlanWeeks = builtWeeks.map(({ week }) => week)
export const revisedPlanWorkouts = builtWeeks.flatMap(({ workouts }) => workouts)
