import { describe, expect, test } from 'bun:test'
import isEqual from 'fast-deep-equal'
import handler from './handler'
;(globalThis as any).toddle = { isEqual }

describe('Formula: Id', () => {
  // This test should run first as there is no way to reset the client side counter at the moment.
  test('Should generate the same id for client and server when called once', () => {
    const serverCtx = { env: { isServer: true, request: {} } } as any
    const clientCtx = { env: { isServer: false, request: {} } } as any

    const serverId = handler([], serverCtx)
    const clientId = handler([], clientCtx)

    expect(serverId).toBe(clientId)
  })

  test('Should generate a unique number on client', () => {
    const ctx = { env: { isServer: false, request: {} } } as any
    const ref = handler([], ctx)
    const res = handler([], ctx)
    expect(typeof ref).toBe('string')
    expect(typeof res).toBe('string')
    expect(res).not.toBe(ref)
  })

  test('Should generate a unique number on server', () => {
    const ctx = { env: { isServer: true, request: {} } } as any
    const ref = handler([], ctx)
    const res = handler([], ctx)
    expect(typeof ref).toBe('string')
    expect(typeof res).toBe('string')
    expect(res).not.toBe(ref)
  })

  test('Should generate from beginning for each request on server', () => {
    const request1 = {}
    const request2 = {}
    const ctx1 = { env: { isServer: true, request: request1 } } as any
    const ctx2 = { env: { isServer: true, request: request2 } } as any

    const res1 = handler([], ctx1)
    const res2 = handler([], ctx1)
    const res3 = handler([], ctx2)

    expect(res1).toBe('_id_0_')
    expect(res2).toBe('_id_1_')
    expect(res3).toBe('_id_0_')
  })
})
