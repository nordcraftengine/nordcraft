import {
  functionFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { unknownProjectFormulaRule } from './unknownProjectFormulaRule'

describe('unknownProjectFormulaRule', () => {
  test('should find unknown project formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {
                    test: functionFormula('missing-formula'),
                    'other-test': functionFormula('package-formula', {
                      package: 'my-package',
                    }),
                  },
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownProjectFormulaRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('unknown project formula')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      'root',
      'attrs',
      'test',
    ])
    expect(problems[1].code).toBe('unknown project formula')
    expect(problems[1].path).toEqual([
      'components',
      'test',
      'nodes',
      'root',
      'attrs',
      'other-test',
    ])
  })
  test('should not report known formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {
            'known-formula': {
              formula: valueFormula(true),
              name: 'known-formula',
              arguments: [],
            },
          },
          packages: {
            'my-package': {
              components: {},
              actions: {},
              formulas: {
                'package-formula': {
                  formula: valueFormula(true),
                  name: 'package-formula',
                  arguments: [],
                },
              },
              manifest: {
                name: 'my-package',
                commit: '123',
              },
            },
          },
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {
                    test: functionFormula('known-formula'),
                    'other-test': functionFormula('package-formula', {
                      package: 'my-package',
                    }),
                    time: functionFormula('@toddle/now'),
                  },
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownProjectFormulaRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should not report unknown formulas from within packages', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          packages: {
            'my-package': {
              components: {},
              actions: {},
              formulas: {
                'package-formula': {
                  formula: {
                    type: 'function',
                    name: 'non-existent-formula',
                    arguments: [],
                  },
                  name: 'package-formula',
                  arguments: [],
                },
              },
              manifest: {
                name: 'my-package',
                commit: '123',
              },
            },
          },
          components: {
            test: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  attrs: {
                    test: functionFormula('package-formula', {
                      package: 'my-package',
                    }),
                  },
                  classes: {},
                  events: {},
                  tag: 'div',
                  children: [],
                  style: {},
                },
              },
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [unknownProjectFormulaRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
})
