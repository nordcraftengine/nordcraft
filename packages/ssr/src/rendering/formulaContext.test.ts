import { describe, expect, test } from 'bun:test'
import { getPageFormulaContext, getParameters } from './formulaContext'

describe('formulaContext', () => {
  describe('getParameters', () => {
    test('it returns the correct parameters', () => {
      expect(
        getParameters({
          route: {
            path: [
              {
                name: 'test',
                type: 'param',
                testValue: 'param-value',
              },
              {
                name: 'test2',
                type: 'static',
              },
            ],
            query: {
              embed: {
                name: 'embed',
                testValue: 'notenabled',
              },
              'power-lifting': {
                name: 'power-lifting',
                testValue: 'on',
              },
            },
          },
          // @ts-expect-error - the method only needs the url
          req: {
            url: 'https://toddle.dev/param-value/test2?embed=notenabled&power-lifting=on',
          },
        }),
      ).toEqual({
        pathParams: {
          test: 'param-value',
        },
        searchParamsWithDefaults: {
          embed: 'notenabled',
          'power-lifting': 'on',
        },
        combinedParams: {
          embed: 'notenabled',
          'power-lifting': 'on',
          test: 'param-value',
        },
        hash: '',
        url: new URL(
          'https://toddle.dev/param-value/test2?embed=notenabled&power-lifting=on',
        ),
      })
    })
  })

  describe('getPageFormulaContext', () => {
    test('it initializes theme before variables so variables can reference Page.Theme', () => {
      const component = {
        name: 'TestPage',
        route: {
          path: [],
          query: {},
          info: {
            theme: {
              formula: { type: 'value', value: 'dark' },
            },
          },
        },
        variables: {
          myVar: {
            name: 'myVar',
            initialValue: {
              type: 'path',
              path: ['Page', 'Theme'],
            },
          },
        },
      }

      const result = getPageFormulaContext({
        branchName: 'main',
        component: component as any,
        req: {
          url: 'https://toddle.dev/',
          headers: new Headers(),
        } as any,
        logErrors: false,
        files: {
          formulas: {},
          packages: {},
        } as any,
      })

      expect(result.data.Page?.Theme).toBe('dark')
      expect(result.data.Variables?.myVar).toBe('dark')
    })
  })
})
