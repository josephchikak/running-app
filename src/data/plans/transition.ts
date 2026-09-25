import type { PlanWeek, WorkoutTemplate } from '../../domain/models'
import { createEasyRun, createLongRun, createStrideRun } from './workout-builders'

export const transitionWorkouts: WorkoutTemplate[] = [
  createEasyRun('transition-w9-easy', 'Gentle reset run', 25),
  createEasyRun('transition-w9-quality', 'Easy run with no workout pressure', 20),
  createStrideRun('transition-w9-strides', 'Short easy run and strides', 20),
  createLongRun('transition-w9-long', 'Comfortable transition run', 35)
]

export const transitionWeek: PlanWeek = {
  number: 9,
  phase: 'transition',
  title: 'Absorb the 5K block',
  schedule: {
    monday: 'transition-w9-easy',
    tuesday: 'strength-a-light',
    wednesday: 'transition-w9-quality',
    thursday: 'strength-b-light',
    friday: 'transition-w9-strides',
    saturday: 'transition-w9-long',
    sunday: null
  }
}
