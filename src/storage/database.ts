import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from 'idb'
import {
  ActiveSessionSchema,
  BackupSchema,
  PlanEnrollmentSchema,
  ScheduledWorkoutSchema,
  UserSettingsSchema,
  WorkoutResultSchema,
  type ActiveSession,
  type Backup,
  type PlanEnrollment,
  type ScheduledWorkout,
  type UserSettings,
  type WorkoutResult
} from '../domain/models'

const DATABASE_NAME = 'personal-running-coach'
const DATABASE_VERSION = 1
const CURRENT_KEY = 'current' as const

interface LocalCounter {
  key: string
  count: number
}

interface TrainingDatabase extends DBSchema {
  settings: {
    key: typeof CURRENT_KEY
    value: UserSettings
  }
  enrollment: {
    key: typeof CURRENT_KEY
    value: PlanEnrollment
  }
  schedule: {
    key: string
    value: ScheduledWorkout
    indexes: { 'by-date': string }
  }
  activeSession: {
    key: typeof CURRENT_KEY
    value: ActiveSession
  }
  results: {
    key: string
    value: WorkoutResult
    indexes: { 'by-completed-at': string }
  }
  analytics: {
    key: string
    value: LocalCounter
  }
}

export interface TrainingRepository {
  saveSettings: (settings: UserSettings) => Promise<void>
  getSettings: () => Promise<UserSettings | null>
  saveEnrollment: (enrollment: PlanEnrollment) => Promise<void>
  getEnrollment: () => Promise<PlanEnrollment | null>
  replaceEnrollmentAndSchedule: (enrollment: PlanEnrollment, schedule: ScheduledWorkout[]) => Promise<void>
  replaceSchedule: (schedule: ScheduledWorkout[]) => Promise<void>
  listSchedule: () => Promise<ScheduledWorkout[]>
  saveActiveSession: (session: ActiveSession) => Promise<void>
  getActiveSession: () => Promise<ActiveSession | null>
  clearActiveSession: () => Promise<void>
  saveResult: (result: WorkoutResult) => Promise<void>
  listResults: () => Promise<WorkoutResult[]>
  incrementCounter: (key: string) => Promise<void>
  getCounter: (key: string) => Promise<number>
  createBackup: (exportedAt: string) => Promise<Backup>
  replaceFromBackup: (backup: Backup) => Promise<void>
  clearAllData: () => Promise<void>
  destroy: () => Promise<void>
}

export function createTrainingRepository (databaseName = DATABASE_NAME): TrainingRepository {
  let databasePromise: Promise<IDBPDatabase<TrainingDatabase>> | undefined

  function getDatabase () {
    databasePromise ??= openDB<TrainingDatabase>(databaseName, DATABASE_VERSION, {
      upgrade (database) {
        database.createObjectStore('settings')
        database.createObjectStore('enrollment')
        database.createObjectStore('schedule', { keyPath: 'id' }).createIndex('by-date', 'date')
        database.createObjectStore('activeSession')
        database.createObjectStore('results', { keyPath: 'id' }).createIndex('by-completed-at', 'completedAt')
        database.createObjectStore('analytics', { keyPath: 'key' })
      }
    })
    return databasePromise
  }

  return {
    async saveSettings (value) {
      const settings = UserSettingsSchema.parse(value)
      const database = await getDatabase()
      await database.put('settings', settings, CURRENT_KEY)
    },

    async getSettings () {
      const database = await getDatabase()
      return (await database.get('settings', CURRENT_KEY)) ?? null
    },

    async saveEnrollment (value) {
      const enrollment = PlanEnrollmentSchema.parse(value)
      const database = await getDatabase()
      await database.put('enrollment', enrollment, CURRENT_KEY)
    },

    async getEnrollment () {
      const database = await getDatabase()
      return (await database.get('enrollment', CURRENT_KEY)) ?? null
    },

    async replaceEnrollmentAndSchedule (enrollmentValue, scheduleValues) {
      const enrollment = PlanEnrollmentSchema.parse(enrollmentValue)
      const schedule = scheduleValues.map(value => ScheduledWorkoutSchema.parse(value))
      const database = await getDatabase()
      const transaction = database.transaction(['enrollment', 'schedule'], 'readwrite')
      await transaction.objectStore('enrollment').put(enrollment, CURRENT_KEY)
      await transaction.objectStore('schedule').clear()
      await Promise.all(schedule.map(entry => transaction.objectStore('schedule').put(entry)))
      await transaction.done
    },

    async replaceSchedule (values) {
      const schedule = values.map(value => ScheduledWorkoutSchema.parse(value))
      const database = await getDatabase()
      const transaction = database.transaction('schedule', 'readwrite')
      await transaction.store.clear()
      await Promise.all(schedule.map(entry => transaction.store.put(entry)))
      await transaction.done
    },

    async listSchedule () {
      const database = await getDatabase()
      return database.getAllFromIndex('schedule', 'by-date')
    },

    async saveActiveSession (value) {
      const session = ActiveSessionSchema.parse(value)
      const database = await getDatabase()
      await database.put('activeSession', session, CURRENT_KEY)
    },

    async getActiveSession () {
      const database = await getDatabase()
      return (await database.get('activeSession', CURRENT_KEY)) ?? null
    },

    async clearActiveSession () {
      const database = await getDatabase()
      await database.delete('activeSession', CURRENT_KEY)
    },

    async saveResult (value) {
      const result = WorkoutResultSchema.parse(value)
      const database = await getDatabase()
      await database.put('results', result)
    },

    async listResults () {
      const database = await getDatabase()
      const results = await database.getAllFromIndex('results', 'by-completed-at')
      return results.reverse()
    },

    async incrementCounter (key) {
      const database = await getDatabase()
      const transaction = database.transaction('analytics', 'readwrite')
      const current = await transaction.store.get(key)
      await transaction.store.put({ key, count: (current?.count ?? 0) + 1 })
      await transaction.done
    },

    async getCounter (key) {
      const database = await getDatabase()
      return (await database.get('analytics', key))?.count ?? 0
    },

    async createBackup (exportedAt) {
      const database = await getDatabase()
      const [settings, enrollment, scheduledWorkouts, results, activeSession] = await Promise.all([
        database.get('settings', CURRENT_KEY),
        database.get('enrollment', CURRENT_KEY),
        database.getAllFromIndex('schedule', 'by-date'),
        database.getAllFromIndex('results', 'by-completed-at'),
        database.get('activeSession', CURRENT_KEY)
      ])

      if (!settings) throw new Error('Complete setup before exporting a backup')

      return BackupSchema.parse({
        schemaVersion: 1,
        exportedAt,
        settings,
        enrollment: enrollment ?? null,
        scheduledWorkouts,
        results,
        activeSession: activeSession ?? null
      })
    },

    async replaceFromBackup (value) {
      const backup = BackupSchema.parse(value)
      const database = await getDatabase()
      const transaction = database.transaction(
        ['settings', 'enrollment', 'schedule', 'activeSession', 'results'],
        'readwrite'
      )

      await Promise.all([
        transaction.objectStore('settings').clear(),
        transaction.objectStore('enrollment').clear(),
        transaction.objectStore('schedule').clear(),
        transaction.objectStore('activeSession').clear(),
        transaction.objectStore('results').clear()
      ])

      await transaction.objectStore('settings').put(backup.settings, CURRENT_KEY)
      if (backup.enrollment) {
        await transaction.objectStore('enrollment').put(backup.enrollment, CURRENT_KEY)
      }
      await Promise.all(backup.scheduledWorkouts.map(entry => {
        return transaction.objectStore('schedule').put(entry)
      }))
      await Promise.all(backup.results.map(result => {
        return transaction.objectStore('results').put(result)
      }))
      if (backup.activeSession) {
        await transaction.objectStore('activeSession').put(backup.activeSession, CURRENT_KEY)
      }
      await transaction.done
    },

    async clearAllData () {
      const database = await getDatabase()
      const transaction = database.transaction(
        ['settings', 'enrollment', 'schedule', 'activeSession', 'results', 'analytics'],
        'readwrite'
      )
      await Promise.all([
        transaction.objectStore('settings').clear(),
        transaction.objectStore('enrollment').clear(),
        transaction.objectStore('schedule').clear(),
        transaction.objectStore('activeSession').clear(),
        transaction.objectStore('results').clear(),
        transaction.objectStore('analytics').clear()
      ])
      await transaction.done
    },

    async destroy () {
      if (databasePromise) {
        const database = await databasePromise
        database.close()
        databasePromise = undefined
      }
      await deleteDB(databaseName)
    }
  }
}

export const trainingRepository = createTrainingRepository()
