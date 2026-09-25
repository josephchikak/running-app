import { createHashRouter } from 'react-router-dom'
import { AppShell } from './AppShell'
import { PlaceholderPage, TodayPage } from './StaticPages'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'plan', element: <PlaceholderPage title='Plan' /> },
      { path: 'history', element: <PlaceholderPage title='History' /> },
      { path: 'settings', element: <PlaceholderPage title='Settings' /> },
      { path: '*', element: <PlaceholderPage title='Page not found' /> }
    ]
  }
])
