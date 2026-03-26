import type { ToddleRequestInit } from '@nordcraft/core/dist/api/apiTypes'
import { describe, expect, test } from 'bun:test'
import { ApiAbortHandler } from './apiUtils'

describe('apiUtils', () => {
  describe('ApiAbortHandler', () => {
    test('applyAbortSignal should return a requestInit with a signal', () => {
      const handler = new ApiAbortHandler()
      const request: ToddleRequestInit = { headers: new Headers() }
      const requestInit = handler.applyAbortSignal(request)
      expect(requestInit.signal).toBeDefined()
      expect(requestInit.signal).toBeInstanceOf(AbortSignal)
    })

    test('cancelAbortSignals should abort all signals created via applyAbortSignal', () => {
      const handler = new ApiAbortHandler()
      const requestInit1 = handler.applyAbortSignal({ headers: new Headers() })
      const requestInit2 = handler.applyAbortSignal({ headers: new Headers() })

      expect(requestInit1.signal.aborted).toBe(false)
      expect(requestInit2.signal.aborted).toBe(false)

      handler.abort()

      expect(requestInit1.signal.aborted).toBe(true)
      expect(requestInit2.signal.aborted).toBe(true)
    })

    test('applyAbortSignal should merge with an existing signal', async () => {
      const handler = new ApiAbortHandler()
      const timeout = AbortSignal.timeout(50)
      const requestInit = handler.applyAbortSignal({
        signal: timeout,
        headers: new Headers(),
      })

      expect(requestInit.signal).toBeDefined()
      expect(requestInit.signal.aborted).toBe(false)
      handler.abort()
      expect(requestInit.signal.aborted).toBe(true)
    })

    test('merged signal should abort if cancelAbortSignals is called', () => {
      const handler = new ApiAbortHandler()
      const requestInit = handler.applyAbortSignal({
        signal: AbortSignal.timeout(50),
        headers: new Headers(),
      })
      expect(requestInit.signal.aborted).toBe(false)
      handler.abort()
      expect(requestInit.signal.aborted).toBe(true)
    })

    test('it should handle multiple calls to cancelAbortSignals', () => {
      const handler = new ApiAbortHandler()
      const requestInit = handler.applyAbortSignal({ headers: new Headers() })

      handler.abort()
      expect(requestInit.signal?.aborted).toBe(true)

      // Should not throw
      expect(() => handler.abort()).not.toThrow()
    })
  })
})
