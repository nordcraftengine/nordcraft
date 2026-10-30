import { describe, expect, test } from 'bun:test'
import type { ComponentAPI } from './apiTypes'
import { isLegacyApi } from './apiVersions'

describe('apiVersions (Core)', () => {
  const legacyApi: ComponentAPI = { name: 'Legacy API', type: 'REST' }
  const apiV2: ComponentAPI = {
    name: 'New API',
    type: 'http',
    version: 2,
    inputs: {},
  }

  describe('isLegacyApi()', () => {
    test('it returns true for legacy APIs', () => {
      expect(isLegacyApi(legacyApi)).toBe(true)
    })

    test('it returns false for v2 APIs', () => {
      expect(isLegacyApi(apiV2)).toBe(false)
    })
  })
})
