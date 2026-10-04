import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTraining } from '../../app/TrainingContext'
import { ScheduledWorkoutActions } from '../../components/ScheduledWorkoutActions'
import { trainingCatalog, workoutCatalog } from '../../data/plans/catalog'
import type { PlanWeek, ScheduledWorkout } from '../../domain/models'

const phaseLabels = {
  'faster-5k': 'Faster 5K',
  transition: 'Transition',
  'build-to-10k': 'Build to 10K'
} as const

export function PlanPage () {
  const { enrollment, schedule, skipWorkout } = useTraining()
  const navigate = useNavigate()
  const currentEntry = schedule.find(entry => entry.status === 'scheduled')
  const initialWeek = currentEntry?.weekNumber ?? 1
  const [expandedWeek, setExpandedWeek] = useState(initialWeek)
  const phases = useMemo(() => Object.entries(phaseLabels), [])
  const handleWeekClick = useCallback((weekNumber: number) => {
    setExpandedWeek(current => current === weekNumber ? 0 : weekNumber)
  }, [])
  const handleStartWorkout = useCallback((scheduledWorkoutId: string) => {
    navigate(`/workout/${scheduledWorkoutId}`)
  }, [navigate])

  return (
    <section className='page-surface plan-page'>
      <header className='feature-header'>
        <div><p className='page-kicker'>Your path</p><h1>Plan</h1></div>
        <span>17 weeks</span>
      </header>
      <p className='plan-rhythm'>Four runs each week: an aerobic reset, one focused workout, a short support run, and Saturday endurance. Easy days build endurance and help you absorb the faster work.</p>
      {!enrollment && <p className='status-message'>Previewing the full plan. Start it from Today when you are ready.</p>}
      {phases.map(([phase, label]) => {
        const weeks = trainingCatalog.weeks.filter(week => week.phase === phase)
        return (
          <section className='plan-phase' key={phase}>
            <h2>{label}</h2>
            {weeks.map(week => (
              <PlanWeekRow
                isExpanded={week.number === expandedWeek}
                key={week.number}
                onSkip={skipWorkout}
                onStart={handleStartWorkout}
                onToggle={handleWeekClick}
                schedule={schedule}
                week={week}
              />
            ))}
          </section>
        )
      })}
    </section>
  )
}

interface PlanWeekRowProps {
  week: PlanWeek
  isExpanded: boolean
  onToggle: (weekNumber: number) => void
  onStart: (scheduledWorkoutId: string) => void
  onSkip: (scheduledWorkoutId: string) => Promise<void>
  schedule: ScheduledWorkout[]
}

function PlanWeekRow ({ week, isExpanded, onToggle, onStart, onSkip, schedule }: PlanWeekRowProps) {
  const handleToggle = useCallback(() => onToggle(week.number), [onToggle, week.number])
  const weekSchedule = schedule.filter(entry => entry.weekNumber === week.number)
  const sessionListId = `week-${week.number}-sessions`

  return (
    <article className={isExpanded ? 'plan-week plan-week--open' : 'plan-week'}>
      <span aria-hidden='true' className='plan-week__marker' />
      <button
        aria-controls={sessionListId}
        aria-expanded={isExpanded}
        onClick={handleToggle}
        type='button'
      >
        <span className='plan-week__number'>Week {week.number}</span>
        <strong>{week.title}</strong>
        <span aria-hidden='true' className='plan-week__toggle'>{isExpanded ? '−' : '+'}</span>
      </button>
      {isExpanded && (
        <ol aria-label={`Week ${week.number} sessions`} className='week-sessions' id={sessionListId}>
          {Object.entries(week.schedule).map(([day, workoutId], dayIndex) => {
            const scheduled = weekSchedule[dayIndex]
            const currentWorkoutId = scheduled ? scheduled.workoutId : workoutId
            const workout = currentWorkoutId ? workoutCatalog[currentWorkoutId] : undefined
            const status = workout ? scheduled?.status ?? 'scheduled' : 'rest'
            return (
              <li className={`week-session week-session--${status}`} key={day}>
                <span aria-hidden='true' className='week-session__marker' />
                <div className='week-session__summary'>
                  <span>{capitalize(day)}{scheduled ? ` · ${formatPlanDate(scheduled.date)}` : ''}</span>
                  <strong>{workout?.title ?? 'Full rest'}</strong>
                  {workout && <p>{workout.description}</p>}
                  {workout && <small>{workout.estimatedMinutes} min</small>}
                </div>
                {scheduled?.status === 'scheduled' && workout && (
                  <ScheduledWorkoutActions
                    onSkip={() => onSkip(scheduled.id)}
                    onStart={() => onStart(scheduled.id)}
                    startAriaLabel={`Start ${workout.title}`}
                    startLabel='Start'
                    workoutTitle={workout.title}
                  />
                )}
                {scheduled?.status === 'completed' && <span className='session-status'>Completed</span>}
                {scheduled?.status === 'skipped' && <span className='session-status'>Skipped</span>}
              </li>
            )
          })}
        </ol>
      )}
    </article>
  )
}

function formatPlanDate (value: string) {
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short' })
    .format(new Date(`${value}T12:00:00Z`))
}

function capitalize (value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
