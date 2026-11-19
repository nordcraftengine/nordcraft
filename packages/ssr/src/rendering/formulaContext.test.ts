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

    test('evaluates v2 custom code formulas for project and packages alongside NordcraftFormulas', () => {
      const component = {
        name: 'TestPage',
        route: {
          path: [],
          query: {},
        },
        variables: {
          projectJsResult: {
            initialValue: {
              type: 'function',
              name: 'myFormula',
              arguments: [
                { name: 'first', formula: { type: 'value', value: 4 } },
                { name: 'second', formula: { type: 'value', value: 5 } },
              ],
            },
          },
          packageJsResult: {
            initialValue: {
              type: 'function',
              name: 'pkgFormula',
              package: 'my-pkg',
              arguments: [{ name: 'x', formula: { type: 'value', value: 9 } }],
            },
          },
          nordcraftFormulaResult: {
            initialValue: {
              type: 'function',
              name: 'declarativeFormula',
              arguments: [],
            },
          },
          uncompiledFormulaResult: {
            initialValue: {
              type: 'function',
              name: 'uncompiledFormula',
              arguments: [],
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
          formulas: {
            myFormula: {
              name: 'myFormula',
              version: 2,
              arguments: [{ name: 'first' }, { name: 'second' }],
              handler: ({ first, second }: Record<string, unknown>) =>
                Number(first) * Number(second) + Number(first),
            },
            declarativeFormula: {
              name: 'declarativeFormula',
              arguments: [],
              formula: { type: 'value', value: 'hello' },
            },
            uncompiledFormula: {
              name: 'uncompiledFormula',
              version: 2,
              arguments: [],
              handler: 'function uncompiledFormula() { return 1 }',
            },
          },
          packages: {
            'my-pkg': {
              manifest: { name: 'my-pkg', commit: 'abc' },
              components: {},
              actions: {},
              formulas: {
                pkgFormula: {
                  name: 'pkgFormula',
                  version: 2,
                  arguments: [{ name: 'x' }],
                  handler: ({ x }: Record<string, unknown>) => Number(x) + 1,
                },
              },
            },
          },
        } as any,
      })

      expect(result.data.Variables).toEqual({
        projectJsResult: 24,
        packageJsResult: 10,
        nordcraftFormulaResult: 'hello',
        uncompiledFormulaResult: null,
      })
    })
  })
})
