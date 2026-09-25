import type { WorkoutStep, WorkoutTemplate } from './models'

export type WorkoutStatus = 'ready' | 'active' | 'paused' | 'completed'

export type WorkoutEngineOutput =
  | { type: 'STEP_COMPLETED', stepIndex: number }
  | { type: 'STEP_CHANGED', stepIndex: number }
  | { type: 'WORKOUT_COMPLETED' }

export type WorkoutEvent =
  | { type: 'START' }
  | { type: 'TICK', elapsedSeconds: number }
  | { type: 'DISTANCE', metres: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'COMPLETE_STEP' }
  | { type: 'SKIP' }
  | { type: 'PREVIOUS' }
  | { type: 'FINISH' }

export interface WorkoutState {
  workout: WorkoutTemplate
  status: WorkoutStatus
  currentStepIndex: number
  stepElapsedSeconds: number
  totalElapsedSeconds: number
  stepDistanceMetres: number
  totalDistanceMetres: number
  completedStepIds: string[]
  events: WorkoutEngineOutput[]
}

export function createWorkoutState (workout: WorkoutTemplate): WorkoutState {
  return {
    workout,
    status: 'ready',
    currentStepIndex: 0,
    stepElapsedSeconds: 0,
    totalElapsedSeconds: 0,
    stepDistanceMetres: 0,
    totalDistanceMetres: 0,
    completedStepIds: [],
    events: []
  }
}

export function getCurrentStep (state: WorkoutState): WorkoutStep | undefined {
  return state.workout.steps[state.currentStepIndex]
}

export function getStepRemaining (state: WorkoutState) {
  const step = getCurrentStep(state)
  if (!step) return 0

  if (step.completion.type === 'time') {
    return Math.max(0, Math.ceil(step.completion.seconds - state.stepElapsedSeconds))
  }
  if (step.completion.type === 'distance') {
    return Math.max(0, Math.ceil(step.completion.metres - state.stepDistanceMetres))
  }
  return step.completion.count
}

export function reduceWorkout (state: WorkoutState, event: WorkoutEvent): WorkoutState {
  if (state.status === 'completed') return state

  const current = { ...state, events: [] }

  if (event.type === 'START') {
    return current.status === 'ready' ? { ...current, status: 'active' } : current
  }
  if (event.type === 'PAUSE') {
    return current.status === 'active' ? { ...current, status: 'paused' } : current
  }
  if (event.type === 'RESUME') {
    return current.status === 'paused' ? { ...current, status: 'active' } : current
  }
  if (event.type === 'FINISH') {
    return { ...current, status: 'completed', events: [{ type: 'WORKOUT_COMPLETED' }] }
  }
  if (event.type === 'PREVIOUS') return moveToPreviousStep(current)
  if (event.type === 'SKIP') return advanceStep(current, false)
  if (event.type === 'COMPLETE_STEP') return advanceStep(current, true)
  if (current.status !== 'active') return current

  if (event.type === 'TICK') return applyElapsedTime(current, event.elapsedSeconds)
  if (event.type === 'DISTANCE') return applyDistance(current, event.metres)

  return current
}

function applyElapsedTime (state: WorkoutState, elapsedSeconds: number): WorkoutState {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return state

  let next = {
    ...state,
    totalElapsedSeconds: state.totalElapsedSeconds + elapsedSeconds
  }
  let unconsumedSeconds = elapsedSeconds

  while (unconsumedSeconds > 0 && next.status === 'active') {
    const step = getCurrentStep(next)
    if (!step || step.completion.type !== 'time') {
      return { ...next, stepElapsedSeconds: next.stepElapsedSeconds + unconsumedSeconds }
    }

    const remainingSeconds = Math.max(0, step.completion.seconds - next.stepElapsedSeconds)
    const consumedSeconds = Math.min(unconsumedSeconds, remainingSeconds)
    next = { ...next, stepElapsedSeconds: next.stepElapsedSeconds + consumedSeconds }
    unconsumedSeconds -= consumedSeconds

    if (next.stepElapsedSeconds >= step.completion.seconds) {
      next = advanceStep(next, true)
    } else {
      break
    }
  }

  return next
}

function applyDistance (state: WorkoutState, metres: number): WorkoutState {
  if (!Number.isFinite(metres) || metres <= 0) return state

  const withDistance = {
    ...state,
    stepDistanceMetres: state.stepDistanceMetres + metres,
    totalDistanceMetres: state.totalDistanceMetres + metres
  }
  const step = getCurrentStep(withDistance)

  if (step?.completion.type === 'distance' && withDistance.stepDistanceMetres >= step.completion.metres) {
    return advanceStep(withDistance, true)
  }

  return withDistance
}

function advanceStep (state: WorkoutState, isCompleted: boolean): WorkoutState {
  const step = getCurrentStep(state)
  if (!step) return state

  const nextIndex = state.currentStepIndex + 1
  const completionEvents: WorkoutEngineOutput[] = isCompleted
    ? [{ type: 'STEP_COMPLETED', stepIndex: state.currentStepIndex }]
    : []
  const completedStepIds = isCompleted && !state.completedStepIds.includes(step.id)
    ? [...state.completedStepIds, step.id]
    : state.completedStepIds

  if (nextIndex >= state.workout.steps.length) {
    return {
      ...state,
      status: 'completed',
      completedStepIds,
      events: [...completionEvents, { type: 'WORKOUT_COMPLETED' }]
    }
  }

  return {
    ...state,
    currentStepIndex: nextIndex,
    stepElapsedSeconds: 0,
    stepDistanceMetres: 0,
    completedStepIds,
    events: [...completionEvents, { type: 'STEP_CHANGED', stepIndex: nextIndex }]
  }
}

function moveToPreviousStep (state: WorkoutState): WorkoutState {
  if (state.currentStepIndex === 0) return state

  const previousIndex = state.currentStepIndex - 1
  const previousStep = state.workout.steps[previousIndex]

  return {
    ...state,
    currentStepIndex: previousIndex,
    stepElapsedSeconds: 0,
    stepDistanceMetres: 0,
    completedStepIds: state.completedStepIds.filter(id => id !== previousStep.id),
    events: [{ type: 'STEP_CHANGED', stepIndex: previousIndex }]
  }
}
