import type { PlanTemplate } from './models'

export interface ScheduleEntry {
  id: string
  date: string
  weekNumber: number
  workoutId: string | null
  kind: 'easy-run' | 'strength-a' | 'quality-run' | 'strength-b' | 'short-easy' | 'long-run' | 'rest'
  status: 'scheduled' | 'completed' | 'skipped'
}

interface DatedWorkout {
  id: string
  date: string
  workoutId: string | null
  status: ScheduleEntry['status']
}

const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const

const DAY_KINDS: ScheduleEntry['kind'][] = [
  'easy-run',
  'strength-a',
  'quality-run',
  'strength-b',
  'short-easy',
  'long-run',
  'rest'
]

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseLocalDate (value: string) {
  if (!DATE_PATTERN.test(value)) throw new Error('Start date must be a valid date in YYYY-MM-DD format')

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const isExactDate = date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day

  if (!isExactDate) throw new Error('Start date must be a valid date in YYYY-MM-DD format')

  return date
}

function formatDate (date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays (date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export function getNextMonday (dateValue: string) {
  const date = parseLocalDate(dateValue)
  return formatDate(addDays(date, (8 - date.getUTCDay()) % 7))
}

export function expandPlanSchedule (plan: PlanTemplate, startDate: string): ScheduleEntry[] {
  const firstDay = parseLocalDate(startDate)
  const startWeekday = firstDay.getUTCDay()
  const firstMonday = addDays(firstDay, startWeekday === 0 ? 1 : 1 - startWeekday)

  return plan.weeks.flatMap((week, weekIndex) => {
    return DAY_KEYS.flatMap((day, dayIndex) => {
      const date = formatDate(addDays(firstMonday, weekIndex * 7 + dayIndex))
      if (date < startDate) return []
      if (weekIndex === 0 && ((startWeekday === 2 && day === 'wednesday') ||
        (startWeekday === 4 && day === 'friday'))) return []

      const isOpeningEasyRun = weekIndex === 0 && date === startDate &&
        startWeekday >= 2 && startWeekday <= 4
      const workoutId = isOpeningEasyRun ? plan.weeks[0].schedule.monday : week.schedule[day]

      return [{
        id: `week-${week.number}-${day}-${date}`,
        date,
        weekNumber: week.number,
        workoutId,
        kind: isOpeningEasyRun ? 'easy-run' as const : DAY_KINDS[dayIndex],
        status: 'scheduled' as const
      }]
    })
  })
}

export function getTodayEntry (schedule: ScheduleEntry[], date: string) {
  parseLocalDate(date)
  return schedule.find(entry => entry.date === date)
}

export function getOverdueWorkouts<T extends DatedWorkout> (schedule: readonly T[], date: string): T[] {
  parseLocalDate(date)
  return schedule.filter(entry => {
    return entry.date < date && entry.workoutId !== null && entry.status === 'scheduled'
  })
}

export function updateWorkoutStatus<T extends DatedWorkout> (
  schedule: readonly T[],
  scheduledWorkoutId: string,
  status: ScheduleEntry['status']
): T[] {
  const target = schedule.find(entry => entry.id === scheduledWorkoutId && entry.workoutId !== null)
  if (!target) throw new Error('Scheduled workout not found')

  return schedule.map(entry => {
    return entry.id === scheduledWorkoutId ? { ...entry, status } : entry
  })
}

export function getWeeklyProgress (schedule: ScheduleEntry[], date: string) {
  const today = getTodayEntry(schedule, date)
  if (!today) return { completed: 0, total: 0 }

  const sessions = schedule.filter(entry => {
    return entry.weekNumber === today.weekNumber && entry.kind !== 'rest'
  })

  return {
    completed: sessions.filter(entry => entry.status === 'completed').length,
    total: sessions.length
  }
}
