import { describe, expect, it, vi } from 'vitest'
import { createWakeLockController } from './wake-lock'

describe('wake lock controller', () => {
  it('reacquires the lock when the page becomes visible again', async () => {
    let visibilityHandler: (() => void) | undefined
    const release = vi.fn().mockResolvedValue(undefined)
    const request = vi.fn().mockResolvedValue({ release })
    const documentAdapter = {
      visibilityState: 'visible' as DocumentVisibilityState,
      addEventListener: vi.fn((_type: string, handler: () => void) => { visibilityHandler = handler }),
      removeEventListener: vi.fn()
    }
    const controller = createWakeLockController({ wakeLock: { request }, document: documentAdapter })

    await controller.acquire()
    documentAdapter.visibilityState = 'hidden'
    visibilityHandler?.()
    documentAdapter.visibilityState = 'visible'
    visibilityHandler?.()
    await Promise.resolve()

    expect(request).toHaveBeenCalledTimes(2)
    await controller.release()
    expect(release).toHaveBeenCalled()
    expect(documentAdapter.removeEventListener).toHaveBeenCalled()
  })
})
