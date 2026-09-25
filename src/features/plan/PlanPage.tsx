import { useCallback, useMemo, useState } from 'react'
import { useTraining } from '../../app/TrainingContext'
import { trainingCatalog, workoutCatalog } from '../../data/plans/catalog'
import type { PlanWeek } from '../../domain/models'

const phaseLabels = {
  'faster-5k': 'Faster 5K',
  transition: 'Transition',
  'build-to-10k': 'Build to 10K'
} as const

export function PlanPage () {
  const { enrollment, schedule } = useTraining()
  const currentEntry = schedule.find(entry => entry.status === 'scheduled')
  const initialWeek = currentEntry?.weekNumber ?? 1
  const [expandedWeek, setExpandedWeek] = useState(initialWeek)
  const phases = useMemo(() => Object.entries(phaseLabels), [])
  const handleWeekClick = useCallback((weekNumber: number) => {
    setExpandedWeek(current => current === weekNumber ? 0 : weekNumber)
  }, [])

  return (
    <section className='page-surface plan-page'>
      <header className='feature-header'>
        <div><p className='page-kicker'>Your path</p><h1>Plan</h1></div>
        <span>17 weeks</span>
      </header>
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
                onToggle={handleWeekClick}
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
}

function PlanWeekRow ({ week, isExpanded, onToggle }: PlanWeekRowProps) {
  const handleToggle = useCallback(() => onToggle(week.number), [onToggle, week.number])

  return (
    <article className={isExpanded ? 'plan-week plan-week--open' : 'plan-week'}>
      <button onClick={handleToggle} type='button'>
        <span>Week {week.number}</span>
        <strong>{week.title}</strong>
        <span>{isExpanded ? '−' : '+'}</span>
      </button>
      {isExpanded && (
        <ol className='week-sessions'>
          {Object.entries(week.schedule).map(([day, workoutId]) => (
            <li key={day}>
              <span>{capitalize(day)}</span>
              <strong>{workoutId ? workoutCatalog[workoutId].title : 'Full rest'}</strong>
            </li>
          ))}
        </ol>
      )}
    </article>
  )
}

function capitalize (value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
