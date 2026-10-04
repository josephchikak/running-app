import type { PlanTemplate, ScheduledWorkout } from './models'

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const

export function upgradeScheduledWorkouts (
  schedule: ScheduledWorkout[],
  plan: PlanTemplate,
  activeScheduledWorkoutId: string | null
): ScheduledWorkout[] {
  const weeks = new Map(plan.weeks.map(week => [week.number, week]))

  return schedule.map(entry => {
    if (entry.status !== 'scheduled' || entry.workoutId === null || entry.id === activeScheduledWorkoutId) {
      return entry
    }

    const week = weeks.get(entry.weekNumber)
    const date = new Date(`${entry.date}T12:00:00Z`)
    const day = DAYS[(date.getUTCDay() + 6) % 7]
    const workoutId = week?.schedule[day]
    if (!workoutId) throw new Error('Saved schedule cannot be matched to the revised plan')

    return { ...entry, workoutId }
  })
}
