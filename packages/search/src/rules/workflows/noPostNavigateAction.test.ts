import { searchProject } from '../../searchProject'
import { noPostNavigateAction } from './noPostNavigateAction'

import { describe, expect, test } from 'bun:test'
describe('noPostNavigateAction', () => {
  test('should detect actions after a url navigate action', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            nav: {
              attributes: {},
              events: [],
              formulas: {},
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  classes: {},
                  events: {},
                  children: ['wkPXF99C3qdRgZmUcnHO_'],
                  style: {},
                },
                wkPXF99C3qdRgZmUcnHO_: {
                  tag: 'button',
                  type: 'element',
                  attrs: {},
                  style: {
                    color: 'var(--grey-200, #E5E5E5)',
                    'border-radius': '6px',
                    'background-color': 'var(--blue-600, #2563EB)',
                    'padding-left': '8px',
                    'padding-right': '8px',
                    'padding-top': '8px',
                    'padding-bottom': '8px',
                    width: 'fit-content',
                    cursor: 'pointer',
                  },
                  events: {
                    click: {
                      trigger: 'click',
                      actions: [
                        {
                          name: '@toddle/gotToURL',
                          arguments: [
                            {
                              name: 'URL',
                              formula: {
                                type: 'value',
                                value: 'https://example.com',
                              },
                            },
                          ],
                          label: 'Go to URL',
                        },
                        {
                          name: '@toddle/logToConsole',
                          arguments: [
                            {
                              name: 'Label',
                              formula: {
                                type: 'value',
                                value: '',
                              },
                            },
                            {
                              name: 'Data',
                              formula: {
                                type: 'value',
                                value: '<Data>',
                              },
                            },
                          ],
                          label: 'Log to console',
                        },
                      ],
                    },
                  },
                  classes: {},
                  children: ['zFhmZR6YnLy089HmlK-Yn'],
                  variants: [],
                },
                'zFhmZR6YnLy089HmlK-Yn': {
                  type: 'text',
                  value: {
                    type: 'value',
                    value: 'Button',
                  },
                },
              },
              variables: {},
              apis: {},
              name: 'nav',
            },
          },
        },
        rules: [noPostNavigateAction],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no post navigate action')
    expect(problems[0].path).toEqual([
      'components',
      'nav',
      'nodes',
      'wkPXF99C3qdRgZmUcnHO_',
      'events',
      'click',
      'actions',
      '0',
    ])
  })
  test('should detect workflow actions after a url navigate action', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            nav: {
              attributes: {},
              events: [],
              formulas: {},
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  classes: {},
                  events: {},
                  children: [],
                  style: {},
                },
              },
              variables: {},
              apis: {},
              name: 'nav2',
              workflows: {
                RGyFQC: {
                  parameters: [],
                  name: 'Navigate',
                  actions: [
                    {
                      name: '@toddle/gotToURL',
                      arguments: [
                        {
                          name: 'URL',
                          formula: {
                            type: 'value',
                            value: 'https://example.com',
                          },
                        },
                      ],
                      label: 'Go to URL',
                    },
                    {
                      name: '@toddle/logToConsole',
                      arguments: [
                        {
                          name: 'Label',
                          formula: {
                            type: 'value',
                            value: 'test',
                          },
                        },
                        {
                          name: 'Data',
                          formula: {
                            type: 'value',
                            value: '<Data>',
                          },
                        },
                      ],
                      label: 'Log to console',
                    },
                  ],
                  exposeInContext: false,
                },
              },
            },
          },
        },
        rules: [noPostNavigateAction],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no post navigate action')
    expect(problems[0].path).toEqual([
      'components',
      'nav',
      'workflows',
      'RGyFQC',
      'actions',
      '0',
    ])
  })
  test('should detect onLoad actions after a url navigate action', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            nav: {
              attributes: {},
              onLoad: {
                trigger: 'Load',
                actions: [
                  {
                    name: '@toddle/gotToURL',
                    arguments: [
                      {
                        name: 'URL',
                        formula: {
                          type: 'value',
                          value: 'https://example.com',
                        },
                      },
                    ],
                    label: 'Go to URL',
                  },
                  {
                    name: '@toddle/logToConsole',
                    arguments: [
                      {
                        name: 'Label',
                        formula: {
                          type: 'value',
                          value: '',
                        },
                      },
                      {
                        name: 'Data',
                        formula: {
                          type: 'value',
                          value: '<Data>',
                        },
                      },
                    ],
                    label: 'Log to console',
                  },
                ],
              },
              events: [],
              formulas: {},
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  classes: {},
                  events: {},
                  children: [],
                  style: {},
                },
              },
              variables: {},
              apis: {},
              name: 'nav2',
              workflows: {},
            },
          },
        },
        rules: [noPostNavigateAction],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no post navigate action')
    expect(problems[0].path).toEqual([
      'components',
      'nav',
      'onLoad',
      'actions',
      '0',
    ])
  })
  test('should not report issues if navigate is the last action', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            nav: {
              attributes: {},
              events: [],
              formulas: {},
              workflows: {
                RGyFQC: {
                  parameters: [],
                  name: 'Navigate',
                  actions: [
                    {
                      name: '@toddle/logToConsole',
                      arguments: [
                        {
                          name: 'Label',
                          formula: {
                            type: 'value',
                            value: 'test',
                          },
                        },
                        {
                          name: 'Data',
                          formula: {
                            type: 'value',
                            value: '<Data>',
                          },
                        },
                      ],
                      label: 'Log to console',
                    },
                    {
                      name: '@toddle/gotToURL',
                      arguments: [
                        {
                          name: 'URL',
                          formula: {
                            type: 'value',
                            value: 'https://example.com',
                          },
                        },
                      ],
                      label: 'Go to URL',
                    },
                  ],
                  exposeInContext: false,
                },
              },
              onLoad: {
                trigger: 'Load',
                actions: [
                  {
                    name: '@toddle/logToConsole',
                    arguments: [
                      {
                        name: 'Label',
                        formula: {
                          type: 'value',
                          value: '',
                        },
                      },
                      {
                        name: 'Data',
                        formula: {
                          type: 'value',
                          value: '<Data>',
                        },
                      },
                    ],
                    label: 'Log to console',
                  },
                  {
                    name: '@toddle/gotToURL',
                    arguments: [
                      {
                        name: 'URL',
                        formula: {
                          type: 'value',
                          value: 'https://example.com',
                        },
                      },
                    ],
                    label: 'Go to URL',
                  },
                ],
              },
              nodes: {
                root: {
                  type: 'element',
                  tag: 'div',
                  attrs: {},
                  classes: {},
                  events: {},
                  children: ['wkPXF99C3qdRgZmUcnHO_'],
                  style: {},
                },
                wkPXF99C3qdRgZmUcnHO_: {
                  tag: 'button',
                  type: 'element',
                  attrs: {},
                  style: {
                    color: 'var(--grey-200, #E5E5E5)',
                    'border-radius': '6px',
                    'background-color': 'var(--blue-600, #2563EB)',
                    'padding-left': '8px',
                    'padding-right': '8px',
                    'padding-top': '8px',
                    'padding-bottom': '8px',
                    width: 'fit-content',
                    cursor: 'pointer',
                  },
                  events: {
                    click: {
                      trigger: 'click',
                      actions: [
                        {
                          name: '@toddle/logToConsole',
                          arguments: [
                            {
                              name: 'Label',
                              formula: {
                                type: 'value',
                                value: '',
                              },
                            },
                            {
                              name: 'Data',
                              formula: {
                                type: 'value',
                                value: '<Data>',
                              },
                            },
                          ],
                          label: 'Log to console',
                        },
                        {
                          name: '@toddle/gotToURL',
                          arguments: [
                            {
                              name: 'URL',
                              formula: {
                                type: 'value',
                                value: 'https://example.com',
                              },
                            },
                          ],
                          label: 'Go to URL',
                        },
                      ],
                    },
                  },
                  classes: {},
                  children: ['zFhmZR6YnLy089HmlK-Yn'],
                  variants: [],
                },
                'zFhmZR6YnLy089HmlK-Yn': {
                  type: 'text',
                  value: {
                    type: 'value',
                    value: 'Button',
                  },
                },
              },
              variables: {},
              apis: {},
              name: 'nav',
            },
          },
        },
        rules: [noPostNavigateAction],
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
