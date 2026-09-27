import { useTraining } from '../../app/TrainingContext'
import { workoutCatalog } from '../../data/plans/catalog'
import { formatPace } from '../../domain/pace'

export function HistoryPage () {
  const { results, isLoading } = useTraining()

  return (
    <section className='page-surface history-page'>
      <header className='feature-header'><div><p className='page-kicker'>Your work</p><h1>History</h1></div></header>
      {isLoading && <p role='status'>Opening history…</p>}
      {!isLoading && results.length === 0 && (
        <div className='empty-state'>
          <span aria-hidden='true'>00</span>
          <h2>No sessions yet</h2>
          <p>Your completed runs and strength sessions will appear here.</p>
        </div>
      )}
      <ol className='history-list'>
        {results.map(result => (
          <li key={result.id}>
            <div>
              <time dateTime={result.completedAt}>{formatHistoryTiming(result.plannedDate, result.completedAt)}</time>
              <h2>{workoutCatalog[result.workoutId]?.title ?? 'Workout'}</h2>
            </div>
            <dl>
              <div><dt>Distance</dt><dd>{(result.distanceMetres / 1000).toFixed(2)} km</dd></div>
              <div><dt>Time</dt><dd>{formatDuration(result.durationSeconds)}</dd></div>
              <div><dt>Avg pace</dt><dd>{result.averagePaceSecondsPerKilometre ? formatPace(result.averagePaceSecondsPerKilometre) : '—'}</dd></div>
            </dl>
          </li>
        ))}
      </ol>
    </section>
  )
}

function formatDuration (seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainder = Math.round(seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainder}`
}

function formatHistoryDate (value: string) {
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function formatHistoryTiming (plannedDate: string | undefined, completedAt: string) {
  if (!plannedDate || plannedDate === completedAt.slice(0, 10)) return formatHistoryDate(completedAt)

  const format = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short' })
  return `Planned ${format.format(new Date(`${plannedDate}T12:00:00Z`))} · Completed ${format.format(new Date(completedAt))}`
}
