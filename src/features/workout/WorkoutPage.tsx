import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTraining } from '../../app/TrainingContext'
import { workoutCatalog } from '../../data/plans/catalog'
import { formatPace, getPaceGuidance } from '../../domain/pace'
import { getCurrentStep, getStepRemaining } from '../../domain/workout-engine'
import type { WorkoutTemplate } from '../../domain/models'
import { useActiveRun } from './useActiveRun'

interface WorkoutPageProps {
  workout?: WorkoutTemplate
  scheduledWorkoutId?: string
}

export function WorkoutPage (props: WorkoutPageProps) {
  const parameters = useParams()
  const navigate = useNavigate()
  const { repository, schedule, settings, refresh } = useTraining()
  const scheduledWorkoutId = props.scheduledWorkoutId ?? parameters.scheduledWorkoutId ?? ''
  const scheduled = schedule.find(entry => entry.id === scheduledWorkoutId)
  const workout = props.workout ?? (scheduled?.workoutId ? workoutCatalog[scheduled.workoutId] : undefined)

  if (!workout || workout.kind !== 'run') {
    return <section className='run-player run-player--message'><h1>Run not found</h1><p>Return to Today and choose a scheduled run.</p></section>
  }

  const handleFinished = async () => {
    await refresh()
    navigate('/history')
  }

  return <ActiveRunScreen scheduledWorkoutId={scheduledWorkoutId} workout={workout} onFinished={handleFinished} settings={settings} repository={repository} />
}

interface ActiveRunScreenProps {
  scheduledWorkoutId: string
  workout: WorkoutTemplate
  repository: ReturnType<typeof useTraining>['repository']
  settings: ReturnType<typeof useTraining>['settings']
  onFinished: () => Promise<void>
}

function ActiveRunScreen ({ scheduledWorkoutId, workout, repository, settings, onFinished }: ActiveRunScreenProps) {
  const [isConfirmingFinish, setIsConfirmingFinish] = useState(false)
  const controller = useActiveRun({
    workout,
    scheduledWorkoutId,
    repository,
    speechEnabled: settings.speechEnabled,
    vibrationEnabled: settings.vibrationEnabled
  })
  const step = getCurrentStep(controller.state)
  const nextStep = workout.steps[controller.state.currentStepIndex + 1]
  const handleFinish = useCallback(async () => {
    await controller.finish()
    await onFinished()
  }, [controller, onFinished])
  const handleAskFinish = useCallback(() => setIsConfirmingFinish(true), [])
  const handleCancelFinish = useCallback(() => setIsConfirmingFinish(false), [])

  if (controller.isLoading || !step) return <p className='route-loading' role='status'>Restoring run…</p>

  const remaining = getStepRemaining(controller.state)
  const guidance = step.kind === 'run'
    ? getPaceGuidance(settings.currentFiveKilometreSeconds, step.intensity)
    : null
  const averagePace = controller.state.totalDistanceMetres >= 10
    ? controller.state.totalElapsedSeconds / (controller.state.totalDistanceMetres / 1000)
    : null

  return (
    <section className='run-player'>
      <header className='run-player__status'>
        <span className={`capability capability--${controller.gpsStatus}`}>GPS {controller.gpsStatus}</span>
        <span className={controller.isWakeLockHeld ? 'capability capability--tracking' : 'capability'}>Screen lock {controller.isWakeLockHeld ? 'on' : 'off'}</span>
      </header>
      <main className='run-player__main'>
        <p className='page-kicker'>Step {controller.state.currentStepIndex + 1} of {workout.steps.length}</p>
        <h1>{step.title}</h1>
        <p className='run-player__countdown'>{step.completion.type === 'distance' ? `${(remaining / 1000).toFixed(2)} km` : formatDuration(remaining)}</p>
        <p className='run-player__instruction'>{step.instruction}</p>
        {guidance && <p className='run-player__guidance'>{formatPace(guidance.minimumSecondsPerKilometre)}–{formatPace(guidance.maximumSecondsPerKilometre)} · {guidance.effort}</p>}
        <dl className='run-metrics'>
          <div><dt>Distance</dt><dd>{(controller.state.totalDistanceMetres / 1000).toFixed(2)} km</dd></div>
          <div><dt>Avg pace</dt><dd>{averagePace ? formatPace(averagePace) : '—'}</dd></div>
          <div><dt>Elapsed</dt><dd>{formatDuration(controller.state.totalElapsedSeconds)}</dd></div>
        </dl>
        {nextStep && <p className='run-player__next'><span>Next</span>{nextStep.title}</p>}
        {controller.capabilityMessage && <p className='status-message'>{controller.capabilityMessage}</p>}
      </main>
      <footer className='run-player__controls'>
        {controller.state.status === 'ready' && <button className='primary-action' onClick={controller.start} type='button'>Start run</button>}
        {controller.state.status === 'paused' && <button className='primary-action' onClick={controller.resume} type='button'>Resume run</button>}
        {controller.state.status === 'active' && <button className='primary-action' onClick={controller.pause} type='button'>Pause run</button>}
        <div><button onClick={controller.skip} type='button'>Skip step</button><button onClick={handleAskFinish} type='button'>Finish</button></div>
        {isConfirmingFinish && (
          <div className='finish-confirmation' role='alert'>
            <p>End this run now? Your time and distance so far will be saved.</p>
            <button onClick={handleFinish} type='button'>Save and finish</button>
            <button onClick={handleCancelFinish} type='button'>Keep running</button>
          </div>
        )}
      </footer>
    </section>
  )
}

function formatDuration (seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainder = Math.ceil(seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainder}`
}
