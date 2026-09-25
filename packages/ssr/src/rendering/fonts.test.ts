import { getFontCssUrl as getFontCssUrlFromCore } from '@nordcraft/core/dist/styling/fonts'
import { describe, expect, test } from 'bun:test'
import { getFontCssUrl } from './fonts'

describe('getFontCssUrl() re-export', () => {
  test('it is the implementation from core, not a copy', () => {
    // Behaviour is covered in core - asserting identity is what keeps this
    // path from drifting into a second implementation.
    expect(getFontCssUrl).toBe(getFontCssUrlFromCore)
  })
})
