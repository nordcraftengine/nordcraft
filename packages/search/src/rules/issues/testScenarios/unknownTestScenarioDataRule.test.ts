import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import type { IssueResult } from '../../../types'
import { unknownTestScenarioDataRule } from './unknownTestScenarioDataRule'

describe('unknownTestScenarioDataRule', () => {
  test('should detect unknown attribute in test scenario', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myComp: {
              name: 'myComp',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {
                validAttr: { name: 'validAttr', testValue: 'ok' },
              },
              variables: {},
              meta: {
                testScenarios: {
                  default: {
                    attributes: {
                      validAttr: 'ok',
                      unknownAttr: 'broken',
                    },
                  },
                },
              },
            },
          },
        },
        rules: [unknownTestScenarioDataRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown test scenario data')
    expect(problems[0].path).toEqual([
      'components',
      'myComp',
      'meta',
      'testScenarios',
      'default',
      'attributes',
      'unknownAttr',
    ])
  })

  test('should detect unknown variable in test scenario', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myComp: {
              name: 'myComp',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {
                validVar: { initialValue: { type: 'value', value: 1 } },
              },
              meta: {
                testScenarios: {
                  default: {
                    variables: {
                      validVar: 2,
                      unknownVar: 3,
                    },
                  },
                },
              },
            },
          },
        },
        rules: [unknownTestScenarioDataRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('unknown test scenario data')
    expect(problems[0].path).toEqual([
      'components',
      'myComp',
      'meta',
      'testScenarios',
      'default',
      'variables',
      'unknownVar',
    ])
  })

  test('should detect unknown API in test scenario', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myComp: {
              name: 'myComp',
              nodes: {},
              formulas: {},
              apis: {
                validApi: {
                  name: 'validApi',
                  type: 'http',
                  version: 2,
                  autoFetch: { type: 'value', value: false },
                  inputs: {},
                  url: { type: 'value', value: 'https://example.com' },
                },
              },
              attributes: {},
              variables: {},
              meta: {
                testScenarios: {
                  default: {
                    apis: {
                      validApi: { data: null, isLoading: false, error: null },
                      unknownApi: { data: null, isLoading: false, error: null },
                    },
                  },
                },
              },
            },
          },
        },
        rules: [unknownTestScenarioDataRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect((problems[0] as IssueResult).code).toBe('unknown test scenario data')
    expect(problems[0].path).toEqual([
      'components',
      'myComp',
      'meta',
      'testScenarios',
      'default',
      'apis',
      'unknownApi',
    ])
  })

  test('should detect unknown path parameter in test scenario when route exists', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myPage: {
              name: 'myPage',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              route: {
                path: [
                  { type: 'static', name: 'users' },
                  { type: 'param', name: 'userId', testValue: '123' },
                ],
                query: {},
              },
              meta: {
                testScenarios: {
                  default: {
                    path: {
                      userId: '456',
                      users: 'invalidStaticSegment',
                      unknownParam: '789',
                    },
                  },
                },
              },
            },
          },
        },
        rules: [unknownTestScenarioDataRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems.map((p) => p.path)).toEqual([
      [
        'components',
        'myPage',
        'meta',
        'testScenarios',
        'default',
        'path',
        'users',
      ],
      [
        'components',
        'myPage',
        'meta',
        'testScenarios',
        'default',
        'path',
        'unknownParam',
      ],
    ])
  })

  test('should detect path parameter when component has no route', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myComp: {
              name: 'myComp',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              meta: {
                testScenarios: {
                  default: {
                    path: {
                      userId: '123',
                    },
                  },
                },
              },
            },
          },
        },
        rules: [unknownTestScenarioDataRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].path).toEqual([
      'components',
      'myComp',
      'meta',
      'testScenarios',
      'default',
      'path',
      'userId',
    ])
  })

  test('should detect unknown query parameter in test scenario', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myPage: {
              name: 'myPage',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              route: {
                path: [],
                query: {
                  filter: { name: 'filter', testValue: 'all' },
                },
              },
              meta: {
                testScenarios: {
                  default: {
                    query: {
                      filter: 'active',
                      unknownQuery: 'value',
                    },
                  },
                },
              },
            },
          },
        },
        rules: [unknownTestScenarioDataRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].path).toEqual([
      'components',
      'myPage',
      'meta',
      'testScenarios',
      'default',
      'query',
      'unknownQuery',
    ])
  })

  test('should detect query parameter when component has no route', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myComp: {
              name: 'myComp',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              meta: {
                testScenarios: {
                  default: {
                    query: {
                      filter: 'active',
                    },
                  },
                },
              },
            },
          },
        },
        rules: [unknownTestScenarioDataRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].path).toEqual([
      'components',
      'myComp',
      'meta',
      'testScenarios',
      'default',
      'query',
      'filter',
    ])
  })

  test('should not report when all data references are valid', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {
            myPage: {
              name: 'myPage',
              nodes: {},
              formulas: {},
              apis: {
                getUser: {
                  name: 'getUser',
                  type: 'http',
                  version: 2,
                  autoFetch: { type: 'value', value: false },
                  inputs: {},
                  url: { type: 'value', value: 'https://example.com' },
                },
              },
              attributes: {
                theme: { name: 'theme', testValue: 'dark' },
              },
              variables: {
                count: { initialValue: { type: 'value', value: 0 } },
              },
              route: {
                path: [{ type: 'param', name: 'id', testValue: '1' }],
                query: {
                  sort: { name: 'sort', testValue: 'asc' },
                },
              },
              meta: {
                testScenarios: {
                  default: {
                    attributes: {
                      theme: 'light',
                    },
                    variables: {
                      count: 10,
                    },
                    apis: {
                      getUser: { data: null, isLoading: false, error: null },
                    },
                    path: {
                      id: '2',
                    },
                    query: {
                      sort: 'desc',
                    },
                  },
                },
              },
            },
          },
        },
        rules: [unknownTestScenarioDataRule],
      }),
    )

    expect(problems).toBeEmpty()
  })

  test('should fix unknown test scenario data by deleting the reference', () => {
    const files = {
      components: {
        myComp: {
          name: 'myComp',
          nodes: {},
          formulas: {},
          apis: {},
          attributes: {
            validAttr: { name: 'validAttr', testValue: 'ok' },
          },
          variables: {},
          meta: {
            testScenarios: {
              default: {
                attributes: {
                  validAttr: 'ok',
                  unknownAttr: 'broken',
                },
              },
            },
          },
        },
      },
    }

    const updatedFiles = fixProject({
      files,
      rule: unknownTestScenarioDataRule,
      fixType: 'delete-test-scenario-reference',
    })

    expect(
      updatedFiles.components?.myComp?.meta?.testScenarios?.default?.attributes,
    ).toEqual({
      validAttr: 'ok',
    })
  })
})
