import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { trainingCatalog } from '../data/plans/catalog'
import type {
  PlanEnrollment,
  ScheduledWorkout,
  UserSettings,
  WorkoutResult
} from '../domain/models'
import { expandPlanSchedule } from '../domain/schedule'
import { importBackup } from '../storage/backup'
import { trainingRepository, type TrainingRepository } from '../storage/database'

const DEFAULT_SETTINGS: UserSettings = {
  units: 'metric',
  currentFiveKilometreSeconds: 1800,
  speechEnabled: true,
  vibrationEnabled: true
}

interface TrainingContextValue {
  repository: TrainingRepository
  today: string
  settings: UserSettings
  enrollment: PlanEnrollment | null
  schedule: ScheduledWorkout[]
  results: WorkoutResult[]
  isLoading: boolean
  error: string | null
  startPlan: () => Promise<void>
  saveSettings: (settings: UserSettings) => Promise<void>
  restoreBackup: (json: string) => Promise<void>
  eraseAllData: () => Promise<void>
  refresh: () => Promise<void>
}

const TrainingContext = createContext<TrainingContextValue | null>(null)

interface TrainingProviderProps {
  children: ReactNode
  repository?: TrainingRepository
  now?: Date
}

export function TrainingProvider ({
  children,
  repository = trainingRepository,
  now
}: TrainingProviderProps) {
  const today = useMemo(() => formatLocalDate(now ?? new Date()), [now])
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [enrollment, setEnrollment] = useState<PlanEnrollment | null>(null)
  const [schedule, setSchedule] = useState<ScheduledWorkout[]>([])
  const [results, setResults] = useState<WorkoutResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const [savedSettings, savedEnrollment, savedSchedule, savedResults] = await Promise.all([
      repository.getSettings(),
      repository.getEnrollment(),
      repository.listSchedule(),
      repository.listResults()
    ])
    setSettings(savedSettings ?? DEFAULT_SETTINGS)
    setEnrollment(savedEnrollment)
    setSchedule(savedSchedule)
    setResults(savedResults)
  }, [repository])

  useEffect(() => {
    let isCurrent = true

    async function load () {
      try {
        await reload()
      } catch {
        if (isCurrent) setError('Your saved training data could not be opened.')
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void load()
    return () => {
      isCurrent = false
    }
  }, [reload])

  const startPlan = useCallback(async () => {
    const startDate = getNextMonday(today)
    const nextEnrollment: PlanEnrollment = {
      planId: trainingCatalog.id,
      planVersion: trainingCatalog.version,
      startDate,
      currentFiveKilometreSeconds: settings.currentFiveKilometreSeconds,
      status: 'active'
    }
    const nextSchedule: ScheduledWorkout[] = expandPlanSchedule(trainingCatalog, startDate).map(entry => ({
      id: entry.id,
      date: entry.date,
      weekNumber: entry.weekNumber,
      workoutId: entry.workoutId,
      status: entry.status
    }))

    await Promise.all([
      repository.saveSettings(settings),
      repository.saveEnrollment(nextEnrollment),
      repository.replaceSchedule(nextSchedule)
    ])
    setEnrollment(nextEnrollment)
    setSchedule(nextSchedule)
    setError(null)
  }, [repository, settings, today])

  const saveSettings = useCallback(async (nextSettings: UserSettings) => {
    await repository.saveSettings(nextSettings)
    setSettings(nextSettings)
  }, [repository])

  const restoreBackup = useCallback(async (json: string) => {
    await importBackup(repository, json)
    await reload()
  }, [reload, repository])

  const eraseAllData = useCallback(async () => {
    await repository.clearAllData()
    setSettings(DEFAULT_SETTINGS)
    setEnrollment(null)
    setSchedule([])
    setResults([])
  }, [repository])

  const value = useMemo<TrainingContextValue>(() => ({
    repository,
    today,
    settings,
    enrollment,
    schedule,
    results,
    isLoading,
    error,
    startPlan,
    saveSettings,
    restoreBackup,
    eraseAllData,
    refresh: reload
  }), [
    repository,
    today,
    settings,
    enrollment,
    schedule,
    results,
    isLoading,
    error,
    startPlan,
    saveSettings,
    restoreBackup,
    eraseAllData,
    reload
  ])

  return <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>
}

export function useTraining () {
  const context = useContext(TrainingContext)
  if (!context) throw new Error('useTraining must be used within TrainingProvider')
  return context
}

function formatLocalDate (date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getNextMonday (dateValue: string) {
  const date = new Date(`${dateValue}T12:00:00Z`)
  const daysUntilMonday = (8 - date.getUTCDay()) % 7
  date.setUTCDate(date.getUTCDate() + daysUntilMonday)
  return date.toISOString().slice(0, 10)
}
