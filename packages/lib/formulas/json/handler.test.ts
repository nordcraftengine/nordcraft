import { describe, expect, test } from 'bun:test'
import handler from './handler'

import fastDeepEqual from 'fast-deep-equal'
;(globalThis as any).toddle = { isEqual: fastDeepEqual }

describe('Formula: JSON', () => {
  test('Should return a json string when given an object', () => {
    expect(handler([{ name: 'Andreas' }, 0], undefined as any)).toBe(
      '{"name":"Andreas"}',
    )
  })
  test('Should return a json string when given an array', () => {
    expect(handler([[], 0], undefined as any)).toBe('[]')
  })
  test('Should respect indentation', () => {
    expect(handler([{ name: 'Andreas', role: 'Admin' }, 2], undefined as any))
      .toBe(`{
  "name": "Andreas",
  "role": "Admin"
}`)
  })
})
