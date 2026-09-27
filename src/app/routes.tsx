import { lazy, Suspense } from 'react'
import { createHashRouter } from 'react-router-dom'
import { HistoryPage } from '../features/history/HistoryPage'
import { LegalPage } from '../features/legal/LegalPages'
import { TodayPage } from '../features/today/TodayPage'
import { AppShell } from './AppShell'

const PlanPage = lazy(() => import('../features/plan/PlanPage').then(module => ({ default: module.PlanPage })))
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then(module => ({ default: module.SettingsPage })))
const SetupCompletePage = lazy(() => import('../features/onboarding/SetupCompletePage').then(module => ({ default: module.SetupCompletePage })))
const WorkoutPage = lazy(() => import('../features/workout/WorkoutPage').then(module => ({ default: module.WorkoutPage })))

function LoadingPage () {
  return <p className='route-loading' role='status'>Opening…</p>
}

function NotFoundPage () {
  return <section className='page-surface'><p className='page-kicker'>404</p><h1>Page not found</h1></section>
}

function deferred (element: React.ReactNode) {
  return <Suspense fallback={<LoadingPage />}>{element}</Suspense>
}

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'plan', element: deferred(<PlanPage />) },
      { path: 'history', element: <HistoryPage /> },
      { path: 'settings', element: deferred(<SettingsPage />) },
      { path: 'setup-complete', element: deferred(<SetupCompletePage />) },
      { path: 'workout/:scheduledWorkoutId', element: deferred(<WorkoutPage />) },
      { path: 'privacy', element: <LegalPage type='privacy' /> },
      { path: 'terms', element: <LegalPage type='terms' /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
])
