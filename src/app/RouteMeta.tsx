import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const metadata: Record<string, { title: string, description: string }> = {
  '/': { title: 'Today', description: 'See today’s personal running or strength workout.' },
  '/plan': { title: 'Plan', description: 'Review the fixed 17-week Faster 5K and Build to 10K plan.' },
  '/history': { title: 'History', description: 'Review locally saved workout summaries.' },
  '/settings': { title: 'Settings', description: 'Manage pace guidance, spoken cues, backups, and local data.' },
  '/setup-complete': { title: 'Plan ready', description: 'Your personal 17-week running and strength plan is ready.' },
  '/privacy': { title: 'Privacy', description: 'How Running Coach keeps training and location data on your device.' },
  '/terms': { title: 'Terms', description: 'Personal-use and safety terms for Running Coach.' }
}

export function RouteMeta () {
  const location = useLocation()

  useEffect(() => {
    const route = location.pathname.startsWith('/workout/')
      ? { title: 'Active workout', description: 'Foreground GPS and spoken guidance for the active run.' }
      : metadata[location.pathname] ?? { title: 'Page not found', description: 'The requested Running Coach page was not found.' }
    document.title = `${route.title} — Running Coach`
    document.querySelector('meta[name="description"]')?.setAttribute('content', route.description)
  }, [location.pathname])

  return null
}
