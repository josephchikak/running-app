import { describe, expect, it } from 'vitest'
import { PlanTemplateSchema, WorkoutTemplateSchema } from '../../domain/models'
import { exerciseCatalog, legacyTrainingCatalog, trainingCatalog, workoutCatalog } from './catalog'

describe('training catalog', () => {
  it('contains the complete phased seventeen-week sequence', () => {
    expect(trainingCatalog.version).toBe(2)
    expect(trainingCatalog.weeks).toHaveLength(17)
    expect(trainingCatalog.weeks.slice(0, 8).every(week => week.phase === 'faster-5k')).toBe(true)
    expect(trainingCatalog.weeks[8].phase).toBe('transition')
    expect(trainingCatalog.weeks.slice(9).every(week => week.phase === 'build-to-10k')).toBe(true)
    expect(PlanTemplateSchema.safeParse(trainingCatalog).success).toBe(true)
  })

  it('opens with manageable volume and keeps the prior catalog available', () => {
    const firstWeek = trainingCatalog.weeks[0]
    const firstWeekRunMinutes = [
      firstWeek.schedule.monday,
      firstWeek.schedule.wednesday,
      firstWeek.schedule.friday,
      firstWeek.schedule.saturday
    ].reduce((total, id) => total + workoutCatalog[id].estimatedMinutes, 0)

    expect(firstWeekRunMinutes).toBeLessThanOrEqual(115)
    expect(workoutCatalog[firstWeek.schedule.saturday].estimatedMinutes).toBe(35)
    expect(firstWeek.schedule.monday).not.toBe('f5-w1-easy')
    expect(workoutCatalog['f5-w1-easy']).toBeDefined()
    expect(legacyTrainingCatalog.version).toBe(1)
    expect(legacyTrainingCatalog.weeks).toHaveLength(17)
  })

  it('gives the four weekly runs distinct purposes without stacking hard days', () => {
    const fridayRunTypes = new Set<string>()

    for (const week of trainingCatalog.weeks) {
      const { monday, wednesday, friday, saturday, sunday } = week.schedule
      expect(sunday).toBeNull()
      expect(workoutCatalog[monday].kind).toBe('run')
      expect(workoutCatalog[wednesday].kind).toBe('run')
      expect(workoutCatalog[friday].kind).toBe('run')
      expect(workoutCatalog[saturday].kind).toBe('run')
      expect(workoutCatalog[monday].title).not.toBe(workoutCatalog[friday].title)
      expect(workoutCatalog[monday].description).not.toBe(workoutCatalog[friday].description)
      expect(workoutCatalog[friday].steps.every(step => {
        return step.kind !== 'run' || !['five-k', 'threshold'].includes(step.intensity)
      })).toBe(true)
      fridayRunTypes.add(workoutCatalog[friday].steps.some(step => {
        return step.kind === 'run' && step.intensity === 'stride'
      }) ? 'strides' : 'recovery')
    }

    expect(fridayRunTypes).toEqual(new Set(['strides', 'recovery']))
  })

  it('resolves every scheduled workout to a valid template', () => {
    const scheduledIds = trainingCatalog.weeks.flatMap(week => Object.values(week.schedule))
      .filter((workoutId): workoutId is string => workoutId !== null)

    expect(scheduledIds.every(workoutId => workoutId in workoutCatalog)).toBe(true)
    expect(Object.values(workoutCatalog).every(workout => WorkoutTemplateSchema.safeParse(workout).success)).toBe(true)
  })

  it('wraps every run in a recovery-intensity warm-up and cool-down', () => {
    const runWorkouts = Object.values(workoutCatalog).filter(workout => workout.kind === 'run')

    expect(runWorkouts.length).toBeGreaterThan(0)
    for (const workout of runWorkouts) {
      expect(workout.steps[0]).toMatchObject({ kind: 'run', intensity: 'recovery' })
      expect(workout.steps.at(-1)).toMatchObject({ kind: 'run', intensity: 'recovery' })
    }
  })

  it('keeps strength exercises bodyweight-first with an easier option', () => {
    expect(exerciseCatalog.length).toBeGreaterThanOrEqual(8)
    expect(exerciseCatalog.every(exercise => ['none', 'band', 'step'].includes(exercise.equipment))).toBe(true)
    expect(exerciseCatalog.every(exercise => exercise.easierVariation.length > 0)).toBe(true)
  })

  it('keeps every strength session within the planned twenty to twenty-five minutes', () => {
    const strengthWorkouts = Object.values(workoutCatalog).filter(workout => workout.kind === 'strength')

    expect(strengthWorkouts.every(workout => {
      return workout.estimatedMinutes >= 20 && workout.estimatedMinutes <= 25
    })).toBe(true)
  })

  it('uses reduced-load weeks before benchmarks and after the 5K block', () => {
    const weeklyMinutes = trainingCatalog.weeks.map(week => {
      return Object.values(week.schedule).reduce((total, workoutId) => {
        if (workoutId === null) return total
        const workout = workoutCatalog[workoutId]
        return workout.kind === 'run' ? total + workout.estimatedMinutes : total
      }, 0)
    })

    expect(weeklyMinutes[3]).toBeLessThan(weeklyMinutes[2])
    expect(weeklyMinutes[7]).toBeLessThan(weeklyMinutes[6])
    expect(weeklyMinutes[8]).toBeLessThanOrEqual(weeklyMinutes[7])
    expect(weeklyMinutes[16]).toBeLessThan(weeklyMinutes[15])
  })
})
