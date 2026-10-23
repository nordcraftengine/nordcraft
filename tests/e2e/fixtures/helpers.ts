import type {
  ElementNodeModel,
  TextNodeModel,
} from '@nordcraft/core/dist/component/component.types'
import type { Formula } from '@nordcraft/core/dist/formula/formula'

export const value = (data: string | number | boolean | null): Formula => ({
  type: 'value',
  value: data,
})

export const path = (...segments: Array<string | number>): Formula => ({
  type: 'path',
  path: segments,
})

export const equals = (first: Formula, second: Formula): Formula => ({
  type: 'function',
  name: '@toddle/equals',
  arguments: [
    { name: 'First', formula: first },
    { name: 'Second', formula: second },
  ],
})

export const textNode = (formula: Formula): TextNodeModel => ({
  type: 'text',
  value: formula,
})

export const element = (
  tag: string,
  options: {
    testId?: string
    children?: string[]
    events?: ElementNodeModel['events']
  } = {},
): ElementNodeModel => ({
  type: 'element',
  tag,
  attrs: options.testId ? { 'data-testid': value(options.testId) } : {},
  children: options.children ?? [],
  events: options.events ?? {},
})
