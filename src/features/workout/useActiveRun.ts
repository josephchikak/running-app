import { useCallback, useEffect, useRef, useState } from 'react'
import { createGpsTracker, type GpsStatus } from '../../capabilities/gps'
import { createSpeechCuePlayer } from '../../capabilities/speech'
import { createWakeLockController } from '../../capabilities/wake-lock'
import type { WorkoutTemplate } from '../../domain/models'
import {
  createWorkoutState,
  getCurrentStep,
  reduceWorkout,
  type WorkoutState
} from '../../domain/workout-engine'
import type { TrainingRepository } from '../../storage/database'

interface UseActiveRunOptions {
  workout: WorkoutTemplate
  scheduledWorkoutId: string
  repository: TrainingRepository
  speechEnabled: boolean
  vibrationEnabled: boolean
}

export function useActiveRun ({
  workout,
  scheduledWorkoutId,
  repository,
  speechEnabled,
  vibrationEnabled
}: UseActiveRunOptions) {
  const [state, setState] = useState<WorkoutState>(() => createWorkoutState(workout))
  const [isLoading, setIsLoading] = useState(true)
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle')
  const [isWakeLockHeld, setIsWakeLockHeld] = useState(false)
  const [capabilityMessage, setCapabilityMessage] = useState<string | null>(null)
  const [speech] = useState(() => createSpeechCuePlayer({
    onFallback: text => {
      setCapabilityMessage(text)
      if (vibrationEnabled) globalThis.navigator?.vibrate?.([120, 80, 120])
    }
  }))
  const [wakeLock] = useState(() => createWakeLockController())
  const [gps] = useState(() => createGpsTracker())
  const startedAt = useRef(new Date().toISOString())

  const dispatch = useCallback((event: Parameters<typeof reduceWorkout>[1]) => {
    setState(current => reduceWorkout(current, event))
  }, [])

  useEffect(() => {
    let isCurrent = true
    async function restore () {
      const checkpoint = await repository.getActiveSession()
      if (isCurrent && checkpoint?.scheduledWorkoutId === scheduledWorkoutId && checkpoint.workoutId === workout.id) {
        startedAt.current = checkpoint.startedAt
        setState(current => ({
          ...current,
          status: 'paused',
          currentStepIndex: checkpoint.currentStepIndex,
          stepElapsedSeconds: checkpoint.stepElapsedSeconds,
          totalElapsedSeconds: checkpoint.totalElapsedSeconds,
          totalDistanceMetres: checkpoint.acceptedDistanceMetres,
          completedStepIds: workout.steps.slice(0, checkpoint.currentStepIndex).map(step => step.id)
        }))
      }
      if (isCurrent) setIsLoading(false)
    }
    void restore()
    return () => { isCurrent = false }
  }, [repository, scheduledWorkoutId, workout])

  useEffect(() => {
    if (state.status !== 'active') return
    const timer = window.setInterval(() => dispatch({ type: 'TICK', elapsedSeconds: 1 }), 1000)
    return () => window.clearInterval(timer)
  }, [dispatch, state.status])

  useEffect(() => {
    if (state.status !== 'active' && state.status !== 'paused') return
    void repository.saveActiveSession({
      id: `active-${scheduledWorkoutId}`,
      scheduledWorkoutId,
      workoutId: workout.id,
      workoutVersion: workout.version,
      status: state.status,
      currentStepIndex: state.currentStepIndex,
      stepElapsedSeconds: state.stepElapsedSeconds,
      totalElapsedSeconds: state.totalElapsedSeconds,
      acceptedDistanceMetres: state.totalDistanceMetres,
      startedAt: startedAt.current,
      updatedAt: new Date().toISOString()
    })
  }, [repository, scheduledWorkoutId, state, workout.id, workout.version])

  useEffect(() => {
    const changedStep = state.events.find(event => event.type === 'STEP_CHANGED')
    if (!changedStep || !speechEnabled) return
    const step = workout.steps[changedStep.stepIndex]
    if (step) speech.enqueue(step.cue)
  }, [speech, speechEnabled, state.events, workout.steps])

  useEffect(() => {
    return () => {
      gps.stop()
      speech.stop()
      void wakeLock.release()
    }
  }, [gps, speech, wakeLock])

  const startCapabilities = useCallback(async () => {
    speech.prime()
    if (speechEnabled) speech.enqueue(getCurrentStep(state)?.cue ?? 'Run started')
    setIsWakeLockHeld(await wakeLock.acquire())
    try {
      await gps.start(event => {
        if (event.type === 'sample') {
          setGpsStatus('tracking')
          dispatch({ type: 'DISTANCE', metres: event.distanceMetres })
        } else if (event.type === 'rejected') {
          setGpsStatus('weak')
        } else {
          setGpsStatus('error')
          setCapabilityMessage(event.message)
        }
      })
      setGpsStatus(gps.getStatus())
    } catch {
      setGpsStatus('error')
      setCapabilityMessage('GPS is unavailable. Time guidance will continue.')
    }
  }, [dispatch, gps, speech, speechEnabled, state, wakeLock])

  const start = useCallback(async () => {
    startedAt.current = new Date().toISOString()
    await startCapabilities()
    dispatch({ type: 'START' })
    await repository.incrementCounter('workouts-started')
  }, [dispatch, repository, startCapabilities])

  const resume = useCallback(async () => {
    await startCapabilities()
    dispatch({ type: 'RESUME' })
  }, [dispatch, startCapabilities])

  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), [dispatch])
  const skip = useCallback(() => dispatch({ type: 'SKIP' }), [dispatch])

  const finish = useCallback(async () => {
    dispatch({ type: 'FINISH' })
    gps.stop()
    speech.stop()
    await wakeLock.release()
    setGpsStatus('idle')
    setIsWakeLockHeld(false)
    const averagePace = state.totalDistanceMetres >= 10
      ? state.totalElapsedSeconds / (state.totalDistanceMetres / 1000)
      : null
    await repository.saveResult({
      id: `result-${Date.now()}`,
      scheduledWorkoutId,
      workoutId: workout.id,
      completedAt: new Date().toISOString(),
      status: state.status === 'completed' ? 'completed' : 'stopped',
      durationSeconds: state.totalElapsedSeconds,
      distanceMetres: state.totalDistanceMetres,
      averagePaceSecondsPerKilometre: averagePace,
      completedStepIds: state.completedStepIds,
      notes: ''
    })
    await repository.clearActiveSession()
    const schedule = await repository.listSchedule()
    await repository.replaceSchedule(schedule.map(entry => {
      return entry.id === scheduledWorkoutId ? { ...entry, status: 'completed' as const } : entry
    }))
  }, [dispatch, gps, repository, scheduledWorkoutId, speech, state, wakeLock, workout.id])

  return {
    state,
    isLoading,
    gpsStatus,
    isWakeLockHeld,
    capabilityMessage,
    start,
    pause,
    resume,
    skip,
    finish
  }
}
