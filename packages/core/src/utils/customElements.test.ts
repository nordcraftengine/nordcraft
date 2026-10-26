import { describe, expect, test } from 'bun:test'
import { safeCustomElementName } from './customElements'
// cSpell:ignore mycustomelement, myelement

describe('safeCustomElementName', () => {
  test('should remove leading and trailing white-spaces', () => {
    const input = '  MyCustomElement  '
    const result = safeCustomElementName(input)
    expect(result).toBe('toddle-mycustomelement')
  })

  test('should convert input to lowercase', () => {
    const input = 'MyCustomElement'
    const result = safeCustomElementName(input)
    expect(result).toBe('toddle-mycustomelement')
  })

  test('should remove white-spaces from the middle', () => {
    const input = 'My Custom Element'
    const result = safeCustomElementName(input)
    expect(result).toBe('toddle-mycustomelement')
  })

  test('should add "toddle-" prefix if no hyphen', () => {
    const input = 'MyElement'
    const result = safeCustomElementName(input)
    expect(result).toBe('toddle-myelement')
  })

  test('should not add "toddle-" prefix if hyphen is present', () => {
    const input = 'my-custom-element'
    const result = safeCustomElementName(input)
    expect(result).toBe('my-custom-element')
  })

  test('should remove multiple consecutive white-spaces', () => {
    const input = '  My   Custom  Element  '
    const result = safeCustomElementName(input)
    expect(result).toBe('toddle-mycustomelement')
  })
})
