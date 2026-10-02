import { memo } from 'react'

interface StepProgressProps {
  current: number
  total: number
}

export const StepProgress = memo(function StepProgress ({ current, total }: StepProgressProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className='step-progress'>
      <div className='step-progress__label'>
        <span>Step {current} of {total}</span>
        <span>{percentage}%</span>
      </div>
      <div
        aria-label='Workout progress'
        aria-valuemax={total}
        aria-valuemin={1}
        aria-valuenow={current}
        aria-valuetext={`Step ${current} of ${total}`}
        className='step-progress__track'
        role='progressbar'
      >
        <span className='step-progress__fill' style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
})
