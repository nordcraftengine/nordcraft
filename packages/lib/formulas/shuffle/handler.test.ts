import { describe, expect, test } from 'bun:test'
import handler from './handler'

// Mock Math.random() to return predictable "random" results
let executions = 0
global.Math.random = () => {
  const rand = (0.5 + executions * 0.1) % 1
  executions++
  return rand
}

describe('Formula: Shuffle', () => {
  test('should shuffle an array', () => {
    expect(handler([[1, 2, 3, 4, 5, 6, 7]], undefined as any)).toEqual([
      2, 1, 3, 5, 6, 7, 4,
    ])
    expect(handler(['hello'], undefined as any)).toEqual('elloh')
  })
})
