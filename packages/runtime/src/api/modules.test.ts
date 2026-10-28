import { describe, expect, test } from 'bun:test'
import {
  getApiV2Factory,
  getLegacyApiFactory,
  loadApiModules,
  registerApiModules,
} from './modules'

describe('runtime API modules', () => {
  test('throws when factory is accessed before being loaded or registered', () => {
    // If not registered yet, accessing factory throws descriptive error
    expect(() => getLegacyApiFactory()).toThrow(
      'The API v1 runtime has not been loaded',
    )
    expect(() => getApiV2Factory()).toThrow(
      'The API v2 runtime has not been loaded',
    )
  })

  test('loadApiModules does not import when no APIs are requested', async () => {
    await expect(
      loadApiModules({ v1: false, v2: false }),
    ).resolves.toBeUndefined()
  })

  test('registers and retrieves API module factories directly', () => {
    const dummyV1 = (() => {}) as any
    const dummyV2 = (() => {}) as any

    registerApiModules({
      createLegacyAPI: dummyV1,
      createAPI: dummyV2,
    })

    expect(getLegacyApiFactory()).toBe(dummyV1)
    expect(getApiV2Factory()).toBe(dummyV2)
  })

  test('loadApiModules resolves immediately when factories are already registered', async () => {
    // Even if v1 and v2 are true, it should resolve without throwing because factories are registered
    await expect(
      loadApiModules({ v1: true, v2: true }),
    ).resolves.toBeUndefined()
  })
})
