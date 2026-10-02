import { memo } from 'react'

interface WorkoutControlsProps {
  isPaused: boolean
  isManualStep: boolean
  canGoBack: boolean
  onPause: () => void
  onResume: () => void
  onCompleteStep: () => void
  onPrevious: () => void
  onSkip: () => void
  onFinish: () => void
}

export const WorkoutControls = memo(function WorkoutControls ({
  isPaused,
  isManualStep,
  canGoBack,
  onPause,
  onResume,
  onCompleteStep,
  onPrevious,
  onSkip,
  onFinish
}: WorkoutControlsProps) {
  return (
    <div aria-label='Strength controls' className='workout-controls' role='group'>
      {isManualStep && (
        <button className='workout-controls__primary' onClick={onCompleteStep} type='button'>
          Complete set
        </button>
      )}
      <button
        className={isManualStep ? 'workout-controls__secondary' : 'workout-controls__primary'}
        onClick={isPaused ? onResume : onPause}
        type='button'
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      <div className='workout-controls__minor'>
        <button disabled={!canGoBack} onClick={onPrevious} type='button'>Previous</button>
        <button onClick={onSkip} type='button'>Skip</button>
        <button onClick={onFinish} type='button'>Finish</button>
      </div>
    </div>
  )
})
