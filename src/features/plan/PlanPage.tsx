import { useCallback, useMemo, useState, type ChangeEvent } from 'react'
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
  const { enrollment, schedule, skipWorkout, restartPlan, today } = useTraining()
  const navigate = useNavigate()
  const currentEntry = schedule.find(entry => entry.status === 'scheduled')
  const initialWeek = currentEntry?.weekNumber ?? 1
  const [expandedWeek, setExpandedWeek] = useState(initialWeek)
  const [isConfirmingRestart, setIsConfirmingRestart] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [restartDate, setRestartDate] = useState(today)
  const [restartError, setRestartError] = useState<string | null>(null)
  const [restartMessage, setRestartMessage] = useState<string | null>(null)
  const phases = useMemo(() => Object.entries(phaseLabels), [])
  const handleWeekClick = useCallback((weekNumber: number) => {
    setExpandedWeek(current => current === weekNumber ? 0 : weekNumber)
  }, [])
  const handleStartWorkout = useCallback((scheduledWorkoutId: string) => {
    navigate(`/workout/${scheduledWorkoutId}`)
  }, [navigate])
  const handleAskRestart = useCallback(() => {
    setRestartDate(today)
    setRestartError(null)
    setRestartMessage(null)
    setIsConfirmingRestart(true)
  }, [today])
  const handleCancelRestart = useCallback(() => {
    setIsConfirmingRestart(false)
    setRestartError(null)
  }, [])
  const handleRestartDateChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setRestartDate(event.target.value)
    setRestartError(null)
  }, [])
  const handleConfirmRestart = useCallback(async () => {
    setIsRestarting(true)
    setRestartError(null)
    try {
      const firstWeekDate = await restartPlan(restartDate)
      setExpandedWeek(1)
      setIsConfirmingRestart(false)
      setRestartMessage(`Plan restarted. Week 1 begins ${formatPlanDate(firstWeekDate)}.`)
    } catch (error) {
      setRestartError(error instanceof Error ? error.message : 'Could not restart the plan. Try again.')
    } finally {
      setIsRestarting(false)
    }
  }, [restartDate, restartPlan])

  return (
    <section className='page-surface plan-page'>
      <header className='feature-header'>
        <div><p className='page-kicker'>Your path</p><h1>Plan</h1></div>
        <span>17 weeks</span>
      </header>
      <p className='plan-rhythm'>Four runs each week: two easy runs, a focused workout, and a Saturday long run. The harder sessions change across weeks; easy days build endurance and help you absorb the faster work.</p>
      {!enrollment && <p className='status-message'>Previewing the full plan. Start it from Today when you are ready.</p>}
      {enrollment && (
        <section aria-label='Restart plan' className='plan-restart'>
          {!isConfirmingRestart && <button className='plan-restart__open' onClick={handleAskRestart} type='button'>Restart from Week 1</button>}
          {isConfirmingRestart && (
            <div className='plan-restart__confirmation'>
              <h2>Start fresh from Week 1?</h2>
              <p>Your current calendar and missed or completed marks will be replaced. Your saved run history stays in History.</p>
              <label className='settings-field'>
                New start date
                <input min={today} onChange={handleRestartDateChange} type='date' value={restartDate} />
              </label>
              <p className='plan-restart__hint'>Start any day. A mid-week start has a lighter opening week; earlier days are not marked missed. Saturday stays the long run and Sunday stays rest.</p>
              {restartError && <p className='plan-restart__error' role='alert'>{restartError}</p>}
              <div className='button-pair'>
                <button disabled={isRestarting} onClick={handleCancelRestart} type='button'>Cancel restart</button>
                <button className='plan-restart__confirm' disabled={isRestarting || !restartDate} onClick={handleConfirmRestart} type='button'>{isRestarting ? 'Restarting…' : 'Confirm restart'}</button>
              </div>
            </div>
          )}
          {restartMessage && <p className='plan-restart__success' role='status'>{restartMessage}</p>}
        </section>
      )}
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
            const scheduled = weekSchedule.find(entry => {
              return new Date(`${entry.date}T12:00:00Z`).getUTCDay() === (dayIndex + 1) % 7
            })
            if (schedule.length > 0 && !scheduled) return null
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
                    startAriaLabel={`Start ${workout.title} on ${capitalize(day)}`}
                    startLabel='Start'
                    workoutTitle={`${workout.title} on ${capitalize(day)}`}
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
