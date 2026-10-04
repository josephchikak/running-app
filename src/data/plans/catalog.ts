import { PlanTemplateSchema, WorkoutTemplateSchema, type WorkoutTemplate } from '../../domain/models'
import { buildToTenKilometreWeeks, buildToTenKilometreWorkouts } from './build-to-10k'
import { exerciseCatalog } from './exercises'
import { fasterFiveKilometreWeeks, fasterFiveKilometreWorkouts } from './faster-5k'
import { transitionWeek, transitionWorkouts } from './transition'
import { createStrengthWorkout } from './workout-builders'
import { revisedPlanWeeks, revisedPlanWorkouts } from './revised-plan'

export { exerciseCatalog }

const strengthWorkouts = [
  createStrengthWorkout('strength-a', 'Strength A · legs and trunk', [
    { exerciseId: 'chair-squat', title: 'Chair squat', count: 10 },
    { exerciseId: 'reverse-lunge', title: 'Reverse lunge', count: 8 },
    { exerciseId: 'single-leg-calf-raise', title: 'Single-leg calf raise', count: 10 },
    { exerciseId: 'dead-bug', title: 'Dead bug', seconds: 35 }
  ], 3, 25, 22),
  createStrengthWorkout('strength-b', 'Strength B · hips and control', [
    { exerciseId: 'glute-bridge', title: 'Glute bridge', count: 12 },
    { exerciseId: 'step-down', title: 'Controlled step-down', count: 8 },
    { exerciseId: 'band-side-step', title: 'Band side step', seconds: 30 },
    { exerciseId: 'side-plank', title: 'Side plank', seconds: 25 }
  ], 3, 25, 22),
  createStrengthWorkout('strength-a-light', 'Light strength A', [
    { exerciseId: 'chair-squat', title: 'Chair squat', count: 8 },
    { exerciseId: 'single-leg-calf-raise', title: 'Calf raise', count: 10 },
    { exerciseId: 'bird-dog', title: 'Bird dog', seconds: 30 }
  ], 2, 25, 20),
  createStrengthWorkout('strength-b-light', 'Light strength B and mobility', [
    { exerciseId: 'glute-bridge', title: 'Glute bridge', count: 10 },
    { exerciseId: 'hamstring-walkout', title: 'Hamstring walkout', count: 6 },
    { exerciseId: 'side-plank', title: 'Side plank', seconds: 20 }
  ], 2, 25, 20)
]

const workouts = [
  ...strengthWorkouts,
  ...fasterFiveKilometreWorkouts,
  ...transitionWorkouts,
  ...buildToTenKilometreWorkouts,
  ...revisedPlanWorkouts
].map(workout => WorkoutTemplateSchema.parse(workout))

export const workoutCatalog: Record<string, WorkoutTemplate> = Object.fromEntries(
  workouts.map(workout => [workout.id, workout])
)

export const legacyTrainingCatalog = PlanTemplateSchema.parse({
  id: 'personal-5k-to-10k',
  version: 1,
  title: '5K speed to 10K strength',
  weeks: [
    ...fasterFiveKilometreWeeks,
    transitionWeek,
    ...buildToTenKilometreWeeks
  ]
})

export const trainingCatalog = PlanTemplateSchema.parse({
  id: 'personal-5k-to-10k',
  version: 2,
  title: '5K speed to 10K strength',
  weeks: revisedPlanWeeks
})
