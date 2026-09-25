import type { Intensity, WorkoutStep, WorkoutTemplate } from '../../domain/models'

interface TimedBlock {
  title: string
  seconds: number
  intensity: Intensity
  instruction: string
  cue: string
}

interface RepeatBlock extends TimedBlock {
  recoverySeconds: number
}

function runStep (
  id: string,
  title: string,
  seconds: number,
  intensity: Intensity,
  instruction: string,
  cue: string
): WorkoutStep {
  return {
    id,
    kind: 'run',
    title,
    instruction,
    cue,
    intensity,
    completion: { type: 'time', seconds }
  }
}

function estimateTimedMinutes (steps: WorkoutStep[]) {
  const seconds = steps.reduce((total, step) => {
    return step.completion.type === 'time' ? total + step.completion.seconds : total
  }, 0)

  return Math.max(1, Math.round(seconds / 60))
}

export function createEasyRun (id: string, title: string, totalMinutes: number): WorkoutTemplate {
  const steps = [
    runStep(`${id}-warm-up`, 'Warm-up walk and jog', 300, 'recovery', 'Begin gently and let your stride loosen.', 'Five-minute warm-up. Keep it very easy.'),
    runStep(`${id}-easy`, 'Easy running', (totalMinutes - 10) * 60, 'easy', 'Run at a relaxed conversational effort.', 'Easy running. Conversation pace.'),
    runStep(`${id}-cool-down`, 'Cool-down', 300, 'recovery', 'Slow to an easy jog or walk and let your breathing settle.', 'Five-minute cool-down. Ease right back.')
  ]

  return {
    id,
    version: 1,
    kind: 'run',
    title,
    description: 'Relaxed aerobic running with a gentle warm-up and cool-down.',
    estimatedMinutes: estimateTimedMinutes(steps),
    steps
  }
}

export function createLongRun (
  id: string,
  title: string,
  totalMinutes: number,
  steadyMinutes = 0
): WorkoutTemplate {
  const easySeconds = (totalMinutes - 10 - steadyMinutes) * 60
  const steps: WorkoutStep[] = [
    runStep(`${id}-warm-up`, 'Warm-up walk and jog', 300, 'recovery', 'Start slower than feels necessary.', 'Five-minute warm-up. Settle in gently.')
  ]

  if (steadyMinutes === 0) {
    steps.push(runStep(`${id}-easy`, 'Long easy running', easySeconds, 'easy', 'Stay relaxed and keep enough in reserve to finish comfortably.', 'Long easy running. Stay conversational.'))
  } else {
    const easyBeforeSeconds = Math.round(easySeconds * 0.6)
    steps.push(
      runStep(`${id}-easy-before`, 'Easy running', easyBeforeSeconds, 'easy', 'Stay relaxed and prepare for the controlled section.', 'Easy running. Keep plenty in reserve.'),
      runStep(`${id}-steady`, 'Controlled steady running', steadyMinutes * 60, 'steady', 'Lift to a purposeful rhythm without straining.', 'Steady section. Controlled and smooth.'),
      runStep(`${id}-easy-after`, 'Easy running', easySeconds - easyBeforeSeconds, 'easy', 'Return to an easy rhythm and let your breathing settle.', 'Back to easy running.')
    )
  }

  steps.push(runStep(`${id}-cool-down`, 'Cool-down', 300, 'recovery', 'Finish with an easy jog or walk.', 'Five-minute cool-down.'))

  return {
    id,
    version: 1,
    kind: 'run',
    title,
    description: steadyMinutes > 0
      ? 'Easy endurance running with a controlled steady section.'
      : 'Comfortable endurance running with no pace pressure.',
    estimatedMinutes: estimateTimedMinutes(steps),
    steps
  }
}

export function createRepeatedRun (
  id: string,
  title: string,
  repeatCount: number,
  work: RepeatBlock,
  description: string
): WorkoutTemplate {
  const steps: WorkoutStep[] = [
    runStep(`${id}-warm-up`, 'Warm-up jog', 600, 'recovery', 'Jog gently, then add a few relaxed leg swings if useful.', 'Ten-minute easy warm-up.')
  ]

  for (let repeat = 1; repeat <= repeatCount; repeat += 1) {
    steps.push(runStep(
      `${id}-work-${repeat}`,
      `${work.title} ${repeat} of ${repeatCount}`,
      work.seconds,
      work.intensity,
      work.instruction,
      repeat === 1 ? work.cue : `${work.title} ${repeat} of ${repeatCount}.`
    ))
    steps.push(runStep(
      `${id}-recovery-${repeat}`,
      `Easy recovery ${repeat} of ${repeatCount}`,
      work.recoverySeconds,
      'recovery',
      'Jog very easily or walk until your breathing comes under control.',
      'Recovery. Jog very easily.'
    ))
  }

  steps.push(runStep(`${id}-cool-down`, 'Cool-down', 300, 'recovery', 'Jog or walk easily and let your breathing settle.', 'Five-minute cool-down.'))

  return {
    id,
    version: 1,
    kind: 'run',
    title,
    description,
    estimatedMinutes: estimateTimedMinutes(steps),
    steps
  }
}

export function createTempoRun (
  id: string,
  title: string,
  blocks: TimedBlock[],
  recoverySeconds: number,
  description: string
): WorkoutTemplate {
  const steps: WorkoutStep[] = [
    runStep(`${id}-warm-up`, 'Warm-up jog', 600, 'recovery', 'Jog gently and prepare to run with control.', 'Ten-minute easy warm-up.')
  ]

  blocks.forEach((block, index) => {
    steps.push(runStep(
      `${id}-tempo-${index + 1}`,
      block.title,
      block.seconds,
      block.intensity,
      block.instruction,
      block.cue
    ))
    if (index < blocks.length - 1 && recoverySeconds > 0) {
      steps.push(runStep(
        `${id}-recovery-${index + 1}`,
        'Easy recovery',
        recoverySeconds,
        'recovery',
        'Jog very easily and prepare for the next controlled block.',
        'Easy recovery.'
      ))
    }
  })

  steps.push(runStep(`${id}-cool-down`, 'Cool-down', 300, 'recovery', 'Jog or walk easily until your breathing settles.', 'Five-minute cool-down.'))

  return {
    id,
    version: 1,
    kind: 'run',
    title,
    description,
    estimatedMinutes: estimateTimedMinutes(steps),
    steps
  }
}

export function createStrideRun (id: string, title: string, totalMinutes: number): WorkoutTemplate {
  const strideSeconds = 20
  const recoverySeconds = 60
  const repetitions = 4
  const fixedSeconds = 600 + repetitions * (strideSeconds + recoverySeconds)
  const easySeconds = Math.max(300, totalMinutes * 60 - fixedSeconds)
  const steps: WorkoutStep[] = [
    runStep(`${id}-warm-up`, 'Warm-up walk and jog', 300, 'recovery', 'Begin gently and loosen your stride.', 'Five-minute easy warm-up.'),
    runStep(`${id}-easy`, 'Short easy run', easySeconds, 'easy', 'Run at a relaxed conversational effort.', 'Easy running. Stay relaxed.')
  ]

  for (let repeat = 1; repeat <= repetitions; repeat += 1) {
    steps.push(
      runStep(`${id}-stride-${repeat}`, `Stride ${repeat} of ${repetitions}`, strideSeconds, 'stride', 'Accelerate smoothly with quick relaxed steps. Do not sprint.', `Stride ${repeat} of ${repetitions}. Smooth and relaxed.`),
      runStep(`${id}-recovery-${repeat}`, `Walk or jog ${repeat} of ${repetitions}`, recoverySeconds, 'recovery', 'Walk or jog until fully ready for the next stride.', 'Easy recovery.')
    )
  }

  steps.push(runStep(`${id}-cool-down`, 'Cool-down', 300, 'recovery', 'Finish with a very easy jog or walk.', 'Five-minute cool-down.'))

  return {
    id,
    version: 1,
    kind: 'run',
    title,
    description: 'A short easy run followed by four smooth, relaxed strides.',
    estimatedMinutes: estimateTimedMinutes(steps),
    steps
  }
}

export function createBenchmarkRun (
  id: string,
  title: string,
  metres: 5000 | 10000,
  estimatedMinutes: number,
  intensity: 'five-k' | 'steady'
): WorkoutTemplate {
  const distanceLabel = metres === 5000 ? '5K' : '10K'
  const steps: WorkoutStep[] = [
    runStep(`${id}-warm-up`, 'Warm-up jog', 600, 'recovery', 'Jog gently and add two short relaxed pickups when ready.', 'Ten-minute easy warm-up.'),
    {
      id: `${id}-benchmark`,
      kind: 'run',
      title: `${distanceLabel} benchmark`,
      instruction: metres === 5000
        ? 'Start controlled, settle through the middle, and only press harder if you still feel composed.'
        : 'Keep the first half patient, hold a sustainable rhythm, and aim to finish feeling strong.',
      cue: `${distanceLabel} begins. Start controlled and run by effort.`,
      intensity,
      completion: { type: 'distance', metres }
    },
    runStep(`${id}-cool-down`, 'Cool-down', 300, 'recovery', 'Walk or jog easily and let your breathing settle.', 'Five-minute cool-down. Well done.')
  ]

  return {
    id,
    version: 1,
    kind: 'run',
    title,
    description: `${distanceLabel} completion run. This is a checkpoint, not a promise or pass-fail test.`,
    estimatedMinutes,
    steps
  }
}

interface StrengthExercise {
  exerciseId: string
  title: string
  count?: number
  seconds?: number
  side?: 'both' | 'left' | 'right'
}

export function createStrengthWorkout (
  id: string,
  title: string,
  exercises: StrengthExercise[],
  rounds: number,
  restSeconds: number,
  estimatedMinutes: number
): WorkoutTemplate {
  const steps: WorkoutStep[] = []

  for (let round = 1; round <= rounds; round += 1) {
    exercises.forEach((exercise, index) => {
      steps.push({
        id: `${id}-round-${round}-exercise-${index + 1}`,
        kind: 'exercise',
        exerciseId: exercise.exerciseId,
        title: `${exercise.title} · round ${round}`,
        instruction: 'Move with control. Stop if you feel sharp or worsening pain.',
        cue: `${exercise.title}. Round ${round}.`,
        side: exercise.side ?? 'both',
        completion: exercise.count
          ? { type: 'repetitions', count: exercise.count }
          : { type: 'time', seconds: exercise.seconds ?? 30 }
      })
      steps.push({
        id: `${id}-round-${round}-rest-${index + 1}`,
        kind: 'rest',
        title: 'Reset',
        instruction: 'Breathe, reset your position, and prepare for the next movement.',
        cue: 'Rest and reset.',
        completion: { type: 'time', seconds: restSeconds }
      })
    })
  }

  return {
    id,
    version: 1,
    kind: 'strength',
    title,
    description: 'Runner-focused strength using bodyweight and optional simple equipment.',
    estimatedMinutes,
    steps
  }
}
