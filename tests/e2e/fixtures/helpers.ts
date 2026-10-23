import type {
  ComponentNodeModel,
  ElementNodeModel,
  SlotNodeModel,
  TextNodeModel,
} from '@nordcraft/core/dist/component/component.types'
import type { Formula } from '@nordcraft/core/dist/formula/formula'

export const value = (
  data: string | number | boolean | null | unknown[] | Record<string, unknown>,
): Formula => ({
  type: 'value',
  value: data as any,
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

export const not = (formula: Formula): Formula => ({
  type: 'function',
  name: '@toddle/not',
  arguments: [{ name: 'Value', formula }],
})

export const add = (first: Formula, second: Formula): Formula => ({
  type: 'function',
  name: '@toddle/add',
  arguments: [
    { name: '0', formula: first },
    { name: '1', formula: second },
  ],
})

export const append = (arr: Formula, item: Formula): Formula => ({
  type: 'function',
  name: '@toddle/append',
  arguments: [
    { name: 'Array', formula: arr },
    { name: 'Item', formula: item },
  ],
})

export const slice = (arr: Formula, from: Formula, to?: Formula): Formula => ({
  type: 'function',
  name: '@toddle/slice',
  arguments: [
    { name: 'Array', formula: arr },
    { name: 'From', formula: from },
    ...(to ? [{ name: 'To', formula: to }] : []),
  ],
})

export const textNode = (formula: Formula, id?: string): TextNodeModel => ({
  id,
  type: 'text',
  value: formula,
})

export const element = (
  tag: string,
  options: {
    testId?: string | Formula
    children?: string[]
    events?: ElementNodeModel['events']
    condition?: Formula
    repeat?: Formula
    repeatKey?: Formula
    classes?: ElementNodeModel['classes']
    slot?: string
    attrs?: ElementNodeModel['attrs']
  } = {},
): ElementNodeModel => ({
  type: 'element',
  tag,
  attrs: {
    ...(options.testId
      ? {
          'data-testid':
            typeof options.testId === 'string'
              ? value(options.testId)
              : options.testId,
        }
      : {}),
    ...(options.attrs ?? {}),
  },
  children: options.children ?? [],
  events: options.events ?? {},
  condition: options.condition,
  repeat: options.repeat,
  repeatKey: options.repeatKey,
  classes: options.classes,
  slot: options.slot,
})

export const componentNode = (
  name: string,
  options: {
    attrs?: ComponentNodeModel['attrs']
    children?: string[]
    events?: ComponentNodeModel['events']
    condition?: Formula
    repeat?: Formula
    repeatKey?: Formula
    slot?: string
  } = {},
): ComponentNodeModel => ({
  type: 'component',
  name,
  attrs: options.attrs ?? {},
  children: options.children ?? [],
  events: options.events ?? {},
  condition: options.condition,
  repeat: options.repeat,
  repeatKey: options.repeatKey,
  slot: options.slot,
})

export const slotNode = (
  options: {
    name?: string
    children?: string[]
    condition?: Formula
    slot?: string
  } = {},
): SlotNodeModel => ({
  type: 'slot',
  name: options.name,
  children: options.children ?? [],
  condition: options.condition,
  slot: options.slot,
})
