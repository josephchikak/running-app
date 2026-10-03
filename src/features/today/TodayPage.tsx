import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTraining } from '../../app/TrainingContext'
import { ScheduledWorkoutActions } from '../../components/ScheduledWorkoutActions'
import { TrainingWeekStrip } from '../../components/TrainingWeekStrip'
import { workoutCatalog } from '../../data/plans/catalog'
import { getOverdueWorkouts } from '../../domain/schedule'
import { summarizeWeek } from '../../domain/training-summary'

export function TodayPage () {
  const { enrollment, schedule, results, startPlan, skipWorkout, today, isLoading, error } = useTraining()
  const navigate = useNavigate()
  const [isStarting, setIsStarting] = useState(false)
  const todayEntry = useMemo(() => schedule.find(entry => entry.date === today), [schedule, today])
  const nextEntry = useMemo(() => schedule.find(entry => entry.date >= today && entry.workoutId), [schedule, today])
  const displayedEntry = todayEntry ?? nextEntry
  const workout = displayedEntry?.workoutId ? workoutCatalog[displayedEntry.workoutId] : undefined
  const weeklySessions = displayedEntry
    ? schedule.filter(entry => entry.weekNumber === displayedEntry.weekNumber && entry.workoutId)
    : []
  const weekSchedule = displayedEntry
    ? schedule.filter(entry => entry.weekNumber === displayedEntry.weekNumber)
    : []
  const completedResultIds = new Set(
    results.filter(result => result.status === 'completed').map(result => result.scheduledWorkoutId)
  )
  const completedSessions = weeklySessions.filter(entry => completedResultIds.has(entry.id)).length
  const displayedSessionNumber = weeklySessions.findIndex(entry => entry.id === displayedEntry?.id) + 1
  const wasStoppedEarly = displayedEntry?.status === 'completed' &&
    results.some(result => result.scheduledWorkoutId === displayedEntry.id && result.status === 'stopped') &&
    !completedResultIds.has(displayedEntry.id)
  const weeklySummary = useMemo(
    () => displayedEntry
      ? summarizeWeek(schedule, results, displayedEntry.weekNumber)
      : { sessions: 0, durationSeconds: 0, distanceMetres: 0 },
    [displayedEntry, results, schedule]
  )
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
      <header className='today-header'>
        <div>
          <p className='date-line'>{formatDisplayDate(today)}</p>
          <h1>Today</h1>
        </div>
        {displayedEntry && <span>Week {displayedEntry.weekNumber} of 17</span>}
      </header>
      <section aria-label="Today's workout" className='today-session'>
        <div aria-hidden='true' className='today-session__accent' />
        {isLoading && <p className='session-state' role='status'>Opening your plan…</p>}
        {error && <p className='status-message status-message--error'>{error}</p>}
        {!isLoading && !enrollment && (
          <>
            <p className='session-state'>Your training starts here</p>
            <h2 id='today-session-title'>Build back to your fastest 5K</h2>
            <p className='session-summary'>Four runs and two strength sessions each week, guided one step at a time.</p>
            <button className='primary-action' disabled={isStarting} onClick={handleStartPlan} type='button'>
              {isStarting ? 'Building your plan…' : 'Start plan'}
            </button>
          </>
        )}
        {!isLoading && enrollment && workout && displayedEntry && (
          <>
            <div className='today-session__meta'>
              <p className='session-state'>{formatSessionDay(displayedEntry.date, today)}</p>
              <span>{completedSessions}/{weeklySessions.length} this week</span>
            </div>
            <h2 id='today-session-title'>{workout.title}</h2>
            <p className='session-summary'>{workout.description}</p>
            <dl className='session-facts'>
              <div><dt>Time</dt><dd>{workout.estimatedMinutes} min</dd></div>
              <div><dt>Session</dt><dd>{displayedSessionNumber} of {weeklySessions.length}</dd></div>
            </dl>
            <div
              aria-label='Weekly session progress'
              aria-valuemax={weeklySessions.length}
              aria-valuemin={0}
              aria-valuenow={completedSessions}
              className='today-session__progress'
              role='progressbar'
            >
              <span style={{ width: `${weeklySessions.length ? (completedSessions / weeklySessions.length) * 100 : 0}%` }} />
            </div>
            {displayedEntry.status === 'scheduled' && (
              <button className='primary-action' onClick={handleStartWorkout} type='button'>Start workout</button>
            )}
            {displayedEntry.status === 'completed' && <p className='session-outcome'>{wasStoppedEarly ? 'Stopped early' : 'Completed'}</p>}
            {displayedEntry.status === 'skipped' && <p className='session-outcome'>Skipped</p>}
          </>
        )}
        {!isLoading && enrollment && !workout && (
          <>
            <p className='session-state'>Full rest</p>
            <h2 id='today-session-title'>Recover today</h2>
            <p className='session-summary'>Keep the day easy. Your next session is already waiting in the plan.</p>
          </>
        )}
      </section>
      {weekSchedule.length > 0 && <TrainingWeekStrip entries={weekSchedule} today={today} />}
      {enrollment && displayedEntry && weekSchedule.length > 0 && (
        <section aria-labelledby='weekly-summary-title' className='weekly-summary'>
          <header>
            <h2 id='weekly-summary-title'>This week</h2>
            <span>{completedSessions}/{weeklySessions.length} planned</span>
          </header>
          <dl>
            <div><dt>Sessions</dt><dd>{formatSessionCount(weeklySummary.sessions)}</dd></div>
            <div><dt>Time</dt><dd>{formatSummaryDuration(weeklySummary.durationSeconds)}</dd></div>
            <div><dt>Distance</dt><dd>{(weeklySummary.distanceMetres / 1000).toFixed(2)} km</dd></div>
          </dl>
        </section>
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
    </section>
  )
}

function formatSessionCount (count: number) {
  return `${count} ${count === 1 ? 'session' : 'sessions'}`
}

function formatSummaryDuration (seconds: number) {
  return `${Math.round(seconds / 60)} min`
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
