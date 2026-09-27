import { useCallback, useState } from 'react'

interface ScheduledWorkoutActionsProps {
  workoutTitle: string
  startLabel: string
  startAriaLabel: string
  onStart: () => void
  onSkip: () => Promise<void>
}

export function ScheduledWorkoutActions ({
  workoutTitle,
  startLabel,
  startAriaLabel,
  onStart,
  onSkip
}: ScheduledWorkoutActionsProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const handleAskSkip = useCallback(() => setIsConfirming(true), [])
  const handleCancelSkip = useCallback(() => setIsConfirming(false), [])
  const handleConfirmSkip = useCallback(async () => {
    setIsSkipping(true)
    setError(null)
    try {
      await onSkip()
      setIsConfirming(false)
    } catch {
      setError('This workout could not be skipped. Try again.')
    } finally {
      setIsSkipping(false)
    }
  }, [onSkip])

  return (
    <div className='scheduled-actions'>
      <button aria-label={startAriaLabel} className='scheduled-actions__start' onClick={onStart} type='button'>
        {startLabel}
      </button>
      {!isConfirming && (
        <button aria-label={`Skip ${workoutTitle}`} className='scheduled-actions__skip' onClick={handleAskSkip} type='button'>
          Skip
        </button>
      )}
      {isConfirming && (
        <div className='scheduled-actions__confirmation' role='alert'>
          <span>Mark this workout as skipped?</span>
          <button aria-label={`Confirm skip ${workoutTitle}`} disabled={isSkipping} onClick={handleConfirmSkip} type='button'>
            {isSkipping ? 'Skipping…' : 'Confirm skip'}
          </button>
          <button disabled={isSkipping} onClick={handleCancelSkip} type='button'>Cancel</button>
        </div>
      )}
      {error && <p className='status-message status-message--error'>{error}</p>}
    </div>
  )
}
