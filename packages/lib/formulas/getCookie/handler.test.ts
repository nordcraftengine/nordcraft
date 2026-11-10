import type { FormulaHandler } from '@nordcraft/core'
import { beforeAll, describe, expect, test } from 'bun:test'
import handler from './handler'

type HandlerContext = Parameters<FormulaHandler>[1]

class MockShadowRoot {}

const createClientContext = (
  cookie: string,
  isShadowRoot = false,
): HandlerContext => ({
  component: { name: 'test', nodes: {} },
  data: { Attributes: {} },
  root: (isShadowRoot ? new MockShadowRoot() : { cookie }) as Document,
  env: {
    branchName: 'main',
    isServer: false,
    request: undefined,
    runtime: 'page',
    logErrors: false,
  },
})

const createServerContext = (
  cookies: Record<string, string>,
): HandlerContext => ({
  component: { name: 'test', nodes: {} },
  data: { Attributes: {} },
  root: {} as Document,
  env: {
    branchName: 'main',
    isServer: true,
    request: {
      headers: {},
      cookies,
      url: 'https://example.com',
    },
    runtime: undefined as never,
    logErrors: false,
  },
})

describe('Formula: Get Cookie', () => {
  beforeAll(() => {
    if (typeof globalThis.ShadowRoot === 'undefined') {
      Object.defineProperty(globalThis, 'ShadowRoot', {
        value: MockShadowRoot,
        configurable: true,
        writable: true,
      })
    }
  })

  test('returns null when cookie name is not a non-empty string', () => {
    const ctx = createClientContext('foo=bar')
    expect(handler([''], ctx)).toBe(null)
    expect(handler([null], ctx)).toBe(null)
    expect(handler([undefined], ctx)).toBe(null)
    expect(handler([123], ctx)).toBe(null)
  })

  test('returns cookie value on client-side', () => {
    const ctx = createClientContext('theme=dark; session=abc123')
    expect(handler(['theme'], ctx)).toBe('dark')
    expect(handler(['session'], ctx)).toBe('abc123')
  })

  test('returns cookie value containing = on client-side', () => {
    const ctx = createClientContext(
      'theme=dark; token=SGVsbG8gd29ybGQ==; query=a=1&b=2',
    )
    expect(handler(['token'], ctx)).toBe('SGVsbG8gd29ybGQ==')
    expect(handler(['query'], ctx)).toBe('a=1&b=2')
  })

  test('returns null when cookie is not found on client-side', () => {
    const ctx = createClientContext('theme=dark; session=abc123')
    expect(handler(['missing'], ctx)).toBe(null)
  })

  test('returns null when root is a ShadowRoot on client-side', () => {
    const ctx = createClientContext('theme=dark', true)
    expect(handler(['theme'], ctx)).toBe(null)
  })

  test('returns cookie value on server-side including values with =', () => {
    const ctx = createServerContext({
      theme: 'light',
      token: 'SGVsbG8gd29ybGQ==',
    })
    expect(handler(['theme'], ctx)).toBe('light')
    expect(handler(['token'], ctx)).toBe('SGVsbG8gd29ybGQ==')
    expect(handler(['missing'], ctx)).toBe(null)
  })
})
