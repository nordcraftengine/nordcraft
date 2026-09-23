import type { MetaEntry } from '@nordcraft/core/dist/component/component.types'
import {
  functionFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { getDynamicMetaEntries } from './meta'

describe('getDynamicMetaEntries', () => {
  test('returns an empty object if meta is undefined or null', () => {
    expect(getDynamicMetaEntries(undefined)).toEqual({})
    expect(getDynamicMetaEntries(null)).toEqual({})
  })

  test('returns an empty object if meta is an empty object', () => {
    expect(getDynamicMetaEntries({})).toEqual({})
  })

  test('returns only entries with dynamic content', () => {
    const meta: Record<string, MetaEntry> = {
      'static-entry': {
        tag: 'meta' as any,
        content: valueFormula('static'),
      },
      'dynamic-entry': {
        tag: 'meta' as any,
        content: functionFormula('dynamic'),
      },
    }
    const result = getDynamicMetaEntries(meta)
    expect(result).toEqual({ 'dynamic-entry': meta['dynamic-entry'] })
  })

  test('returns only entries with dynamic attributes', () => {
    const meta: Record<string, MetaEntry> = {
      'static-entry': {
        tag: 'meta' as any,
        attrs: {
          name: valueFormula('static'),
        },
      },
      'dynamic-entry': {
        tag: 'meta' as any,
        attrs: {
          name: functionFormula('dynamic'),
        },
      },
    }
    const result = getDynamicMetaEntries(meta)
    expect(result).toEqual({ 'dynamic-entry': meta['dynamic-entry'] })
  })

  test('returns entry if content is dynamic and attributes are static', () => {
    const meta: Record<string, MetaEntry> = {
      'dynamic-entry': {
        tag: 'meta' as any,
        content: functionFormula('dynamic'),
        attrs: {
          name: valueFormula('static'),
        },
      },
    }
    const result = getDynamicMetaEntries(meta)
    expect(result).toEqual({ 'dynamic-entry': meta['dynamic-entry'] })
  })

  test('returns entry if content is missing and one attribute is dynamic', () => {
    const meta: Record<string, MetaEntry> = {
      'dynamic-entry': {
        tag: 'meta' as any,
        attrs: {
          name: valueFormula('static'),
          property: functionFormula('dynamic'),
        },
      },
    }
    const result = getDynamicMetaEntries(meta)
    expect(result).toEqual({ 'dynamic-entry': meta['dynamic-entry'] })
  })

  test('handles entries with no content or attributes', () => {
    const meta: Record<string, MetaEntry> = {
      'empty-entry': {
        tag: 'meta' as any,
      },
    }
    const result = getDynamicMetaEntries(meta)
    expect(result).toEqual({})
  })
})
