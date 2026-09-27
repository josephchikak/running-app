import { NavLink, Outlet, useLocation } from 'react-router-dom'

interface NavigationItem {
  label: string
  to: string
}

export function AppShell () {
  const location = useLocation()
  const isActiveWorkout = location.pathname.startsWith('/workout/')

  return (
    <div className={isActiveWorkout ? 'app-shell app-shell--workout' : 'app-shell'}>
      <main className='app-main'>
        <Outlet />
      </main>
      {!isActiveWorkout && <PrimaryNavigation />}
    </div>
  )
}

function PrimaryNavigation () {
  return (
    <nav aria-label='Primary' className='primary-navigation'>
      {navigationItems.map(item => (
        <NavLink
          className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}
          end={item.to === '/'}
          key={item.to}
          to={item.to}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

const navigationItems: NavigationItem[] = [
  { label: 'Today', to: '/' },
  { label: 'Plan', to: '/plan' },
  { label: 'History', to: '/history' },
  { label: 'Settings', to: '/settings' }
]
