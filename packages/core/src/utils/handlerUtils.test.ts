import { safeFunctionName } from './handlerUtils'
// cSpell:ignore mycustomelement, myelement

describe('safeFunctionName', () => {
  test('should remove any non-alphanumeric characters', () => {
    const input = '  MyHandler!@#  '
    const result = safeFunctionName(input)
    expect(result).toBe('MyHandler')
  })

  test('should remove any leading numbers', () => {
    const input = '123MyHandler123'
    const result = safeFunctionName(input)
    expect(result).toBe('MyHandler123')
  })
})
