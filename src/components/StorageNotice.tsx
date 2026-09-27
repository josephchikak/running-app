import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_NOTICE_KEY = 'running-coach-storage-notice'

export function StorageNotice () {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_NOTICE_KEY) !== 'dismissed'
    } catch {
      return true
    }
  })
  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_NOTICE_KEY, 'dismissed')
    } catch {
      // The notice can still be dismissed for this session when storage is blocked.
    }
    setIsVisible(false)
  }, [])

  if (!isVisible) return null

  return (
    <aside className='storage-notice' aria-label='Local storage notice'>
      <p>This app saves your plan on this phone with IndexedDB. No tracking cookies or analytics leave the device. <Link to='/privacy'>Privacy</Link></p>
      <button onClick={handleDismiss} type='button'>Got it</button>
    </aside>
  )
}
