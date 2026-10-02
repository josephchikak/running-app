import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { StepProgress } from '../../components/StepProgress'
import { WorkoutControls } from '../../components/WorkoutControls'
import { exerciseCatalog } from '../../data/plans/catalog'
import type { WorkoutTemplate } from '../../domain/models'
import {
  createWorkoutState,
  getCurrentStep,
  getStepRemaining,
  reduceWorkout
} from '../../domain/workout-engine'

interface StrengthPageProps {
  workout: WorkoutTemplate
  onFinish?: (result: StrengthCompletion) => void | Promise<void>
}

export interface StrengthCompletion {
  status: 'completed' | 'stopped'
  durationSeconds: number
  completedStepIds: string[]
}

export function StrengthPage ({ workout, onFinish }: StrengthPageProps) {
  const [state, dispatch] = useReducer(
    reduceWorkout,
    workout,
    value => reduceWorkout(createWorkoutState(value), { type: 'START' })
  )
  const hasReportedFinish = useRef(false)
  const step = getCurrentStep(state)
  const exercise = useMemo(() => {
    if (!step || step.kind !== 'exercise') return undefined
    return exerciseCatalog.find(item => item.id === step.exerciseId)
  }, [step])

  useEffect(() => {
    if (state.status !== 'active') return

    const timer = window.setInterval(() => {
      dispatch({ type: 'TICK', elapsedSeconds: 1 })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [state.status])

  useEffect(() => {
    if (state.status !== 'completed' || hasReportedFinish.current) return
    hasReportedFinish.current = true
    const status = state.completedStepIds.length === workout.steps.length ? 'completed' : 'stopped'
    void onFinish?.({
      status,
      durationSeconds: state.totalElapsedSeconds,
      completedStepIds: state.completedStepIds
    })
  }, [onFinish, state.completedStepIds, state.status, state.totalElapsedSeconds, workout.steps.length])

  const handlePause = useCallback(() => dispatch({ type: 'PAUSE' }), [])
  const handleResume = useCallback(() => dispatch({ type: 'RESUME' }), [])
  const handleCompleteStep = useCallback(() => dispatch({ type: 'COMPLETE_STEP' }), [])
  const handlePrevious = useCallback(() => dispatch({ type: 'PREVIOUS' }), [])
  const handleSkip = useCallback(() => dispatch({ type: 'SKIP' }), [])
  const handleFinish = useCallback(() => {
    dispatch({ type: 'FINISH' })
  }, [])

  if (state.status === 'completed' || !step) {
    return (
      <section className='strength-player strength-player--complete'>
        <p className='strength-player__eyebrow'>Session saved locally</p>
        <h1>Workout complete</h1>
        <p>You finished {state.completedStepIds.length} of {workout.steps.length} steps.</p>
      </section>
    )
  }

  const remaining = getStepRemaining(state)
  const isManualStep = step.completion.type === 'repetitions'

  return (
    <section className='strength-player'>
      <header className='strength-player__header'>
        <p className='strength-player__eyebrow'>{workout.title}</p>
        <StepProgress current={state.currentStepIndex + 1} total={workout.steps.length} />
      </header>

      <main className='strength-player__content'>
        <p className='strength-player__kind'>{step.kind === 'rest' ? 'Recover' : 'Current exercise'}</p>
        <h1>{step.title}</h1>
        <p className='strength-player__metric'>
          {isManualStep ? `${remaining} reps` : formatCountdown(remaining)}
        </p>
        <p className='strength-player__instruction'>{exercise?.instruction ?? step.instruction}</p>
        {exercise && (
          <aside className='easier-option'>
            <span>Easier option</span>
            <p>{exercise.easierVariation}</p>
          </aside>
        )}
      </main>

      <WorkoutControls
        canGoBack={state.currentStepIndex > 0}
        isManualStep={isManualStep}
        isPaused={state.status === 'paused'}
        onCompleteStep={handleCompleteStep}
        onFinish={handleFinish}
        onPause={handlePause}
        onPrevious={handlePrevious}
        onResume={handleResume}
        onSkip={handleSkip}
      />
    </section>
  )
}

function formatCountdown (seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}
