import { memo } from 'react'

export type AppIconName = 'today' | 'plan' | 'history' | 'settings'

interface AppIconProps {
  name: AppIconName
}

export const AppIcon = memo(function AppIcon ({ name }: AppIconProps) {
  return (
    <svg
      aria-hidden='true'
      className='app-icon'
      fill='none'
      height='22'
      viewBox='0 0 24 24'
      width='22'
    >
      {name === 'today' && (
        <>
          <path d='M4 13.5 12 5l8 8.5' />
          <path d='M6.5 11.5V20h11v-8.5M9.5 20v-5h5v5' />
        </>
      )}
      {name === 'plan' && (
        <>
          <path d='M5 5h14M5 12h14M5 19h14' />
          <circle cx='8' cy='5' r='1.6' />
          <circle cx='15' cy='12' r='1.6' />
          <circle cx='10' cy='19' r='1.6' />
        </>
      )}
      {name === 'history' && (
        <>
          <path d='M4 12a8 8 0 1 0 2.35-5.65L4 8.7' />
          <path d='M4 4v4.7h4.7M12 7.5V12l3 2' />
        </>
      )}
      {name === 'settings' && (
        <>
          <circle cx='12' cy='12' r='3' />
          <path d='M12 3v2M12 19v2M3 12h2M19 12h2M5.64 5.64l1.42 1.42M16.94 16.94l1.42 1.42M18.36 5.64l-1.42 1.42M7.06 16.94l-1.42 1.42' />
        </>
      )}
    </svg>
  )
})
