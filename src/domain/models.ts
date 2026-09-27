import { z } from 'zod'

const IdentifierSchema = z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
const TitleSchema = z.string().trim().min(1).max(120)
const InstructionSchema = z.string().trim().min(1).max(500)

export const IntensitySchema = z.enum([
  'recovery',
  'easy',
  'steady',
  'threshold',
  'five-k',
  'stride'
])

const TimeCompletionSchema = z.object({
  type: z.literal('time'),
  seconds: z.number().int().positive().max(21600)
}).strict()

const DistanceCompletionSchema = z.object({
  type: z.literal('distance'),
  metres: z.number().int().positive().max(100000)
}).strict()

const RepetitionCompletionSchema = z.object({
  type: z.literal('repetitions'),
  count: z.number().int().positive().max(200)
}).strict()

export const CompletionRuleSchema = z.discriminatedUnion('type', [
  TimeCompletionSchema,
  DistanceCompletionSchema,
  RepetitionCompletionSchema
])

const StepBaseSchema = z.object({
  id: IdentifierSchema,
  title: TitleSchema,
  instruction: InstructionSchema,
  cue: InstructionSchema
})

const RunStepSchema = StepBaseSchema.extend({
  kind: z.literal('run'),
  intensity: IntensitySchema,
  completion: z.union([TimeCompletionSchema, DistanceCompletionSchema])
}).strict()

const ExerciseStepSchema = StepBaseSchema.extend({
  kind: z.literal('exercise'),
  exerciseId: IdentifierSchema,
  completion: z.union([TimeCompletionSchema, RepetitionCompletionSchema]),
  side: z.enum(['both', 'left', 'right']).default('both')
}).strict()

const RestStepSchema = StepBaseSchema.extend({
  kind: z.literal('rest'),
  completion: TimeCompletionSchema
}).strict()

export const WorkoutStepSchema = z.discriminatedUnion('kind', [
  RunStepSchema,
  ExerciseStepSchema,
  RestStepSchema
])

export const WorkoutTemplateSchema = z.object({
  id: IdentifierSchema,
  version: z.number().int().positive(),
  kind: z.enum(['run', 'strength']),
  title: TitleSchema,
  description: InstructionSchema,
  estimatedMinutes: z.number().int().positive().max(360),
  steps: z.array(WorkoutStepSchema).min(1).max(200)
}).strict()

const WeekScheduleSchema = z.object({
  monday: IdentifierSchema,
  tuesday: IdentifierSchema,
  wednesday: IdentifierSchema,
  thursday: IdentifierSchema,
  friday: IdentifierSchema,
  saturday: IdentifierSchema,
  sunday: IdentifierSchema.nullable()
}).strict()

export const PlanWeekSchema = z.object({
  number: z.number().int().positive().max(52),
  phase: z.enum(['faster-5k', 'transition', 'build-to-10k']),
  title: TitleSchema,
  schedule: WeekScheduleSchema
}).strict()

export const PlanTemplateSchema = z.object({
  id: IdentifierSchema,
  version: z.number().int().positive(),
  title: TitleSchema,
  weeks: z.array(PlanWeekSchema).min(1).max(52)
}).strict().superRefine((plan, context) => {
  const weekNumbers = plan.weeks.map(week => week.number)
  const uniqueWeekNumbers = new Set(weekNumbers)

  if (uniqueWeekNumbers.size !== weekNumbers.length) {
    context.addIssue({
      code: 'custom',
      message: 'Plan week numbers must be unique',
      path: ['weeks']
    })
  }
})

const LocalDateSchema = z.iso.date()
const TimestampSchema = z.iso.datetime({ offset: true })

export const UserSettingsSchema = z.object({
  units: z.literal('metric'),
  currentFiveKilometreSeconds: z.number().int().min(600).max(10800),
  speechEnabled: z.boolean(),
  vibrationEnabled: z.boolean()
}).strict()

export const PlanEnrollmentSchema = z.object({
  planId: IdentifierSchema,
  planVersion: z.number().int().positive(),
  startDate: LocalDateSchema,
  currentFiveKilometreSeconds: z.number().int().min(600).max(10800),
  status: z.enum(['active', 'completed'])
}).strict()

export const ScheduledWorkoutSchema = z.object({
  id: IdentifierSchema,
  date: LocalDateSchema,
  weekNumber: z.number().int().positive().max(52),
  workoutId: IdentifierSchema.nullable(),
  status: z.enum(['scheduled', 'completed', 'skipped'])
}).strict()

export const ActiveSessionSchema = z.object({
  id: IdentifierSchema,
  scheduledWorkoutId: IdentifierSchema,
  workoutId: IdentifierSchema,
  workoutVersion: z.number().int().positive(),
  status: z.enum(['active', 'paused']),
  currentStepIndex: z.number().int().nonnegative(),
  stepElapsedSeconds: z.number().nonnegative(),
  totalElapsedSeconds: z.number().nonnegative(),
  acceptedDistanceMetres: z.number().nonnegative(),
  startedAt: TimestampSchema,
  updatedAt: TimestampSchema
}).strict()

export const WorkoutResultSchema = z.object({
  id: IdentifierSchema,
  scheduledWorkoutId: IdentifierSchema,
  workoutId: IdentifierSchema,
  plannedDate: LocalDateSchema.optional(),
  completedAt: TimestampSchema,
  status: z.enum(['completed', 'stopped']),
  durationSeconds: z.number().nonnegative(),
  distanceMetres: z.number().nonnegative(),
  averagePaceSecondsPerKilometre: z.number().positive().nullable(),
  completedStepIds: z.array(IdentifierSchema).max(200),
  notes: z.string().trim().max(500)
}).strict()

export const BackupSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: TimestampSchema,
  settings: UserSettingsSchema,
  enrollment: PlanEnrollmentSchema.nullable(),
  scheduledWorkouts: z.array(ScheduledWorkoutSchema).max(500),
  results: z.array(WorkoutResultSchema).max(1000),
  activeSession: ActiveSessionSchema.nullable()
}).strict()

export type Intensity = z.infer<typeof IntensitySchema>
export type CompletionRule = z.infer<typeof CompletionRuleSchema>
export type WorkoutStep = z.infer<typeof WorkoutStepSchema>
export type WorkoutTemplate = z.infer<typeof WorkoutTemplateSchema>
export type PlanWeek = z.infer<typeof PlanWeekSchema>
export type PlanTemplate = z.infer<typeof PlanTemplateSchema>
export type UserSettings = z.infer<typeof UserSettingsSchema>
export type PlanEnrollment = z.infer<typeof PlanEnrollmentSchema>
export type ScheduledWorkout = z.infer<typeof ScheduledWorkoutSchema>
export type ActiveSession = z.infer<typeof ActiveSessionSchema>
export type WorkoutResult = z.infer<typeof WorkoutResultSchema>
export type Backup = z.infer<typeof BackupSchema>
