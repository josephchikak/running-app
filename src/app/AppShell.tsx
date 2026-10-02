import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AppIcon, type AppIconName } from '../components/AppIcon'
import { StorageNotice } from '../components/StorageNotice'
import { RouteMeta } from './RouteMeta'

interface NavigationItem {
  icon: AppIconName
  label: string
  to: string
}

export function AppShell () {
  const location = useLocation()
  const isActiveWorkout = location.pathname.startsWith('/workout/')

  return (
    <div className={isActiveWorkout ? 'app-shell app-shell--workout' : 'app-shell'}>
      <RouteMeta />
      <main className='app-main'>
        <Outlet />
      </main>
      {!isActiveWorkout && <StorageNotice />}
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
          <AppIcon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

const navigationItems: NavigationItem[] = [
  { icon: 'today', label: 'Today', to: '/' },
  { icon: 'plan', label: 'Plan', to: '/plan' },
  { icon: 'history', label: 'History', to: '/history' },
  { icon: 'settings', label: 'Settings', to: '/settings' }
]
