import { describe, expect, test } from 'bun:test'
import * as v from 'valibot'
import { ActionModelSchema } from './action-schema'
import { ComponentAPISchema } from './api-schema'
import {
  ComponentSchema,
  PageSchema,
  ShallowComponentSchema,
} from './component-schema'
import { FormulaSchema } from './formula-schema'
import { RouteSchema } from './route-schema'
import { record } from './valibot-schemas'

describe('component schemas with valibot', () => {
  describe('record helper', () => {
    const stringRecord = record(v.string(), v.number())

    test('accepts valid record objects', () => {
      const result = v.safeParse(stringRecord, { a: 1, b: 2 })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.output).toEqual({ a: 1, b: 2 })
      }
    })

    test('accepts empty object', () => {
      const result = v.safeParse(stringRecord, {})
      expect(result.success).toBe(true)
    })

    test('rejects arrays', () => {
      const result = v.safeParse(stringRecord, [1, 2])
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.issues[0].expected).toBe('Object')
        expect(result.issues[0].received).toBe('Array')
      }
    })

    test('rejects non-objects', () => {
      expect(v.safeParse(stringRecord, 'not an object').success).toBe(false)
      expect(v.safeParse(stringRecord, 123).success).toBe(false)
      expect(v.safeParse(stringRecord, null).success).toBe(false)
    })
  })

  describe('FormulaSchema', () => {
    test('validates value formula', () => {
      const result = v.safeParse(FormulaSchema, {
        type: 'value',
        value: 'hello',
      })
      expect(result.success).toBe(true)
    })

    test('validates path formula', () => {
      const result = v.safeParse(FormulaSchema, {
        type: 'path',
        path: ['variables', 'myVar'],
      })
      expect(result.success).toBe(true)
    })

    test('validates array formula', () => {
      const result = v.safeParse(FormulaSchema, {
        type: 'array',
        arguments: [
          { formula: { type: 'value', value: 1 } },
          { formula: { type: 'value', value: 2 } },
        ],
      })
      expect(result.success).toBe(true)
    })

    test('validates object formula', () => {
      const result = v.safeParse(FormulaSchema, {
        type: 'object',
        arguments: [
          { name: 'title', formula: { type: 'value', value: 'Test' } },
        ],
      })
      expect(result.success).toBe(true)
    })

    test('validates switch formula', () => {
      const result = v.safeParse(FormulaSchema, {
        type: 'switch',
        cases: [
          {
            condition: { type: 'value', value: true },
            formula: { type: 'value', value: 'yes' },
          },
        ],
        default: { type: 'value', value: 'no' },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('ActionModelSchema', () => {
    test('validates SetVariable action', () => {
      const result = v.safeParse(ActionModelSchema, {
        type: 'SetVariable',
        variable: 'counter',
        data: { type: 'value', value: 1 },
      })
      expect(result.success).toBe(true)
    })

    test('validates TriggerEvent action', () => {
      const result = v.safeParse(ActionModelSchema, {
        type: 'TriggerEvent',
        event: 'clicked',
        data: { type: 'value', value: null },
      })
      expect(result.success).toBe(true)
    })

    test('validates Switch action with recursive actions', () => {
      const result = v.safeParse(ActionModelSchema, {
        type: 'Switch',
        cases: [
          {
            condition: { type: 'value', value: true },
            actions: [
              {
                type: 'SetVariable',
                variable: 'counter',
                data: { type: 'value', value: 2 },
              },
            ],
          },
        ],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('ComponentSchema and ShallowComponentSchema', () => {
    const validComponent = {
      name: 'MyComponent',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          attrs: {},
          style: {},
          children: [],
          events: {},
          classes: {},
        },
      },
      variables: {},
      formulas: {},
      workflows: {},
      apis: {},
      attributes: {},
    }

    test('validates a complete component', () => {
      expect(v.safeParse(ComponentSchema, validComponent).success).toBe(true)
    })

    test('validates page schema', () => {
      const validPage = {
        ...validComponent,
        route: {
          path: [],
          query: {},
        },
      }
      expect(v.safeParse(PageSchema, validPage).success).toBe(true)
    })

    test('validates shallow component schema', () => {
      expect(v.safeParse(ShallowComponentSchema, validComponent).success).toBe(
        true,
      )
    })

    test('rejects component where nodes is an array', () => {
      const invalid = {
        ...validComponent,
        nodes: [],
      }
      const shallowResult = v.safeParse(ShallowComponentSchema, invalid)
      expect(shallowResult.success).toBe(false)
      if (!shallowResult.success) {
        expect(shallowResult.issues[0].path?.[0]).toMatchObject({
          key: 'nodes',
        })
      }
    })

    test('rejects component where name is not a string', () => {
      const invalid = {
        ...validComponent,
        name: 123,
      }
      const result = v.safeParse(ComponentSchema, invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('ComponentAPISchema', () => {
    test('validates api request', () => {
      const api = {
        version: 2,
        name: 'getUser',
        type: 'http',
        inputs: {},
      }
      expect(v.safeParse(ComponentAPISchema, api).success).toBe(true)
    })
  })

  describe('RouteSchema', () => {
    test('validates valid route', () => {
      const route = {
        path: [
          { type: 'static', name: 'users' },
          { type: 'param', name: 'id', testValue: '123' },
        ],
        query: {
          tab: {
            name: 'tab',
            testValue: 'profile',
          },
        },
      }
      expect(v.safeParse(RouteSchema, route).success).toBe(true)
    })
  })
})
