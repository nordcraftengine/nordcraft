import { describe, expect, test } from 'bun:test'
import handler from './handler'

describe('Formula: Uppercase', () => {
  test('Should return the lowercase version of the string', () => {
    expect(handler(['Hello World'], undefined as any)).toBe('Hello world')
  })
})
