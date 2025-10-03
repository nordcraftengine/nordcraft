import { valueFormula } from '@nordcraft/core/dist/formula/formulaUtils'
import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { noContextConsumersRule } from './noContextConsumersRule'

describe('noContextConsumersRule', () => {
  test('should detect component with exposed formulas but no slot/component child', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            provider: {
              name: 'provider',
              nodes: {
                textNode: {
                  type: 'text',
                  value: valueFormula('Hello world'),
                },
              },
              formulas: {
                test: {
                  name: 'test',
                  arguments: [],
                  formula: {
                    type: 'value',
                    value: 1,
                  },
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              contexts: {
                known: {
                  formulas: ['test'],
                  workflows: ['test'],
                  componentName: 'known',
                },
              },
            },
          },
        },
        rules: [noContextConsumersRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no context consumers')
  })
  test('should detect component with exposed workflows but no slot/component child', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            provider: {
              name: 'provider',
              nodes: {
                textNode: {
                  type: 'text',
                  value: valueFormula('Hello world'),
                },
              },
              formulas: {},
              workflows: {
                test: {
                  actions: [],
                  exposeInContext: true,
                  name: 'test',
                  parameters: [],
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              contexts: {
                known: {
                  formulas: ['test'],
                  workflows: ['test'],
                  componentName: 'known',
                },
              },
            },
          },
        },
        rules: [noContextConsumersRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no context consumers')
  })
  test('should not detect component with no exposed workflows/formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            provider: {
              name: 'provider',
              nodes: {
                textNode: {
                  type: 'text',
                  value: valueFormula('Hello world'),
                },
              },
              formulas: {},
              workflows: {},
              apis: {},
              attributes: {},
              variables: {},
              contexts: {},
            },
          },
        },
        rules: [noContextConsumersRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
  test('should not detect component with exposed workflows/formulas when a slot exists', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            provider: {
              name: 'provider',
              nodes: {
                textNode: {
                  type: 'text',
                  value: valueFormula('Hello world'),
                },
                slotNode: {
                  type: 'slot',
                  children: [],
                },
              },
              formulas: {
                test: {
                  name: 'test',
                  arguments: [],
                  formula: {
                    type: 'value',
                    value: 1,
                  },
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              workflows: {
                test: {
                  actions: [],
                  exposeInContext: true,
                  name: 'test',
                  parameters: [],
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              contexts: {},
            },
          },
        },
        rules: [noContextConsumersRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
  test('should not detect component with exposed workflows/formulas when a child component exists', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            provider: {
              name: 'provider',
              nodes: {
                textNode: {
                  type: 'text',
                  value: valueFormula('Hello world'),
                },
                componentNode: {
                  type: 'component',
                  name: 'test-component',
                  attrs: {},
                  events: {},
                  children: [],
                },
              },
              formulas: {
                test: {
                  name: 'test',
                  arguments: [],
                  formula: {
                    type: 'value',
                    value: 1,
                  },
                  exposeInContext: true,
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              workflows: {
                test: {
                  actions: [],
                  exposeInContext: true,
                  name: 'test',
                  parameters: [],
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              apis: {},
              attributes: {},
              variables: {},
              contexts: {},
            },
          },
        },
        rules: [noContextConsumersRule],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
