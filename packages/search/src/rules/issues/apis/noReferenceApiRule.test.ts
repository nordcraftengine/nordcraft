import { ApiMethod } from '@nordcraft/core/dist/api/apiTypes'
import {
  pathFormula,
  valueFormula,
} from '@nordcraft/core/dist/formula/formulaUtils'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { noReferenceApiRule } from './noReferenceApiRule'

describe('find noReferenceApiRule', () => {
  test('should detect APIs with no references', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            apiComponent: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {
                'my-legacy-api': {
                  name: 'my-legacy-api',
                  type: 'REST',
                  autoFetch: valueFormula(false),
                  onCompleted: null,
                  onFailed: null,
                },
                'my-api': {
                  name: 'my-api',
                  type: 'http',
                  version: 2,
                  autoFetch: valueFormula(false),
                  inputs: {},
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceApiRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('no-reference api')
    expect(problems[0].path).toEqual([
      'components',
      'apiComponent',
      'apis',
      'my-legacy-api',
    ])
    expect(problems[1].code).toBe('no-reference api')
    expect(problems[1].path).toEqual([
      'components',
      'apiComponent',
      'apis',
      'my-api',
    ])
  })

  test('should not detect APIs with references from formulas', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            apiComponent: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'p',
                  attrs: {},
                  condition: pathFormula(['Apis', 'my-api', 'data', 'success']),
                  style: {},
                  children: [],
                  classes: {},
                  events: {},
                },
              },
              formulas: {},
              apis: {
                'my-api': {
                  name: 'my-api',
                  type: 'http',
                  version: 2,
                  autoFetch: valueFormula(false),
                  inputs: {},
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceApiRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should not detect APIs with references from actions', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            apiComponent: {
              name: 'test',
              nodes: {
                root: {
                  type: 'element',
                  tag: 'button',
                  attrs: {},
                  style: {},
                  children: [],
                  classes: {},
                  events: {
                    onClick: {
                      trigger: 'onClick',
                      actions: [
                        {
                          type: 'Fetch',
                          api: 'my-api',
                          inputs: {},
                          onSuccess: { actions: [] },
                          onError: { actions: [] },
                        },
                      ],
                    },
                  },
                },
              },
              formulas: {},
              apis: {
                'my-api': {
                  name: 'my-api',
                  type: 'http',
                  version: 2,
                  autoFetch: valueFormula(false),
                  inputs: {},
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceApiRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should not detect APIs when the API data is referenced in its events', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            'new-test': {
              apis: {
                'Weather API': {
                  url: {
                    type: 'value',
                    value: 'https://nordcraft.com',
                  },
                  name: 'Weather API',
                  path: {
                    XYex4RxpjHs7jsyZx9223: {
                      index: 0,
                      formula: valueFormula('_api'),
                    },
                    jY2URy9JhngGEewv_CjGI: {
                      index: 1,
                      formula: valueFormula('weather'),
                    },
                  },
                  type: 'http',
                  client: {
                    parserMode: 'auto',
                    onCompleted: {
                      actions: [
                        {
                          name: '@toddle/logToConsole',
                          arguments: [
                            {
                              name: 'Label',
                              formula: valueFormula(''),
                            },
                            {
                              name: 'Data',
                              formula: pathFormula(['Event']),
                            },
                          ],
                          label: 'Log to console',
                        },
                      ],
                      trigger: 'success',
                    },
                  },
                  inputs: {},
                  method: ApiMethod.GET,
                  server: {
                    ssr: {
                      enabled: {
                        formula: valueFormula(false),
                      },
                    },
                    proxy: {
                      enabled: {
                        formula: valueFormula(false),
                      },
                    },
                  },
                  headers: {},
                  version: 2,
                  autoFetch: {
                    type: 'value',
                    value: true,
                  },
                  queryParams: {},
                  redirectRules: {},
                },
              },
              name: 'new-test',
              nodes: {},
              events: [],
              onLoad: null,
              formulas: {},
              variables: {
                Untitled: {
                  initialValue: {
                    type: 'value',
                    value: null,
                  },
                },
              },
              attributes: {},
            },
          },
        },
        rules: [noReferenceApiRule],
      }),
    )

    expect(problems).toEqual([])
  })

  test('should list API as unused if the event reference is in a child action in an API event', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            'new-test': {
              apis: {
                'Weather API': {
                  url: {
                    type: 'value',
                    value: 'https://nordcraft.com',
                  },
                  name: 'Weather API',
                  path: {
                    XYex4RxpjHs7jsyZx9223: {
                      index: 0,
                      formula: valueFormula('_api'),
                    },
                    jY2URy9JhngGEewv_CjGI: {
                      index: 1,
                      formula: valueFormula('weather'),
                    },
                  },
                  type: 'http',
                  client: {
                    parserMode: 'auto',
                    onCompleted: {
                      actions: [
                        {
                          name: '@toddle/setCookie',
                          arguments: [
                            {
                              name: 'Name',
                              formula: null,
                            },
                            {
                              name: 'Value',
                              formula: valueFormula(''),
                            },
                            {
                              name: 'Expires in',
                              formula: valueFormula(null),
                            },
                            {
                              name: 'SameSite',
                              formula: valueFormula(null),
                            },
                            {
                              name: 'Path',
                              formula: valueFormula(null),
                            },
                            {
                              name: 'Include Subdomains',
                              formula: valueFormula(null),
                            },
                          ],
                          label: 'Set cookie',
                          events: {
                            Success: {
                              actions: [
                                {
                                  name: '@toddle/logToConsole',
                                  arguments: [
                                    {
                                      name: 'Label',
                                      formula: valueFormula('test'),
                                    },
                                    {
                                      name: 'Data',
                                      formula: pathFormula(['Event']),
                                    },
                                  ],
                                  label: 'Log to console',
                                },
                              ],
                            },
                            Error: {
                              actions: [],
                            },
                          },
                        },
                      ],
                      trigger: 'success',
                    },
                  },
                  inputs: {},
                  method: ApiMethod.GET,
                  server: {
                    ssr: {
                      enabled: {
                        formula: valueFormula(true),
                      },
                    },
                    proxy: {
                      enabled: {
                        formula: valueFormula(true),
                      },
                    },
                  },
                  headers: {},
                  version: 2,
                  autoFetch: valueFormula(false),
                  queryParams: {},
                  redirectRules: {},
                },
              },
              name: 'new-test',
              nodes: {},
              events: [],
              onLoad: null,
              formulas: {},
              variables: {
                Untitled: {
                  initialValue: valueFormula(null),
                },
              },
              attributes: {},
            },
          },
        },
        rules: [noReferenceApiRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference api')
    expect(problems[0].path).toEqual([
      'components',
      'new-test',
      'apis',
      'Weather API',
    ])
  })
})

describe('fix noReferenceApiRule', () => {
  test('should remove unused APIs', () => {
    const project: ProjectFiles = {
      formulas: {},
      components: {
        apiComponent: {
          name: 'test',
          nodes: {},
          formulas: {},
          apis: {
            'my-legacy-api': {
              name: 'my-legacy-api',
              type: 'REST',
              autoFetch: valueFormula(false),
              onCompleted: null,
              onFailed: null,
            },
            'my-api': {
              name: 'my-api',
              type: 'http',
              version: 2,
              autoFetch: valueFormula(false),
              inputs: {},
              '@nordcraft/metadata': {
                comments: null,
              },
            },
            'used-api': {
              name: 'used-api',
              type: 'http',
              version: 2,
              autoFetch: valueFormula(false),
              inputs: {},
            },
          },
          onLoad: {
            trigger: 'onLoad',
            actions: [
              {
                type: 'Fetch',
                api: 'used-api',
                inputs: {},
                onSuccess: { actions: [] },
                onError: { actions: [] },
              },
            ],
          },
          attributes: {},
          variables: {},
        },
      },
    }
    const fixedProject = fixProject({
      files: project,
      rule: noReferenceApiRule,
      fixType: 'delete-api',
    })
    // 2/3 APIs should be removed
    expect(
      Object.keys(fixedProject.components['apiComponent']!.apis ?? {}),
    ).toEqual(['used-api'])
  })

  test('it should not report when an API has an autoFetch formula that is not false', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            apiComponent: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {
                'my-legacy-api': {
                  name: 'my-legacy-api',
                  type: 'REST',
                  autoFetch: valueFormula(false),
                  onCompleted: null,
                  onFailed: null,
                },
                'my-api': {
                  name: 'my-api',
                  type: 'http',
                  version: 2,
                  autoFetch: {
                    type: 'and',
                    arguments: [
                      {
                        formula: {
                          type: 'path',
                          path: ['some', 'path'],
                        },
                      },
                    ],
                  },
                  inputs: {},
                  '@nordcraft/metadata': {
                    comments: null,
                  },
                },
              },
              attributes: {},
              variables: {},
            },
          },
        },
        rules: [noReferenceApiRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-reference api')
    expect(problems[0].path).toEqual([
      'components',
      'apiComponent',
      'apis',
      'my-legacy-api',
    ])
  })
})
