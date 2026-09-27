import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTraining } from '../../app/TrainingContext'
import { ScheduledWorkoutActions } from '../../components/ScheduledWorkoutActions'
import { workoutCatalog } from '../../data/plans/catalog'
import { getOverdueWorkouts } from '../../domain/schedule'

export function TodayPage () {
  const { enrollment, schedule, startPlan, skipWorkout, today, isLoading, error } = useTraining()
  const navigate = useNavigate()
  const [isStarting, setIsStarting] = useState(false)
  const todayEntry = useMemo(() => schedule.find(entry => entry.date === today), [schedule, today])
  const nextEntry = useMemo(() => schedule.find(entry => entry.date >= today && entry.workoutId), [schedule, today])
  const displayedEntry = todayEntry ?? nextEntry
  const workout = displayedEntry?.workoutId ? workoutCatalog[displayedEntry.workoutId] : undefined
  const weeklySessions = displayedEntry
    ? schedule.filter(entry => entry.weekNumber === displayedEntry.weekNumber && entry.workoutId)
    : []
  const completedSessions = weeklySessions.filter(entry => entry.status === 'completed').length
  const overdueEntries = useMemo(() => getOverdueWorkouts(schedule, today), [schedule, today])

  const handleStartPlan = useCallback(async () => {
    setIsStarting(true)
    try {
      await startPlan()
      navigate('/setup-complete')
    } finally {
      setIsStarting(false)
    }
  }, [navigate, startPlan])

  const handleStartWorkout = useCallback(() => {
    if (displayedEntry) navigate(`/workout/${displayedEntry.id}`)
  }, [displayedEntry, navigate])

  return (
    <section className='today-page'>
      <header className='page-header'>
        <p className='date-line'>{formatDisplayDate(today)}</p>
        <h1>Today</h1>
      </header>
      <div className='pace-rail' aria-hidden='true'>
        <span className='pace-rail__marker pace-rail__marker--active' />
        <span className='pace-rail__line' />
        <span className='pace-rail__marker' />
      </div>
      <div className='today-content'>
        {isLoading && <p className='session-state' role='status'>Opening your plan…</p>}
        {error && <p className='status-message status-message--error'>{error}</p>}
        {!isLoading && !enrollment && (
          <>
            <p className='session-state'>Your training starts here</p>
            <h2>Build back to your fastest 5K</h2>
            <p className='session-summary'>Four runs and two strength sessions each week, guided one step at a time.</p>
            <button className='primary-action' disabled={isStarting} onClick={handleStartPlan} type='button'>
              {isStarting ? 'Building your plan…' : 'Start plan'}
            </button>
          </>
        )}
        {!isLoading && enrollment && workout && displayedEntry && (
          <>
            <p className='session-state'>Week {displayedEntry.weekNumber} · {formatSessionDay(displayedEntry.date, today)}</p>
            <h2>{workout.title}</h2>
            <p className='session-summary'>{workout.description}</p>
            <dl className='session-facts'>
              <div><dt>Time</dt><dd>{workout.estimatedMinutes} min</dd></div>
              <div><dt>This week</dt><dd>{completedSessions}/{weeklySessions.length}</dd></div>
            </dl>
            {displayedEntry.status === 'scheduled' && (
              <button className='primary-action' onClick={handleStartWorkout} type='button'>Start workout</button>
            )}
            {displayedEntry.status === 'completed' && <p className='session-outcome'>Completed</p>}
            {displayedEntry.status === 'skipped' && <p className='session-outcome'>Skipped</p>}
          </>
        )}
        {!isLoading && enrollment && !workout && (
          <>
            <p className='session-state'>Full rest</p>
            <h2>Recover today</h2>
            <p className='session-summary'>Keep the day easy. Your next session is already waiting in the plan.</p>
          </>
        )}
        {!isLoading && enrollment && overdueEntries.length > 0 && (
          <section className='catch-up'>
            <header><p className='page-kicker'>Missed sessions</p><h2>Catch up</h2></header>
            <ol>
              {overdueEntries.map(entry => {
                const overdueWorkout = entry.workoutId ? workoutCatalog[entry.workoutId] : undefined
                if (!overdueWorkout) return null
                return (
                  <li key={entry.id}>
                    <div>
                      <time dateTime={entry.date}>{formatShortDate(entry.date)}</time>
                      <h3>{overdueWorkout.title}</h3>
                    </div>
                    <ScheduledWorkoutActions
                      onSkip={() => skipWorkout(entry.id)}
                      onStart={() => navigate(`/workout/${entry.id}`)}
                      startAriaLabel={`Do ${overdueWorkout.title} today`}
                      startLabel='Do today'
                      workoutTitle={overdueWorkout.title}
                    />
                  </li>
                )
              })}
            </ol>
          </section>
        )}
      </div>
    </section>
  )
}

function formatShortDate (value: string) {
  return new Intl.DateTimeFormat('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(new Date(`${value}T12:00:00Z`))
}

function formatDisplayDate (value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).format(new Date(`${value}T12:00:00Z`))
}

function formatSessionDay (entryDate: string, today: string) {
  if (entryDate === today) return 'Today'
  return new Intl.DateTimeFormat('en-NG', { weekday: 'long' }).format(new Date(`${entryDate}T12:00:00Z`))
}
