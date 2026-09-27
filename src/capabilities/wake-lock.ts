interface WakeLockSentinelLike {
  release: () => Promise<void>
}

interface WakeLockLike {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>
}

interface DocumentLike {
  visibilityState: DocumentVisibilityState
  addEventListener: (type: 'visibilitychange', listener: () => void) => void
  removeEventListener: (type: 'visibilitychange', listener: () => void) => void
}

interface WakeLockOptions {
  wakeLock?: WakeLockLike
  document?: DocumentLike
}

export interface WakeLockController {
  acquire: () => Promise<boolean>
  release: () => Promise<void>
  isHeld: () => boolean
}

export function createWakeLockController (options: WakeLockOptions = {}): WakeLockController {
  const wakeLock = options.wakeLock ?? getBrowserWakeLock()
  const documentAdapter = options.document ?? globalThis.document
  let sentinel: WakeLockSentinelLike | null = null
  let isActive = false
  let isListening = false

  async function requestLock () {
    if (!wakeLock || documentAdapter.visibilityState !== 'visible') return false
    try {
      sentinel = await wakeLock.request('screen')
      return true
    } catch {
      sentinel = null
      return false
    }
  }

  async function handleVisibilityChange () {
    if (!isActive) return
    if (documentAdapter.visibilityState === 'hidden') {
      const heldSentinel = sentinel
      sentinel = null
      await heldSentinel?.release()
      return
    }
    if (!sentinel) await requestLock()
  }

  return {
    async acquire () {
      isActive = true
      if (!isListening) {
        documentAdapter.addEventListener('visibilitychange', handleVisibilityChange)
        isListening = true
      }
      return requestLock()
    },
    async release () {
      isActive = false
      await sentinel?.release()
      sentinel = null
      if (isListening) {
        documentAdapter.removeEventListener('visibilitychange', handleVisibilityChange)
        isListening = false
      }
    },
    isHeld () {
      return sentinel !== null
    }
  }
}

function getBrowserWakeLock (): WakeLockLike | undefined {
  if (!globalThis.navigator || !('wakeLock' in globalThis.navigator)) return undefined
  return globalThis.navigator.wakeLock as unknown as WakeLockLike
}
