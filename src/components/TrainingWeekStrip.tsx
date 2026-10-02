import { memo } from 'react'
import type { ScheduledWorkout } from '../domain/models'

interface TrainingWeekStripProps {
  entries: ScheduledWorkout[]
  today: string
}

export const TrainingWeekStrip = memo(function TrainingWeekStrip ({ entries, today }: TrainingWeekStripProps) {
  return (
    <ol aria-label='Training week' className='training-week'>
      {entries.map(entry => {
        const state = getEntryState(entry)
        return (
          <li
            aria-current={entry.date === today ? 'date' : undefined}
            aria-label={`${formatWeekday(entry.date, 'long')}, ${state.label}`}
            className={`training-week__day training-week__day--${state.className}`}
            key={entry.id}
          >
            <time dateTime={entry.date}>{formatWeekday(entry.date, 'narrow')}</time>
            <span aria-hidden='true' className='training-week__marker' />
            <span className='visually-hidden'>{state.label}</span>
          </li>
        )
      })}
    </ol>
  )
})

function getEntryState (entry: ScheduledWorkout) {
  if (!entry.workoutId) return { className: 'rest', label: 'Rest day' }
  if (entry.status === 'completed') return { className: 'completed', label: 'Completed' }
  if (entry.status === 'skipped') return { className: 'skipped', label: 'Skipped' }
  return { className: 'scheduled', label: 'Scheduled' }
}

function formatWeekday (value: string, format: 'long' | 'narrow') {
  return new Intl.DateTimeFormat('en-NG', { weekday: format })
    .format(new Date(`${value}T12:00:00Z`))
}
