import type { ComponentData } from '@nordcraft/core/dist/component/component.types'
import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { createText } from './createText'

describe('createText()', () => {
  test('it returns a span element with text in it while in default namespace', () => {
    let textElement = createText({
      ctx: {
        isRootComponent: false,
        component: { name: 'My Component' },
      } as Partial<ComponentContext> as any,
      namespace: 'http://www.w3.org/1999/xhtml',
      dataSignal: undefined as any,
      path: 'test-text-element',
      id: 'test-text-element-id',
      node: {
        type: 'text',
        value: valueFormula('Hello world'),
      },
    })
    expect(textElement instanceof HTMLSpanElement).toBe(true)
    textElement = textElement as HTMLSpanElement
    expect(textElement.tagName).toBe('SPAN')
    expect(textElement.getAttribute('data-node-id')).toBe(
      'test-text-element-id',
    )
    expect(textElement.getAttribute('data-id')).toBe('test-text-element')
    expect(textElement.getAttribute('data-component')).toBe('My Component')
    expect(textElement.children.length).toBe(0)
    expect(textElement.innerText).toBe('Hello world')
  })
  test('it returns a text node while not in the default namespace', () => {
    const textElement = createText({
      ctx: {
        isRootComponent: false,
        component: { name: 'My Component' },
      } as Partial<ComponentContext> as any,
      namespace: 'http://www.w3.org/2000/svg',
      dataSignal: undefined as any,
      path: 'test-text-element',
      id: 'test-text-element-id',
      node: {
        type: 'text',
        value: valueFormula('Hello world'),
      },
    }) as Text
    expect(textElement instanceof Text).toBe(true)
    expect(textElement.textContent).toBe('Hello world')
  })
  test('it does not add a data-component attribute for root elements', () => {
    const textElement = createText({
      ctx: {
        isRootComponent: true,
      } as Partial<ComponentContext> as any,
      dataSignal: undefined as any,
      path: 'test-text-element',
      id: 'test-text-element-id',
      node: {
        type: 'text',
        value: valueFormula('Hello world'),
      },
    }) as HTMLSpanElement
    expect(textElement.getAttribute('data-component')).toBeNull()
  })
  test('Signal changes update the text element', () => {
    const dataSignal = new Signal<ComponentData>({
      Attributes: { text: 'Hello world' },
    })
    const textElement = createText({
      ctx: { dataSignal } as Partial<ComponentContext> as any,
      dataSignal,
      path: '',
      id: '',
      node: {
        type: 'text',
        value: {
          type: 'path',
          path: ['Attributes', 'text'],
        },
      },
    })
    expect(textElement.textContent).toBe('Hello world')
    dataSignal.set({ Attributes: { text: 'Goodbye world' } })
    expect(textElement.textContent).toBe('Goodbye world')
  })
  test('Show formulas are not respected for text elements', () => {
    const textElement = createText({
      ctx: {} as Partial<ComponentContext> as any,
      dataSignal: undefined as any,
      path: '',
      id: '',
      node: {
        type: 'text',
        value: valueFormula('Hello world'),
        condition: valueFormula(false),
      },
    })
    expect(textElement.textContent).toBe('Hello world')
  })
  test('Repeat formulas are not respected for text elements', () => {
    const textElement = createText({
      ctx: {} as Partial<ComponentContext> as any,
      dataSignal: undefined as any,
      path: '',
      id: '',
      node: {
        type: 'text',
        value: valueFormula('Hello world'),
        repeat: valueFormula(['1', '2', '3']),
      },
    })
    expect(textElement.textContent).toBe('Hello world')
  })
})
