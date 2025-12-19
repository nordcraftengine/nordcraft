import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { invalidComponentStructureRule } from './invalidComponentStructureRule'

describe('detect invalidComponentStructureRule', () => {
  test('should detect invalid components', () => {
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: {
            invalidComponent: {
              name: 45 as any,
              nodes: [] as any,
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              route: {
                info: {},
                path: [],
                query: {},
              },
            },
          },
        },
        rules: [invalidComponentStructureRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('invalid component structure')
    expect(problems[0].path).toEqual(['components', 'invalidComponent', 'name'])
    expect(problems[1].code).toBe('invalid component structure')
    expect(problems[1].path).toEqual([
      'components',
      'invalidComponent',
      'nodes',
    ])
  })
  test('should detect issues in large component', () => {
    const start = performance.now()
    const problems = Array.from(
      searchProject({
        files: {
          formulas: {},
          components: { largeComponent: largeComponent as any },
        },
        rules: [invalidComponentStructureRule],
      }),
    )
    const end = performance.now()
    console.log(`Validation of large component took ${end - start} ms`)
    console.log(problems)

    expect(problems).toHaveLength(2)
  })
})
describe('fix invalidComponentStructureRule', () => {
  test('should fix invalid components', () => {
    const project = {
      files: {
        formulas: {},
        components: {
          invalidComponent: {
            name: 45 as any,
            nodes: {},
            formulas: {},
            apis: {},
            attributes: {},
            variables: {},
            route: {
              info: {},
              path: [],
              query: {},
            },
          },
        },
      },
      rules: [invalidComponentStructureRule],
    }
    const fixedProject = fixProject({
      files: project.files,
      rule: invalidComponentStructureRule,
      fixType: 'change-data-type',
    })
    expect(fixedProject.components.invalidComponent!.name).toBe('45')
  })
})

const largeComponent = {
  key: 'graphql-tree-item',
  apis: {},
  name: 'graphql-tree-item-args',
  nodes: {
    root: {
      tag: 'div',
      type: 'element',
      attrs: {},
      style: {
        width: '100%',
        'row-gap': '4px',
        'min-width': 'fit-content',
        'column-gap': '4px',
        'border-top-left-radius': '6px',
        'border-top-right-radius': '6px',
        'border-bottom-left-radius': '6px',
        'border-bottom-right-radius': '6px',
      },
      events: {
        contextmenu: {
          actions: [
            {
              name: '@toddle/preventDefault',
              label: 'Prevent default',
              arguments: [],
            },
          ],
          trigger: 'contextmenu',
        },
      },
      classes: {
        focused: {
          formula: {
            path: ['Variables', 'Is focused'],
            type: 'path',
          },
        },
      },
      children: ['7rGBuqzbChpGZczSdAK4_', '1F4P4wRsu_4eCD-ZszGCI'],
      variants: [
        {
          style: {
            background: 'var(--grey-800)',
          },
          className: 'focused',
        },
      ],
      condition: null,
      styleVariables: {},
      'style-variables': [],
    },
    '1F4P4wRsu_4eCD-ZszGCI': {
      name: 'graphql-tree-item-provider',
      type: 'component',
      attrs: {
        'parent-id': {
          path: ['Variables', 'Button id'],
          type: 'path',
        },
        'children-container-id': {
          path: ['Variables', 'Children container id'],
          type: 'path',
        },
      },
      events: {
        'On delegate focus': {
          actions: [
            {
              data: {
                path: ['Event', 'unfocusableItemIds'],
                type: 'path',
              },
              type: 'SetVariable',
              variable: 'Unfocusable item ids',
            },
            {
              type: 'Switch',
              cases: [
                {
                  actions: [
                    {
                      type: 'TriggerWorkflow',
                      workflow: 'ItqM9k',
                      parameters: null,
                    },
                  ],
                  condition: {
                    path: ['Event', 'isFocusingParent'],
                    type: 'path',
                    label: 'Should focus parent',
                  },
                },
              ],
              default: {
                actions: [
                  {
                    type: 'TriggerWorkflow',
                    workflow: 'ep1mW7',
                    parameters: null,
                  },
                ],
              },
            },
          ],
          trigger: 'On delegate focus',
        },
        'On update children': {
          actions: [
            {
              type: 'TriggerWorkflow',
              workflow: 'eXmVSw',
              parameters: null,
            },
          ],
          trigger: 'On update children',
        },
      },
      children: ['WC5Y9OSpocus5HA3hPrzZ'],
      condition: {
        name: '@toddle/greaterThan',
        type: 'function',
        arguments: [
          {
            name: 'First',
            type: {
              type: 'Number',
            },
            formula: {
              name: '@toddle/size',
              type: 'function',
              arguments: [
                {
                  name: 'Collection',
                  type: {
                    type: 'Array \\| Object \\| String',
                  },
                  formula: {
                    path: ['Variables', 'Filtered children'],
                    type: 'path',
                  },
                },
              ],
              display_name: 'Size',
            },
          },
          {
            name: 'Second',
            type: {
              type: 'Number',
            },
            formula: {
              type: 'value',
              value: 0,
            },
          },
        ],
        display_name: 'Greater than',
      },
    },
    '2_C2nCrHDbNfXJbZawa1U': {
      tag: 'span',
      type: 'element',
      attrs: {},
      style: {
        color: 'inherit',
        width: '100%',
        height: '100%',
        display: 'flex',
        'font-size': 'inherit',
        'align-items': 'center',
        'font-family': 'inherit',
        'font-weight': 'inherit',
        'justify-content': 'center',
        'border-top-left-radius': '6px',
        'border-top-right-radius': '6px',
        'border-bottom-left-radius': '6px',
        'border-bottom-right-radius': '6px',
      },
      events: {},
      classes: {},
      children: ['qxccwXlOmZh0K_e7bZxRG'],
      variants: [],
      condition: null,
      styleVariables: {},
      'style-variables': [],
    },
    '3ahwOmpRf71-oxvqer7Rp': {
      name: 'graphql-tree-item-popover',
      type: 'component',
      attrs: {
        data: {
          path: ['Attributes', 'data'],
          type: 'path',
        },
        open: {
          path: ['Variables', 'Is popover open'],
          type: 'path',
        },
        path: {
          name: 'wKA68w',
          type: 'apply',
          arguments: [],
        },
        'is-argument': {
          type: 'value',
          value: true,
        },
      },
      events: {
        'On click outside': {
          actions: [
            {
              type: 'TriggerWorkflow',
              workflow: 'oke_SW',
              parameters: {
                isOpen: {
                  formula: {
                    type: 'value',
                    value: false,
                  },
                },
              },
            },
          ],
          trigger: 'On click outside',
        },
        'On change argument': {
          actions: [
            {
              type: 'TriggerWorkflow',
              workflow: 'oke_SW',
              parameters: {
                isOpen: {
                  formula: {
                    type: 'value',
                    value: false,
                  },
                },
              },
            },
            {
              type: 'TriggerWorkflow',
              workflow: 'osJJfp',
              parameters: null,
            },
            {
              type: 'TriggerWorkflow',
              workflow: 'eXmVSw',
              parameters: null,
            },
          ],
          trigger: 'On change argument',
        },
        'On delete argument': {
          actions: [
            {
              type: 'TriggerWorkflow',
              workflow: 'oke_SW',
              parameters: {
                isOpen: {
                  formula: {
                    type: 'value',
                    value: false,
                  },
                },
              },
            },
            {
              type: 'Switch',
              cases: [
                {
                  actions: [
                    {
                      type: 'TriggerWorkflow',
                      workflow: 'osJJfp',
                      parameters: null,
                    },
                  ],
                  condition: {
                    name: '@toddle/includes',
                    type: 'function',
                    label: 'Should focus self',
                    arguments: [
                      {
                        name: 'Array',
                        type: {
                          type: 'Array \\| String',
                        },
                        formula: {
                          path: [
                            'Contexts',
                            'graphql-state-provider',
                            'X5xC69',
                          ],
                          type: 'path',
                        },
                      },
                      {
                        name: 'Item',
                        type: {
                          type: 'Any',
                        },
                        formula: {
                          path: ['Attributes', 'parent-path'],
                          type: 'path',
                        },
                      },
                    ],
                    display_name: 'Includes',
                  },
                },
              ],
              default: {
                actions: [
                  {
                    type: 'TriggerWorkflow',
                    workflow: 'ep1mW7',
                    parameters: {
                      isRemovingRoot: {
                        formula: null,
                      },
                    },
                  },
                ],
              },
            },
          ],
          trigger: 'On delete argument',
        },
        'On escape key down': {
          actions: [
            {
              key: 'stopEventPropagation',
              name: 'stopEventPropagation',
              version: 2,
              arguments: [
                {
                  name: 'event',
                  type: {
                    type: 'Unknown',
                  },
                  formula: {
                    path: ['Event'],
                    type: 'path',
                  },
                },
              ],
              description: 'Stops the propagation of an event',
            },
            {
              type: 'TriggerWorkflow',
              workflow: 'oke_SW',
              parameters: {
                isOpen: {
                  formula: {
                    type: 'value',
                    value: false,
                  },
                },
              },
            },
            {
              type: 'TriggerWorkflow',
              workflow: 'osJJfp',
              parameters: null,
            },
          ],
          trigger: 'On escape key down',
        },
      },
      repeat: null,
      children: ['ONqhMEc-5YCPpUaR_qY1V'],
    },
    '7p4h_wDGONZ69jV-qlQbt': {
      name: 'IconCaretRight',
      type: 'component',
      attrs: {
        size: {
          type: 'value',
          value: 16,
        },
      },
      style: {},
      events: {},
      repeat: null,
      children: [],
      condition: null,
    },
    '7rGBuqzbChpGZczSdAK4_': {
      name: 'graphql-tree-item-context-menu',
      type: 'component',
      attrs: {
        'show-expand': {
          name: '_hqUE3',
          type: 'apply',
          arguments: [],
        },
        'show-collapse': {
          name: '9th4ws',
          type: 'apply',
          arguments: [],
        },
        'show-add-value': {
          name: '@toddle/not',
          type: 'function',
          arguments: [
            {
              name: 'Input',
              type: {
                type: 'Boolean',
              },
              formula: {
                name: 'UW0wlh',
                type: 'apply',
                arguments: [],
              },
            },
          ],
          display_name: 'Not',
        },
        'show-clear-value': {
          name: 'UW0wlh',
          type: 'apply',
          arguments: [],
        },
        'show-change-value': {
          name: 'UW0wlh',
          type: 'apply',
          arguments: [],
        },
      },
      events: {
        Expand: {
          actions: [
            {
              type: 'TriggerWorkflow',
              workflow: 'p373Ni',
              parameters: {
                path: {
                  formula: {
                    name: 'wKA68w',
                    type: 'apply',
                    arguments: [],
                  },
                },
              },
              contextProvider: 'graphql-state-provider',
            },
          ],
          trigger: 'Expand',
        },
        Collapse: {
          actions: [
            {
              type: 'TriggerWorkflow',
              workflow: 'UxJ9O0',
              parameters: {
                path: {
                  formula: {
                    name: 'wKA68w',
                    type: 'apply',
                    arguments: [],
                  },
                },
              },
              contextProvider: 'graphql-state-provider',
            },
          ],
          trigger: 'Collapse',
        },
        'Show docs': {
          actions: [
            {
              type: 'TriggerWorkflow',
              workflow: '9vhWUB',
              parameters: null,
            },
          ],
          trigger: 'Show docs',
        },
        'Clear value': {
          actions: [
            {
              type: 'TriggerWorkflow',
              workflow: 'BJE_8t',
              parameters: null,
            },
          ],
          trigger: 'Clear value',
        },
        'Change value': {
          actions: [
            {
              type: 'TriggerWorkflow',
              workflow: 'oke_SW',
              parameters: {
                isOpen: {
                  formula: {
                    type: 'value',
                    value: true,
                  },
                },
              },
            },
          ],
          trigger: 'Change value',
        },
      },
      children: ['F7YnR8MN3WhuRfwD0eHcX'],
    },
    '9C58fsphqc046rwCv1Rxx': {
      type: 'text',
      value: {
        name: '@toddle/concatenate',
        type: 'function',
        arguments: [
          {
            name: '0',
            type: {
              type: 'Array \\| String',
            },
            formula: {
              path: ['Attributes', 'data', 'name'],
              type: 'path',
            },
          },
          {
            name: '0',
            type: {
              type: 'Array \\| String',
            },
            formula: {
              type: 'switch',
              cases: [
                {
                  formula: {
                    type: 'value',
                    value: ':',
                  },
                  condition: {
                    type: 'and',
                    arguments: [
                      {
                        formula: {
                          name: '-hDJX8',
                          type: 'apply',
                          arguments: [],
                        },
                      },
                      {
                        formula: {
                          name: '@toddle/not',
                          type: 'function',
                          arguments: [
                            {
                              name: 'Input',
                              type: {
                                type: 'Boolean',
                              },
                              formula: {
                                name: 'yitqmv',
                                type: 'apply',
                                arguments: [],
                              },
                            },
                          ],
                          display_name: 'Not',
                        },
                      },
                    ],
                  },
                },
              ],
              default: {
                type: 'value',
                value: null,
              },
            },
          },
        ],
        display_name: 'Concatenate',
        variableArguments: true,
      },
    },
    E6pYr9CtBPOHyn7zk1OA7: {
      name: 'ui-typography-paragraph',
      type: 'component',
      attrs: {},
      style: {
        color: 'var(--argument-value-color)',
      },
      events: {},
      repeat: null,
      children: ['ZVv4bVnmOfBR9RbqT3yyL'],
      condition: {
        name: 'UW0wlh',
        type: 'apply',
        arguments: [],
      },
    },
    F7YnR8MN3WhuRfwD0eHcX: {
      tag: 'div',
      slot: 'trigger',
      type: 'element',
      attrs: {},
      style: {
        color: 'var(--font-color)',
        'padding-left': 'var(--tree-item-indent)',
        'flex-direction': 'row',
        'border-top-left-radius': '6px',
        'border-top-right-radius': '6px',
        'border-bottom-left-radius': '6px',
        'border-bottom-right-radius': '6px',
      },
      events: {
        click: {
          actions: [
            {
              name: '@toddle/stopPropagation',
              label: 'Stop propagation',
              arguments: [],
            },
            {
              type: 'TriggerWorkflow',
              workflow: 'osJJfp',
              parameters: null,
            },
          ],
          trigger: 'click',
        },
      },
      classes: {
        focused: {
          formula: {
            path: ['Variables', 'Is focused'],
            type: 'path',
          },
        },
      },
      children: [
        'UUxWEKeSq_Mrgu8pzdQxw',
        'YoMkaiorEr_qYBMOmzRBL',
        '3ahwOmpRf71-oxvqer7Rp',
      ],
      variants: [
        {
          hover: true,
          style: {
            color: 'var(--grey-200)',
            background: 'var(--grey-700)',
          },
        },
        {
          style: {
            color: 'var(--grey-200)',
            background: 'var(--blue-600)',
          },
          className: 'focused',
        },
      ],
      'style-variables': [
        {
          name: 'tree-item-indent',
          unit: 'px',
          formula: {
            path: ['Attributes', 'indent'],
            type: 'path',
          },
          category: 'spacing',
        },
        {
          name: 'font-color',
          unit: '',
          formula: {
            type: 'switch',
            cases: [
              {
                formula: {
                  type: 'value',
                  value: 'var(--green-400)',
                },
                condition: {
                  type: 'or',
                  arguments: [
                    {
                      formula: {
                        name: 'EIavcM',
                        type: 'apply',
                        arguments: [],
                      },
                    },
                    {
                      formula: {
                        name: 'UW0wlh',
                        type: 'apply',
                        arguments: [],
                      },
                    },
                    {
                      formula: {
                        name: '3dwLiH',
                        type: 'apply',
                        arguments: [],
                      },
                    },
                  ],
                },
              },
            ],
            default: {
              type: 'value',
              value: 'var(--grey-400)',
            },
          },
          category: 'color',
        },
        {
          name: 'argument-value-color',
          unit: '',
          formula: {
            type: 'switch',
            cases: [
              {
                formula: {
                  type: 'value',
                  value: 'var(--teal-300)',
                },
                condition: {
                  type: 'and',
                  arguments: [
                    {
                      formula: {
                        name: '@toddle/includes',
                        type: 'function',
                        arguments: [
                          {
                            name: 'Array',
                            type: {
                              type: 'Array \\| String',
                            },
                            formula: {
                              name: 'graphqlGetArgumentValue',
                              type: 'function',
                              arguments: [
                                {
                                  name: 'queryAst',
                                  type: {
                                    type: 'Unknown',
                                  },
                                  formula: {
                                    path: [
                                      'Contexts',
                                      'graphql-content-provider',
                                      'U_nROu',
                                    ],
                                    type: 'path',
                                  },
                                },
                                {
                                  name: 'path',
                                  type: {
                                    type: 'String',
                                  },
                                  formula: {
                                    name: 'wKA68w',
                                    type: 'apply',
                                    arguments: [],
                                  },
                                },
                              ],
                            },
                          },
                          {
                            name: 'Item',
                            type: {
                              type: 'Any',
                            },
                            formula: {
                              type: 'value',
                              value: '$',
                            },
                          },
                        ],
                        display_name: 'Includes',
                      },
                    },
                    {
                      formula: {
                        name: '@toddle/not',
                        type: 'function',
                        arguments: [
                          {
                            name: 'Input',
                            type: {
                              type: 'Boolean',
                            },
                            formula: {
                              path: ['Variables', 'Is focused'],
                              type: 'path',
                            },
                          },
                        ],
                        display_name: 'Not',
                      },
                    },
                  ],
                },
              },
            ],
            default: {
              type: 'value',
              value: 'var(--grey-200)',
            },
          },
          category: 'color',
        },
        {
          name: 'argument-icon-color',
          unit: '',
          formula: {
            type: 'switch',
            cases: [
              {
                formula: {
                  type: 'value',
                  value: 'var(--grey-200)',
                },
                condition: {
                  type: 'and',
                  arguments: [
                    {
                      formula: {
                        path: ['Variables', 'Is focused'],
                        type: 'path',
                      },
                    },
                    {
                      formula: {
                        name: 'UW0wlh',
                        type: 'apply',
                        arguments: [],
                      },
                    },
                  ],
                },
              },
            ],
            default: {
              type: 'switch',
              cases: [
                {
                  formula: {
                    type: 'value',
                    value: 'var(--indigo-500)',
                  },
                  condition: {
                    name: 'UW0wlh',
                    type: 'apply',
                    arguments: [],
                  },
                },
              ],
              default: {
                type: 'value',
                value: 'var(--grey-400)',
              },
            },
          },
          category: 'color',
        },
      ],
    },
    'ONqhMEc-5YCPpUaR_qY1V': {
      name: 'graphql-button',
      type: 'component',
      attrs: {
        id: {
          path: ['Variables', 'Button id'],
          type: 'path',
        },
        role: {
          type: 'value',
          value: 'item',
        },
        size: {
          type: 'value',
          value: 'medium',
        },
      },
      style: {
        flex: '1',
        color: 'inherit',
        'padding-left': '0px',
      },
      events: {
        'On blur': {
          actions: [
            {
              data: {
                type: 'value',
                value: false,
              },
              type: 'SetVariable',
              variable: 'Is focused',
            },
          ],
          trigger: 'On blur',
        },
        'On focus': {
          actions: [
            {
              type: 'TriggerWorkflow',
              workflow: 'fLyCgA',
              parameters: null,
            },
          ],
          trigger: 'On focus',
        },
        'On key down': {
          actions: [
            {
              type: 'TriggerWorkflow',
              workflow: 'PRU77q',
              parameters: {
                code: {
                  formula: {
                    name: '@toddle/get',
                    type: 'function',
                    arguments: [
                      {
                        name: 'Object',
                        type: {
                          type: 'Array \\| Object \\| String',
                        },
                        formula: {
                          path: ['Event'],
                          type: 'path',
                        },
                      },
                      {
                        name: 'Path',
                        type: {
                          type: 'Array<String> \\| Number \\| String',
                        },
                        formula: {
                          type: 'value',
                          value: 'code',
                        },
                      },
                    ],
                    display_name: 'Get',
                  },
                },
                event: {
                  type: 'value',
                  formula: {
                    path: ['Event'],
                    type: 'path',
                  },
                },
              },
            },
          ],
          trigger: 'On key down',
        },
        'On mouse down': {
          actions: [
            {
              type: 'Switch',
              cases: [
                {
                  actions: [
                    {
                      type: 'TriggerWorkflow',
                      workflow: 'oke_SW',
                      parameters: {
                        isOpen: {
                          formula: {
                            type: 'value',
                            value: false,
                          },
                        },
                      },
                    },
                  ],
                  condition: {
                    path: ['Variables', 'Is popover open'],
                    type: 'path',
                    label: 'Should close popover',
                  },
                },
              ],
              default: {
                actions: [],
              },
            },
          ],
          trigger: 'On mouse down',
        },
        'On double click': {
          actions: [
            {
              type: 'TriggerWorkflow',
              workflow: 'PwrCCJ',
              parameters: null,
            },
          ],
          trigger: 'On double click',
        },
      },
      repeat: null,
      children: ['9C58fsphqc046rwCv1Rxx', 'E6pYr9CtBPOHyn7zk1OA7'],
      variants: [],
    },
    UUxWEKeSq_Mrgu8pzdQxw: {
      name: 'graphql-button',
      type: 'component',
      attrs: {
        size: {
          type: 'value',
          value: 'medium',
        },
        disabled: {
          name: '@toddle/not',
          type: 'function',
          arguments: [
            {
              name: 'Input',
              type: {
                type: 'Boolean',
              },
              formula: {
                name: 'p8Mgdl',
                type: 'apply',
                arguments: [],
              },
            },
          ],
          display_name: 'Not',
        },
      },
      style: {
        width: '32px',
        cursor: 'pointer',
      },
      events: {
        'On click': {
          actions: [
            {
              name: 'stopEventPropagation',
              version: 2,
              arguments: [
                {
                  name: 'event',
                  type: {
                    type: 'Unknown',
                  },
                  formula: {
                    path: ['Event'],
                    type: 'path',
                  },
                },
              ],
              description: 'Stops the propagation of an event',
            },
            {
              type: 'TriggerWorkflow',
              workflow: 's4fde_',
              parameters: null,
            },
          ],
          trigger: 'On click',
        },
      },
      repeat: null,
      children: ['_Z4NHO0xt-e3N-KQs6A9n'],
      variants: [
        {
          style: {
            color: 'var(--grey-400)',
            opacity: '1',
          },
          disabled: true,
        },
      ],
      condition: null,
    },
    WC5Y9OSpocus5HA3hPrzZ: {
      tag: 'ul',
      type: 'element',
      attrs: {
        id: {
          path: ['Variables', 'Children container id'],
          type: 'path',
        },
      },
      style: {
        'row-gap': '4px',
        'column-gap': '4px',
      },
      events: {},
      classes: {},
      children: ['paietVckXN6b82Udf7IEf'],
      condition: null,
    },
    YoMkaiorEr_qYBMOmzRBL: {
      name: 'graphql-button',
      type: 'component',
      attrs: {
        size: {
          type: 'value',
          value: 'medium',
        },
      },
      style: {
        color: 'var(--argument-icon-color)',
        width: '32px',
        cursor: 'pointer',
        'margin-left': '-8px',
      },
      events: {
        'On click': {
          actions: [
            {
              key: 'stopEventPropagation',
              name: 'stopEventPropagation',
              version: 2,
              arguments: [
                {
                  name: 'event',
                  type: {
                    type: 'Unknown',
                  },
                  formula: {
                    path: ['Event'],
                    type: 'path',
                  },
                },
              ],
              description: 'Stops the propagation of an event',
            },
            {
              type: 'Switch',
              cases: [
                {
                  actions: [
                    {
                      type: 'TriggerWorkflow',
                      workflow: 'oke_SW',
                      parameters: {
                        isOpen: {
                          formula: {
                            type: 'value',
                            value: true,
                          },
                        },
                      },
                    },
                  ],
                  condition: {
                    name: '@toddle/not',
                    type: 'function',
                    label: 'Should open popover',
                    arguments: [
                      {
                        name: 'Input',
                        type: {
                          type: 'Boolean',
                        },
                        formula: {
                          path: ['Variables', 'Is popover open'],
                          type: 'path',
                        },
                      },
                    ],
                    display_name: 'Not',
                  },
                },
              ],
              default: {
                actions: [
                  {
                    type: 'TriggerWorkflow',
                    workflow: 'oke_SW',
                    parameters: {
                      isOpen: {
                        formula: {
                          type: 'value',
                          value: false,
                        },
                      },
                    },
                  },
                ],
              },
            },
          ],
          trigger: 'On click',
        },
      },
      repeat: null,
      children: ['2_C2nCrHDbNfXJbZawa1U'],
      variants: [
        {
          hover: true,
          style: {},
        },
      ],
      condition: null,
    },
    ZVv4bVnmOfBR9RbqT3yyL: {
      type: 'text',
      value: {
        name: '@toddle/string',
        type: 'function',
        arguments: [
          {
            name: 'Input',
            type: {
              type: 'Any',
            },
            formula: {
              name: '-hDJX8',
              type: 'apply',
              arguments: [],
            },
          },
        ],
        display_name: 'String',
      },
    },
    '_Z4NHO0xt-e3N-KQs6A9n': {
      tag: 'span',
      type: 'element',
      attrs: {},
      style: {
        color: 'inherit',
        width: '16px',
        height: '16px',
        rotate: '0 0 1 0deg',
        display: 'flex',
        opacity: 'var(--disabled-opacity)',
        'font-size': 'inherit',
        transition: 'rotate 150ms ease  ',
        'align-items': 'center',
        'font-family': 'inherit',
        'font-weight': 'inherit',
        'justify-content': 'center',
      },
      events: {},
      classes: {
        open: {
          formula: {
            type: 'and',
            arguments: [
              {
                formula: {
                  name: '@toddle/includes',
                  type: 'function',
                  arguments: [
                    {
                      name: 'Array',
                      type: {
                        type: 'Array \\| String',
                      },
                      formula: {
                        path: ['Contexts', 'graphql-state-provider', 'X5xC69'],
                        type: 'path',
                      },
                    },
                    {
                      name: 'Item',
                      type: {
                        type: 'Any',
                      },
                      formula: {
                        name: 'wKA68w',
                        type: 'apply',
                        arguments: [],
                      },
                    },
                  ],
                  display_name: 'Includes',
                },
              },
              {
                formula: {
                  name: '@toddle/not',
                  type: 'function',
                  arguments: [
                    {
                      name: 'Input',
                      type: {
                        type: 'Boolean',
                      },
                      formula: {
                        name: 'DhJ7kv',
                        type: 'apply',
                        arguments: [],
                      },
                    },
                  ],
                  display_name: 'Not',
                },
              },
            ],
          },
        },
      },
      children: ['7p4h_wDGONZ69jV-qlQbt'],
      variants: [
        {
          style: {
            rotate: '0 0 1 90deg',
          },
          className: 'open',
        },
      ],
      styleVariables: {},
      'style-variables': [
        {
          name: 'disabled-opacity',
          unit: '',
          formula: {
            type: 'switch',
            cases: [
              {
                formula: {
                  type: 'value',
                  value: 0.3,
                },
                condition: {
                  name: '@toddle/not',
                  type: 'function',
                  arguments: [
                    {
                      name: 'Input',
                      type: {
                        type: 'Boolean',
                      },
                      formula: {
                        name: 'p8Mgdl',
                        type: 'apply',
                        arguments: [],
                      },
                    },
                  ],
                  display_name: 'Not',
                },
              },
            ],
            default: {
              type: 'value',
              value: 1,
            },
          },
          category: 'z-index',
        },
      ],
    },
    paietVckXN6b82Udf7IEf: {
      name: 'graphql-tree-item',
      type: 'component',
      attrs: {
        data: {
          path: ['ListItem', 'Item'],
          type: 'path',
        },
        indent: {
          name: '@toddle/add',
          type: 'function',
          arguments: [
            {
              name: '0',
              type: {
                type: 'Number',
              },
              formula: {
                path: ['Attributes', 'indent'],
                type: 'path',
              },
            },
            {
              name: '1',
              type: {
                type: 'Number',
              },
              formula: {
                type: 'value',
                value: 16,
              },
            },
          ],
          display_name: 'Add',
          variableArguments: true,
        },
        'parent-path': {
          name: 'wKA68w',
          type: 'apply',
          arguments: [],
        },
      },
      style: {},
      events: {},
      repeat: {
        path: ['Variables', 'Filtered children'],
        type: 'path',
      },
      children: [],
      condition: null,
      repeatKey: {
        name: 'eWTnAu',
        type: 'apply',
        arguments: [
          {
            name: 'parentPath',
            formula: {
              name: 'wKA68w',
              type: 'apply',
              arguments: [],
            },
            testValue: 'query',
          },
          {
            name: 'name',
            formula: {
              name: '@toddle/get',
              type: 'function',
              arguments: [
                {
                  name: 'Object',
                  type: {
                    type: 'Array \\| Object \\| String',
                  },
                  formula: {
                    path: ['ListItem', 'Item'],
                    type: 'path',
                  },
                },
                {
                  name: 'Path',
                  type: {
                    type: 'Array<String> \\| Number \\| String',
                  },
                  formula: {
                    type: 'value',
                    value: 'name',
                  },
                },
              ],
              display_name: 'Get',
            },
            testValue: 'alias:fieldName',
          },
          {
            name: 'key',
            formula: {
              name: '@toddle/get',
              type: 'function',
              arguments: [
                {
                  name: 'Object',
                  type: {
                    type: 'Array \\| Object \\| String',
                  },
                  formula: {
                    path: ['ListItem', 'Item'],
                    type: 'path',
                  },
                },
                {
                  name: 'Path',
                  type: {
                    type: 'Array<String> \\| Number \\| String',
                  },
                  formula: {
                    type: 'value',
                    value: 'key',
                  },
                },
              ],
              display_name: 'Get',
            },
            testValue: 'fields',
          },
        ],
      },
    },
    qxccwXlOmZh0K_e7bZxRG: {
      name: 'IconAttributes',
      type: 'component',
      attrs: {},
      style: {
        color: 'inherit',
      },
      events: {},
      repeat: null,
      children: [],
    },
  },
  __type: 'components',
  events: [],
  onLoad: {
    actions: [
      {
        data: {
          name: 'L2mH6h',
          type: 'apply',
          arguments: [],
        },
        type: 'SetVariable',
        variable: 'Filtered children',
      },
      {
        type: 'Switch',
        cases: [
          {
            actions: [
              {
                type: 'TriggerWorkflow',
                workflow: 'fLyCgA',
                parameters: null,
              },
            ],
            condition: {
              type: 'and',
              label: 'Has no focused item path',
              arguments: [
                {
                  formula: {
                    name: '@toddle/not',
                    type: 'function',
                    label: 'Has no focused item path',
                    arguments: [
                      {
                        name: 'Input',
                        type: {
                          type: 'Boolean',
                        },
                        formula: {
                          path: [
                            'Contexts',
                            'graphql-state-provider',
                            'sFwpbJ',
                          ],
                          type: 'path',
                        },
                      },
                    ],
                    display_name: 'Not',
                  },
                },
                {
                  formula: {
                    path: ['Contexts', 'graphql-state-provider', 'yj6kYG'],
                    type: 'path',
                  },
                },
              ],
            },
          },
        ],
        default: {
          actions: [],
        },
      },
      {
        type: 'Switch',
        cases: [
          {
            actions: [
              {
                type: 'TriggerWorkflow',
                workflow: 'osJJfp',
                parameters: null,
              },
              {
                key: 'ScrollIntoView',
                name: 'ScrollIntoView',
                events: {},
                arguments: [
                  {
                    name: 'elementId',
                    formula: {
                      path: ['Variables', 'Button id'],
                      type: 'path',
                    },
                  },
                  {
                    name: 'Align to top',
                    formula: {
                      type: 'value',
                      value: false,
                    },
                  },
                  {
                    name: 'options',
                    formula: null,
                  },
                ],
              },
            ],
            condition: {
              name: '@toddle/equals',
              type: 'function',
              label: 'Should focus self',
              arguments: [
                {
                  name: 'First',
                  type: {
                    type: 'Any',
                  },
                  formula: {
                    path: ['Contexts', 'graphql-state-provider', 'sFwpbJ'],
                    type: 'path',
                  },
                },
                {
                  name: 'Second',
                  type: {
                    type: 'Any',
                  },
                  formula: {
                    name: 'wKA68w',
                    type: 'apply',
                    arguments: [],
                  },
                },
              ],
              display_name: 'Equals',
            },
          },
        ],
        default: {
          actions: [],
        },
      },
    ],
    trigger: 'Load',
  },
  contexts: {
    'graphql-tree': {
      formulas: ['w0M8BC', '9Gqtni', 'U5WFN_'],
      workflows: [],
      componentName: 'graphql-tree',
    },
    'graphql-state-provider': {
      formulas: ['pwn8gn', 'X5xC69', 'j0RZW9', 'sFwpbJ', 'yj6kYG'],
      workflows: ['UxJ9O0', 'p373Ni', 'qrWP8a', 'IiDNlG'],
      componentName: 'graphql-state-provider',
    },
    'graphql-content-provider': {
      formulas: ['zaZ3Pb', 'TW5CyB', 'U_nROu'],
      workflows: ['zFdnGz'],
      componentName: 'graphql-content-provider',
    },
    'graphql-tree-item-provider': {
      formulas: ['7nlYI6', '6Uj9fT'],
      workflows: ['VpLHn5', 'fZONLZ'],
      componentName: 'graphql-tree-item-provider',
    },
  },
  formulas: {
    '-hDJX8': {
      name: 'Argument value',
      formula: {
        name: 'graphqlGetArgumentValue',
        type: 'function',
        arguments: [
          {
            name: 'queryAst',
            type: {
              type: 'Unknown',
            },
            formula: {
              path: ['Contexts', 'graphql-content-provider', 'U_nROu'],
              type: 'path',
            },
          },
          {
            name: 'path',
            type: {
              type: 'String',
            },
            formula: {
              name: 'wKA68w',
              type: 'apply',
              arguments: [],
            },
          },
        ],
      },
      memoize: false,
      arguments: [],
    },
    '3dwLiH': {
      name: 'Has selected children',
      formula: {
        name: '@toddle/some',
        type: 'function',
        arguments: [
          {
            name: 'Array',
            type: {
              type: 'Array',
            },
            formula: {
              name: 'XeRxiz',
              type: 'apply',
              arguments: [],
            },
          },
          {
            name: 'Formula',
            type: {
              type: 'Formula',
            },
            formula: {
              name: '@toddle/some',
              type: 'function',
              arguments: [
                {
                  name: 'Array',
                  type: {
                    type: 'Array',
                  },
                  formula: {
                    path: ['Contexts', 'graphql-content-provider', 'zaZ3Pb'],
                    type: 'path',
                  },
                },
                {
                  name: 'Formula',
                  type: {
                    type: 'Formula',
                  },
                  formula: {
                    name: '@toddle/startsWith',
                    type: 'function',
                    arguments: [
                      {
                        name: 'String',
                        type: {
                          type: 'String',
                        },
                        formula: {
                          path: ['Args', 'item'],
                          type: 'path',
                        },
                      },
                      {
                        name: 'Prefix',
                        type: {
                          type: 'String',
                        },
                        formula: {
                          name: 'eWTnAu',
                          type: 'apply',
                          arguments: [
                            {
                              name: 'parentPath',
                              formula: {
                                name: 'wKA68w',
                                type: 'apply',
                                arguments: [],
                              },
                              testValue: 'query',
                            },
                            {
                              name: 'name',
                              formula: {
                                path: [
                                  'Args',
                                  '@toddle.parent',
                                  'item',
                                  'name',
                                ],
                                type: 'path',
                              },
                              testValue: 'alias:fieldName',
                            },
                            {
                              name: 'key',
                              formula: {
                                path: ['Args', '@toddle.parent', 'item', 'key'],
                                type: 'path',
                              },
                              testValue: 'fields',
                            },
                          ],
                        },
                      },
                    ],
                    display_name: 'Starts with',
                  },
                  isFunction: true,
                },
              ],
              display_name: 'Some',
            },
            isFunction: true,
          },
        ],
        display_name: 'Some',
      },
      memoize: false,
      arguments: [],
    },
    '9th4ws': {
      name: 'Can collapse',
      formula: {
        type: 'and',
        label: 'Should close',
        arguments: [
          {
            formula: {
              name: '@toddle/not',
              type: 'function',
              arguments: [
                {
                  name: 'Input',
                  type: {
                    type: 'Boolean',
                  },
                  formula: {
                    name: 'DhJ7kv',
                    type: 'apply',
                    arguments: [],
                  },
                },
              ],
              display_name: 'Not',
            },
          },
          {
            formula: {
              name: '@toddle/includes',
              type: 'function',
              arguments: [
                {
                  name: 'Array',
                  type: {
                    type: 'Array \\| String',
                  },
                  formula: {
                    path: ['Contexts', 'graphql-state-provider', 'X5xC69'],
                    type: 'path',
                  },
                },
                {
                  name: 'Item',
                  type: {
                    type: 'Any',
                  },
                  formula: {
                    name: 'wKA68w',
                    type: 'apply',
                    arguments: [],
                  },
                },
              ],
              display_name: 'Includes',
            },
          },
        ],
      },
      memoize: false,
      arguments: [],
    },
    DhJ7kv: {
      name: 'Is kind scalar or enum',
      formula: {
        name: '@toddle/includes',
        type: 'function',
        arguments: [
          {
            name: 'Array',
            type: {
              type: 'Array \\| String',
            },
            formula: {
              type: 'array',
              arguments: [
                {
                  name: 'Second',
                  type: {
                    type: 'Any',
                  },
                  formula: {
                    type: 'value',
                    value: 'SCALAR',
                  },
                },
                {
                  name: 'Second',
                  type: {
                    type: 'Any',
                  },
                  formula: {
                    type: 'value',
                    value: 'ENUM',
                  },
                },
              ],
            },
          },
          {
            name: 'Item',
            type: {
              type: 'Any',
            },
            formula: {
              name: '@toddle/get',
              type: 'function',
              arguments: [
                {
                  name: 'Object',
                  type: {
                    type: 'Array \\| Object \\| String',
                  },
                  formula: {
                    name: 'FnYQ4Z',
                    type: 'apply',
                    arguments: [
                      {
                        name: 'type',
                        formula: {
                          path: ['Attributes', 'data', 'type'],
                          type: 'path',
                        },
                        testValue: {
                          kind: 'NON_NULL',
                          name: null,
                          ofType: {
                            kind: 'LIST',
                            name: null,
                            ofType: {
                              kind: 'NON_NULL',
                              name: null,
                              ofType: {
                                kind: 'UNION',
                                name: 'SearchResult',
                                ofType: null,
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
                {
                  name: 'Path',
                  type: {
                    type: 'Array<String> \\| Number \\| String',
                  },
                  formula: {
                    type: 'value',
                    value: 'kind',
                  },
                },
              ],
              display_name: 'Get',
            },
          },
        ],
        display_name: 'Includes',
      },
      memoize: false,
      arguments: [],
    },
    EIavcM: {
      name: 'Is selected',
      formula: {
        type: 'and',
        arguments: [
          {
            formula: {
              name: '@toddle/includes',
              type: 'function',
              arguments: [
                {
                  name: 'Array',
                  type: {
                    type: 'Array \\| String',
                  },
                  formula: {
                    path: ['Contexts', 'graphql-content-provider', 'zaZ3Pb'],
                    type: 'path',
                  },
                },
                {
                  name: 'Item',
                  type: {
                    type: 'Any',
                  },
                  formula: {
                    name: 'wKA68w',
                    type: 'apply',
                    arguments: [],
                  },
                },
              ],
              display_name: 'Includes',
            },
          },
          {
            formula: {
              name: 'DhJ7kv',
              type: 'apply',
              arguments: [],
            },
          },
        ],
      },
      memoize: false,
      arguments: [],
    },
    FnYQ4Z: {
      name: 'Get unwrapped type',
      formula: {
        type: 'switch',
        cases: [
          {
            formula: {
              name: 'FnYQ4Z',
              type: 'apply',
              arguments: [
                {
                  name: 'type',
                  formula: {
                    path: ['Args', 'type', 'ofType'],
                    type: 'path',
                  },
                  testValue: {
                    kind: 'NON_NULL',
                    name: null,
                    ofType: {
                      kind: 'LIST',
                      name: null,
                      ofType: {
                        kind: 'NON_NULL',
                        name: null,
                        ofType: {
                          kind: 'UNION',
                          name: 'SearchResult',
                          ofType: null,
                        },
                      },
                    },
                  },
                },
              ],
            },
            condition: {
              type: 'or',
              arguments: [
                {
                  formula: {
                    name: '@toddle/equals',
                    type: 'function',
                    arguments: [
                      {
                        name: 'First',
                        type: {
                          type: 'Any',
                        },
                        formula: {
                          path: ['Args', 'type', 'kind'],
                          type: 'path',
                        },
                      },
                      {
                        name: 'Second',
                        type: {
                          type: 'Any',
                        },
                        formula: {
                          type: 'value',
                          value: 'NON_NULL',
                        },
                      },
                    ],
                    display_name: 'Equals',
                  },
                },
                {
                  formula: {
                    name: '@toddle/equals',
                    type: 'function',
                    arguments: [
                      {
                        name: 'First',
                        type: {
                          type: 'Any',
                        },
                        formula: {
                          path: ['Args', 'type', 'kind'],
                          type: 'path',
                        },
                      },
                      {
                        name: 'Second',
                        type: {
                          type: 'Any',
                        },
                        formula: {
                          type: 'value',
                          value: 'LIST',
                        },
                      },
                    ],
                    display_name: 'Equals',
                  },
                },
              ],
            },
          },
        ],
        default: {
          path: ['Args', 'type'],
          type: 'path',
        },
      },
      memoize: false,
      arguments: [
        {
          name: 'type',
          testValue: {
            kind: 'NON_NULL',
            name: null,
            ofType: {
              kind: 'LIST',
              name: null,
              ofType: {
                kind: 'NON_NULL',
                name: null,
                ofType: {
                  kind: 'UNION',
                  name: 'SearchResult',
                  ofType: null,
                },
              },
            },
          },
        },
      ],
      exposeInContext: false,
    },
    L2mH6h: {
      name: 'Filtered children',
      formula: {
        type: 'switch',
        cases: [
          {
            formula: {
              name: 'XeRxiz',
              type: 'apply',
              arguments: [],
            },
            condition: {
              name: '@toddle/includes',
              type: 'function',
              arguments: [
                {
                  name: 'Array',
                  type: {
                    type: 'Array \\| String',
                  },
                  formula: {
                    path: ['Contexts', 'graphql-state-provider', 'X5xC69'],
                    type: 'path',
                  },
                },
                {
                  name: 'Item',
                  type: {
                    type: 'Any',
                  },
                  formula: {
                    name: 'wKA68w',
                    type: 'apply',
                    arguments: [],
                  },
                },
              ],
              display_name: 'Includes',
            },
          },
        ],
        default: {
          name: '@toddle/filter',
          type: 'function',
          arguments: [
            {
              name: 'Array',
              type: {
                type: 'Array',
              },
              formula: {
                name: 'XeRxiz',
                type: 'apply',
                arguments: [],
              },
            },
            {
              name: 'Formula',
              type: {
                type: 'Formula',
              },
              formula: {
                name: '@toddle/some',
                type: 'function',
                arguments: [
                  {
                    name: 'Array',
                    type: {
                      type: 'Array',
                    },
                    formula: {
                      path: ['Contexts', 'graphql-content-provider', 'zaZ3Pb'],
                      type: 'path',
                    },
                  },
                  {
                    name: 'Formula',
                    type: {
                      type: 'Formula',
                    },
                    formula: {
                      name: '@toddle/startsWith',
                      type: 'function',
                      arguments: [
                        {
                          name: 'String',
                          type: {
                            type: 'String',
                          },
                          formula: {
                            path: ['Args', 'item'],
                            type: 'path',
                          },
                        },
                        {
                          name: 'Prefix',
                          type: {
                            type: 'String',
                          },
                          formula: {
                            name: 'eWTnAu',
                            type: 'apply',
                            arguments: [
                              {
                                name: 'parentPath',
                                formula: {
                                  name: 'wKA68w',
                                  type: 'apply',
                                  arguments: [],
                                },
                                testValue: 'query',
                              },
                              {
                                name: 'name',
                                formula: {
                                  path: [
                                    'Args',
                                    '@toddle.parent',
                                    'item',
                                    'name',
                                  ],
                                  type: 'path',
                                },
                                testValue: 'alias:fieldName',
                              },
                              {
                                name: 'key',
                                formula: {
                                  path: [
                                    'Args',
                                    '@toddle.parent',
                                    'item',
                                    'key',
                                  ],
                                  type: 'path',
                                },
                                testValue: 'fields',
                              },
                            ],
                          },
                        },
                      ],
                      display_name: 'Starts with',
                    },
                    isFunction: true,
                  },
                ],
                display_name: 'Some',
              },
              isFunction: true,
            },
          ],
          display_name: 'Filter',
        },
      },
      memoize: false,
      arguments: [],
    },
    UHy73G: {
      name: 'Type info',
      formula: {
        name: '@toddle/find',
        type: 'function',
        arguments: [
          {
            name: 'Array',
            type: {
              type: 'Array',
            },
            formula: {
              path: ['Contexts', 'graphql-content-provider', 'TW5CyB'],
              type: 'path',
            },
          },
          {
            name: 'Formula',
            type: {
              type: 'Formula',
            },
            formula: {
              name: '@toddle/equals',
              type: 'function',
              arguments: [
                {
                  name: 'First',
                  type: {
                    type: 'Any',
                  },
                  formula: {
                    path: ['Args', 'item', 'name'],
                    type: 'path',
                  },
                },
                {
                  name: 'Second',
                  type: {
                    type: 'Any',
                  },
                  formula: {
                    name: '@toddle/get',
                    type: 'function',
                    arguments: [
                      {
                        name: 'Object',
                        type: {
                          type: 'Array \\| Object \\| String',
                        },
                        formula: {
                          name: 'rQwUyJ',
                          type: 'apply',
                          arguments: [],
                        },
                      },
                      {
                        name: 'Path',
                        type: {
                          type: 'Array<String> \\| Number \\| String',
                        },
                        formula: {
                          type: 'value',
                          value: 'name',
                        },
                      },
                    ],
                    display_name: 'Get',
                  },
                },
              ],
              display_name: 'Equals',
            },
            isFunction: true,
          },
        ],
        display_name: 'Find',
      },
      memoize: false,
      arguments: [],
    },
    UW0wlh: {
      name: 'Has argument value',
      formula: {
        type: 'and',
        arguments: [
          {
            formula: {
              type: 'switch',
              cases: [
                {
                  formula: {
                    type: 'value',
                    value: true,
                  },
                  condition: {
                    name: '@toddle/equals',
                    type: 'function',
                    arguments: [
                      {
                        name: 'First',
                        type: {
                          type: 'Any',
                        },
                        formula: {
                          name: '-hDJX8',
                          type: 'apply',
                          arguments: [],
                        },
                      },
                      {
                        name: 'Second',
                        type: {
                          type: 'Any',
                        },
                        formula: {
                          type: 'value',
                          value: false,
                        },
                      },
                    ],
                    display_name: 'Equals',
                  },
                },
              ],
              default: {
                name: '-hDJX8',
                type: 'apply',
                arguments: [],
              },
            },
          },
          {
            formula: {
              name: '@toddle/includes',
              type: 'function',
              arguments: [
                {
                  name: 'Array',
                  type: {
                    type: 'Array \\| String',
                  },
                  formula: {
                    path: ['Contexts', 'graphql-content-provider', 'zaZ3Pb'],
                    type: 'path',
                  },
                },
                {
                  name: 'Item',
                  type: {
                    type: 'Any',
                  },
                  formula: {
                    name: 'wKA68w',
                    type: 'apply',
                    arguments: [],
                  },
                },
              ],
              display_name: 'Includes',
            },
          },
        ],
      },
      memoize: false,
      arguments: [],
    },
    XeRxiz: {
      name: 'Children',
      formula: {
        type: 'switch',
        cases: [
          {
            formula: {
              name: '@toddle/sort_by',
              type: 'function',
              arguments: [
                {
                  name: 'Array',
                  type: {
                    type: 'Array',
                  },
                  formula: {
                    name: '@toddle/map',
                    type: 'function',
                    arguments: [
                      {
                        name: 'Array',
                        type: {
                          type: 'Array',
                        },
                        formula: {
                          name: '@toddle/get',
                          type: 'function',
                          arguments: [
                            {
                              name: 'Object',
                              type: {
                                type: 'Array \\| Object \\| String',
                              },
                              formula: {
                                name: 'UHy73G',
                                type: 'apply',
                                arguments: [],
                              },
                            },
                            {
                              name: 'Path',
                              type: {
                                type: 'Array<String> \\| Number \\| String',
                              },
                              formula: {
                                type: 'value',
                                value: 'inputFields',
                              },
                            },
                          ],
                          display_name: 'Get',
                        },
                      },
                      {
                        name: 'Formula',
                        type: {
                          type: 'Formula',
                        },
                        formula: {
                          name: '@toddle/concatenate',
                          type: 'function',
                          arguments: [
                            {
                              name: '0',
                              type: {
                                type: 'Array \\| String',
                              },
                              formula: {
                                path: ['Args', 'item'],
                                type: 'path',
                              },
                            },
                            {
                              name: '0',
                              type: {
                                type: 'Array \\| String',
                              },
                              formula: {
                                type: 'object',
                                arguments: [
                                  {
                                    Name: 0,
                                    name: 'key',
                                    formula: {
                                      type: 'value',
                                      value: 'inputFields',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                          display_name: 'Concatenate',
                          variableArguments: true,
                        },
                        isFunction: true,
                      },
                    ],
                    display_name: 'Map',
                  },
                },
                {
                  name: 'Formula',
                  type: {
                    type: 'Formula',
                  },
                  formula: {
                    name: '@toddle/get',
                    type: 'function',
                    arguments: [
                      {
                        name: 'Object',
                        type: {
                          type: 'Array \\| Object \\| String',
                        },
                        formula: {
                          path: ['Args', 'item'],
                          type: 'path',
                        },
                      },
                      {
                        name: 'Path',
                        type: {
                          type: 'Array<String> \\| Number \\| String',
                        },
                        formula: {
                          type: 'value',
                          value: 'name',
                        },
                      },
                    ],
                    display_name: 'Get',
                  },
                  isFunction: true,
                },
                {
                  name: 'Ascending?',
                  type: {
                    type: 'Boolean',
                  },
                  formula: {
                    type: 'value',
                    value: true,
                  },
                },
              ],
              display_name: 'Sort by',
            },
            condition: {
              name: 'p8Mgdl',
              type: 'apply',
              arguments: [],
            },
          },
        ],
        default: {
          type: 'value',
          value: null,
        },
      },
      memoize: false,
      arguments: [],
    },
    _hqUE3: {
      name: 'Can expand',
      formula: {
        type: 'and',
        label: 'Should expand',
        arguments: [
          {
            formula: {
              name: '@toddle/not',
              type: 'function',
              arguments: [
                {
                  name: 'Input',
                  type: {
                    type: 'Boolean',
                  },
                  formula: {
                    name: 'DhJ7kv',
                    type: 'apply',
                    arguments: [],
                  },
                },
              ],
              display_name: 'Not',
            },
          },
          {
            formula: {
              name: '@toddle/not',
              type: 'function',
              arguments: [
                {
                  name: 'Input',
                  type: {
                    type: 'Boolean',
                  },
                  formula: {
                    name: '@toddle/includes',
                    type: 'function',
                    arguments: [
                      {
                        name: 'Array',
                        type: {
                          type: 'Array \\| String',
                        },
                        formula: {
                          path: [
                            'Contexts',
                            'graphql-state-provider',
                            'X5xC69',
                          ],
                          type: 'path',
                        },
                      },
                      {
                        name: 'Item',
                        type: {
                          type: 'Any',
                        },
                        formula: {
                          name: 'wKA68w',
                          type: 'apply',
                          arguments: [],
                        },
                      },
                    ],
                    display_name: 'Includes',
                  },
                },
              ],
              display_name: 'Not',
            },
          },
        ],
      },
      memoize: false,
      arguments: [],
    },
    eWTnAu: {
      name: 'Get path',
      formula: {
        name: '@toddle/join',
        type: 'function',
        arguments: [
          {
            name: 'Array',
            type: {
              type: 'Array',
            },
            formula: {
              type: 'array',
              arguments: [
                {
                  name: '0',
                  type: {
                    type: 'Array \\| String',
                  },
                  formula: {
                    path: ['Args', 'parentPath'],
                    type: 'path',
                  },
                },
                {
                  name: '0',
                  type: {
                    type: 'Array \\| String',
                  },
                  formula: {
                    type: 'value',
                    value: '-',
                  },
                },
                {
                  name: '0',
                  type: {
                    type: 'Array \\| String',
                  },
                  formula: {
                    path: ['Args', 'key'],
                    type: 'path',
                  },
                },
                {
                  name: '0',
                  type: {
                    type: 'Array \\| String',
                  },
                  formula: {
                    type: 'value',
                    value: '/',
                  },
                },
                {
                  name: '0',
                  type: {
                    type: 'Array \\| String',
                  },
                  formula: {
                    path: ['Args', 'name'],
                    type: 'path',
                  },
                },
              ],
            },
          },
          {
            name: 'Separator',
            type: {
              type: 'String',
            },
            formula: {
              type: 'value',
              value: '',
            },
          },
        ],
        display_name: 'Join',
      },
      memoize: false,
      arguments: [
        {
          name: 'parentPath',
          testValue: 'query',
        },
        {
          name: 'name',
          testValue: 'alias:fieldName',
        },
        {
          name: 'key',
          testValue: 'fields',
        },
      ],
      exposeInContext: false,
    },
    p8Mgdl: {
      name: 'Is kind input object',
      formula: {
        name: '@toddle/equals',
        type: 'function',
        arguments: [
          {
            name: 'First',
            type: {
              type: 'Any',
            },
            formula: {
              name: '@toddle/get',
              type: 'function',
              arguments: [
                {
                  name: 'Object',
                  type: {
                    type: 'Array \\| Object \\| String',
                  },
                  formula: {
                    name: 'FnYQ4Z',
                    type: 'apply',
                    arguments: [
                      {
                        name: 'type',
                        formula: {
                          path: ['Attributes', 'data', 'type'],
                          type: 'path',
                        },
                        testValue: {
                          kind: 'NON_NULL',
                          name: null,
                          ofType: {
                            kind: 'LIST',
                            name: null,
                            ofType: {
                              kind: 'NON_NULL',
                              name: null,
                              ofType: {
                                kind: 'UNION',
                                name: 'SearchResult',
                                ofType: null,
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
                {
                  name: 'Path',
                  type: {
                    type: 'Array<String> \\| Number \\| String',
                  },
                  formula: {
                    type: 'value',
                    value: 'kind',
                  },
                },
              ],
              display_name: 'Get',
            },
          },
          {
            name: 'Second',
            type: {
              type: 'Any',
            },
            formula: {
              type: 'value',
              value: 'INPUT_OBJECT',
            },
          },
        ],
        display_name: 'Equals',
      },
      memoize: false,
      arguments: [],
    },
    rQwUyJ: {
      name: 'Unwrapped type',
      formula: {
        name: 'FnYQ4Z',
        type: 'apply',
        arguments: [
          {
            name: 'type',
            formula: {
              path: ['Attributes', 'data', 'type'],
              type: 'path',
            },
            testValue: {
              kind: 'NON_NULL',
              name: null,
              ofType: {
                kind: 'LIST',
                name: null,
                ofType: {
                  kind: 'NON_NULL',
                  name: null,
                  ofType: {
                    kind: 'UNION',
                    name: 'SearchResult',
                    ofType: null,
                  },
                },
              },
            },
          },
        ],
      },
      memoize: false,
      arguments: [],
    },
    wKA68w: {
      name: 'Path',
      formula: {
        name: 'eWTnAu',
        type: 'apply',
        arguments: [
          {
            name: 'parentPath',
            formula: {
              path: ['Attributes', 'parent-path'],
              type: 'path',
            },
            testValue: 'query',
          },
          {
            name: 'name',
            formula: {
              path: ['Attributes', 'data', 'name'],
              type: 'path',
            },
            testValue: 'alias:fieldName',
          },
          {
            name: 'key',
            formula: {
              path: ['Attributes', 'data', 'key'],
              type: 'path',
            },
            testValue: 'fields',
          },
        ],
      },
      memoize: false,
      arguments: [],
      exposeInContext: false,
    },
    yitqmv: {
      name: 'Is argument value object or array',
      formula: {
        name: '@toddle/includes',
        type: 'function',
        arguments: [
          {
            name: 'Array',
            type: {
              type: 'Array \\| String',
            },
            formula: {
              type: 'array',
              arguments: [
                {
                  name: 'Input',
                  type: {
                    type: 'Any',
                  },
                  formula: {
                    type: 'value',
                    value: 'Object',
                  },
                },
                {
                  name: 'Input',
                  type: {
                    type: 'Any',
                  },
                  formula: {
                    type: 'value',
                    value: 'Array',
                  },
                },
              ],
            },
          },
          {
            name: 'Item',
            type: {
              type: 'Any',
            },
            formula: {
              name: '@toddle/typeOf',
              type: 'function',
              arguments: [
                {
                  name: 'Input',
                  type: {
                    type: 'Any',
                  },
                  formula: {
                    name: '-hDJX8',
                    type: 'apply',
                    arguments: [],
                  },
                },
              ],
              display_name: 'Type of',
            },
          },
        ],
        display_name: 'Includes',
      },
      memoize: false,
      arguments: [],
    },
  },
  variables: {
    'Button id': {
      initialValue: {
        name: 'Nano ID',
        type: 'function',
        package: 'nanoid',
        arguments: [
          {
            name: 'size',
            formula: {
              type: 'value',
              value: 6,
            },
            testValue: 21,
          },
        ],
      },
    },
    'Is focused': {
      initialValue: {
        type: 'value',
        value: false,
      },
    },
    'Is popover open': {
      initialValue: {
        type: 'value',
        value: false,
      },
    },
    'Filtered children': {
      initialValue: {
        type: 'value',
        value: null,
      },
    },
    'Unfocusable item ids': {
      initialValue: {
        type: 'array',
        arguments: [],
      },
    },
    'Children container id': {
      initialValue: {
        name: 'Nano ID',
        type: 'function',
        package: 'nanoid',
        arguments: [
          {
            name: 'size',
            formula: {
              type: 'value',
              value: 6,
            },
            testValue: 21,
          },
        ],
      },
    },
  },
  workflows: {
    '9vhWUB': {
      name: 'Open docs',
      actions: [
        {
          type: 'TriggerWorkflow',
          workflow: 'qrWP8a',
          parameters: null,
          contextProvider: 'graphql-state-provider',
        },
      ],
      testValue: '<Event>',
      exposeInContext: false,
    },
    BJE_8t: {
      name: 'Clear value',
      actions: [
        {
          type: 'Switch',
          cases: [
            {
              actions: [
                {
                  type: 'TriggerWorkflow',
                  workflow: 'ep1mW7',
                  parameters: {
                    isRemovingRoot: {
                      formula: null,
                    },
                  },
                },
              ],
              condition: {
                name: '@toddle/not',
                type: 'function',
                label: 'Should focus sibling',
                arguments: [
                  {
                    name: 'Input',
                    type: {
                      type: 'Boolean',
                    },
                    formula: {
                      name: '@toddle/includes',
                      type: 'function',
                      label: 'Should focus self',
                      arguments: [
                        {
                          name: 'Array',
                          type: {
                            type: 'Array \\| String',
                          },
                          formula: {
                            path: [
                              'Contexts',
                              'graphql-state-provider',
                              'X5xC69',
                            ],
                            type: 'path',
                          },
                        },
                        {
                          name: 'Item',
                          type: {
                            type: 'Any',
                          },
                          formula: {
                            path: ['Attributes', 'parent-path'],
                            type: 'path',
                          },
                        },
                      ],
                      display_name: 'Includes',
                    },
                  },
                ],
                display_name: 'Not',
              },
            },
          ],
          default: {
            actions: [],
          },
        },
        {
          type: 'TriggerWorkflow',
          workflow: 'zFdnGz',
          parameters: {
            path: {
              formula: {
                name: 'wKA68w',
                type: 'apply',
                arguments: [],
              },
            },
          },
          contextProvider: 'graphql-content-provider',
        },
        {
          type: 'TriggerWorkflow',
          workflow: 'fZONLZ',
          parameters: null,
          contextProvider: 'graphql-tree-item-provider',
        },
      ],
      testValue: '<Event>',
      exposeInContext: false,
    },
    ItqM9k: {
      name: 'Focus self or parent',
      actions: [
        {
          type: 'Switch',
          cases: [
            {
              actions: [
                {
                  type: 'TriggerWorkflow',
                  workflow: 'VpLHn5',
                  parameters: {
                    isFocusingParent: {
                      type: 'value',
                      formula: {
                        type: 'value',
                        value: true,
                      },
                    },
                    unfocusableItemIds: {
                      formula: {
                        name: '@toddle/append',
                        type: 'function',
                        arguments: [
                          {
                            name: 'Array',
                            type: {
                              type: 'Array',
                            },
                            formula: {
                              path: ['Variables', 'Unfocusable item ids'],
                              type: 'path',
                            },
                          },
                          {
                            name: 'Item',
                            type: {
                              type: 'Any',
                            },
                            formula: {
                              path: ['Variables', 'Button id'],
                              type: 'path',
                            },
                          },
                        ],
                        display_name: 'Append',
                      },
                    },
                  },
                  contextProvider: 'graphql-tree-item-provider',
                },
              ],
              condition: {
                name: '@toddle/equals',
                type: 'function',
                label: 'Should focus parent',
                arguments: [
                  {
                    name: 'First',
                    type: {
                      type: 'Any',
                    },
                    formula: {
                      name: '@toddle/size',
                      type: 'function',
                      label: 'Should focus parent',
                      arguments: [
                        {
                          name: 'Collection',
                          type: {
                            type: 'Array \\| Object \\| String',
                          },
                          formula: {
                            name: '@toddle/filter',
                            type: 'function',
                            arguments: [
                              {
                                name: 'Array',
                                type: {
                                  type: 'Array',
                                },
                                formula: {
                                  path: [
                                    'Contexts',
                                    'graphql-content-provider',
                                    'zaZ3Pb',
                                  ],
                                  type: 'path',
                                  label: 'Should focus parent',
                                },
                              },
                              {
                                name: 'Formula',
                                type: {
                                  type: 'Formula',
                                },
                                formula: {
                                  name: '@toddle/includes',
                                  type: 'function',
                                  arguments: [
                                    {
                                      name: 'Array',
                                      type: {
                                        type: 'Array \\| String',
                                      },
                                      formula: {
                                        path: ['Args', 'item'],
                                        type: 'path',
                                      },
                                    },
                                    {
                                      name: 'Item',
                                      type: {
                                        type: 'Any',
                                      },
                                      formula: {
                                        name: 'wKA68w',
                                        type: 'apply',
                                        arguments: [],
                                      },
                                    },
                                  ],
                                  display_name: 'Includes',
                                },
                                isFunction: true,
                              },
                            ],
                            display_name: 'Filter',
                          },
                        },
                      ],
                      display_name: 'Size',
                    },
                  },
                  {
                    name: 'Second',
                    type: {
                      type: 'Any',
                    },
                    formula: {
                      type: 'value',
                      value: 0,
                    },
                  },
                ],
                display_name: 'Equals',
              },
            },
          ],
          default: {
            actions: [
              {
                type: 'TriggerWorkflow',
                workflow: 'osJJfp',
                parameters: null,
              },
            ],
          },
        },
      ],
      testValue: '<Event>',
      exposeInContext: false,
    },
    PRU77q: {
      name: 'Handle keydown',
      actions: [
        {
          type: 'Switch',
          cases: [
            {
              actions: [
                {
                  type: 'Switch',
                  cases: [
                    {
                      actions: [
                        {
                          type: 'TriggerWorkflow',
                          workflow: 'UxJ9O0',
                          parameters: {
                            path: {
                              formula: {
                                name: 'wKA68w',
                                type: 'apply',
                                arguments: [],
                              },
                            },
                          },
                          contextProvider: 'graphql-state-provider',
                        },
                        {
                          type: 'TriggerWorkflow',
                          workflow: 'eXmVSw',
                          parameters: null,
                        },
                      ],
                      condition: {
                        name: '9th4ws',
                        type: 'apply',
                        label: 'Can collapse',
                        arguments: [],
                      },
                    },
                  ],
                  default: {
                    actions: [
                      {
                        name: '@toddle/focus',
                        label: 'Focus',
                        arguments: [
                          {
                            name: 'Element',
                            type: {
                              type: 'Element',
                            },
                            formula: {
                              name: '@toddle/getElementById',
                              type: 'function',
                              arguments: [
                                {
                                  name: 'Id',
                                  type: {
                                    type: 'String',
                                  },
                                  formula: {
                                    path: [
                                      'Contexts',
                                      'graphql-tree-item-provider',
                                      '7nlYI6',
                                    ],
                                    type: 'path',
                                  },
                                },
                              ],
                              display_name: 'Get element by id',
                            },
                            description:
                              'The DOM element that should receive focus.',
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
              condition: {
                name: '@toddle/equals',
                type: 'function',
                label: 'Is arrow left',
                arguments: [
                  {
                    name: 'First',
                    type: {
                      type: 'Any',
                    },
                    formula: {
                      path: ['Parameters', 'code'],
                      type: 'path',
                    },
                  },
                  {
                    name: 'Second',
                    type: {
                      type: 'Any',
                    },
                    formula: {
                      type: 'value',
                      value: 'ArrowLeft',
                    },
                  },
                ],
                display_name: 'Equals',
              },
            },
            {
              actions: [
                {
                  type: 'Switch',
                  cases: [
                    {
                      actions: [
                        {
                          type: 'TriggerWorkflow',
                          workflow: 'p373Ni',
                          parameters: {
                            path: {
                              formula: {
                                name: 'wKA68w',
                                type: 'apply',
                                arguments: [],
                              },
                            },
                          },
                          contextProvider: 'graphql-state-provider',
                        },
                        {
                          type: 'TriggerWorkflow',
                          workflow: 'eXmVSw',
                          parameters: null,
                        },
                      ],
                      condition: {
                        name: '_hqUE3',
                        type: 'apply',
                        label: 'Can expand',
                        arguments: [],
                      },
                    },
                  ],
                  default: {
                    actions: [
                      {
                        name: '@toddle/focus',
                        label: 'Focus',
                        arguments: [
                          {
                            name: 'Element',
                            type: {
                              type: 'Element',
                            },
                            formula: {
                              name: 'graphqlGetNextSibling',
                              type: 'function',
                              arguments: [
                                {
                                  name: 'parent',
                                  type: {
                                    type: 'Unknown',
                                  },
                                  formula: {
                                    name: '@toddle/getElementById',
                                    type: 'function',
                                    arguments: [
                                      {
                                        name: 'Id',
                                        type: {
                                          type: 'String',
                                        },
                                        formula: {
                                          path: [
                                            'Variables',
                                            'Children container id',
                                          ],
                                          type: 'path',
                                        },
                                      },
                                    ],
                                    display_name: 'Get element by id',
                                  },
                                },
                                {
                                  name: 'currentElement',
                                  type: {
                                    type: 'Unknown',
                                  },
                                  formula: null,
                                },
                                {
                                  name: 'loop',
                                  type: {
                                    type: 'Unknown',
                                  },
                                  formula: {
                                    type: 'value',
                                    value: false,
                                  },
                                },
                                {
                                  name: 'selector',
                                  type: {
                                    type: 'String',
                                  },
                                  formula: {
                                    name: '@toddle/join',
                                    type: 'function',
                                    arguments: [
                                      {
                                        name: 'Array',
                                        type: {
                                          type: 'Array',
                                        },
                                        formula: {
                                          type: 'array',
                                          arguments: [
                                            {
                                              Name: 0,
                                              formula: {
                                                path: [
                                                  'Contexts',
                                                  'graphql-tree',
                                                  '9Gqtni',
                                                ],
                                                type: 'path',
                                              },
                                            },
                                            {
                                              Name: 0,
                                              formula: {
                                                path: [
                                                  'Contexts',
                                                  'graphql-tree',
                                                  'U5WFN_',
                                                ],
                                                type: 'path',
                                              },
                                            },
                                          ],
                                        },
                                      },
                                      {
                                        name: 'Separator',
                                        type: {
                                          type: 'String',
                                        },
                                        formula: {
                                          type: 'value',
                                          value: ', ',
                                        },
                                      },
                                    ],
                                    display_name: 'Join',
                                  },
                                },
                              ],
                            },
                            description:
                              'The DOM element that should receive focus.',
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
              condition: {
                type: 'and',
                label: 'Is arrow right',
                arguments: [
                  {
                    formula: {
                      name: '@toddle/equals',
                      type: 'function',
                      label: 'Is arrow right',
                      arguments: [
                        {
                          name: 'First',
                          type: {
                            type: 'Any',
                          },
                          formula: {
                            path: ['Parameters', 'code'],
                            type: 'path',
                          },
                        },
                        {
                          name: 'Second',
                          type: {
                            type: 'Any',
                          },
                          formula: {
                            type: 'value',
                            value: 'ArrowRight',
                          },
                        },
                      ],
                      display_name: 'Equals',
                    },
                  },
                  {
                    formula: {
                      name: 'p8Mgdl',
                      type: 'apply',
                      arguments: [],
                    },
                  },
                ],
              },
            },
            {
              actions: [
                {
                  key: 'preventEventDefault',
                  name: 'preventEventDefault',
                  version: 2,
                  arguments: [
                    {
                      name: 'event',
                      type: {
                        type: 'Unknown',
                      },
                      formula: {
                        path: ['Parameters', 'event'],
                        type: 'path',
                      },
                    },
                  ],
                  description: 'Prevents an event',
                },
                {
                  name: 'stopEventPropagation',
                  version: 2,
                  arguments: [
                    {
                      name: 'event',
                      type: {
                        type: 'Unknown',
                      },
                      formula: {
                        path: ['Parameters', 'event'],
                        type: 'path',
                      },
                    },
                  ],
                  description: 'Stops the propagation of an event',
                },
                {
                  type: 'TriggerWorkflow',
                  workflow: 'BJE_8t',
                  parameters: null,
                },
              ],
              condition: {
                type: 'and',
                label: 'Should remove value',
                arguments: [
                  {
                    formula: {
                      name: 'UW0wlh',
                      type: 'apply',
                      arguments: [],
                    },
                  },
                  {
                    formula: {
                      name: '@toddle/includes',
                      type: 'function',
                      arguments: [
                        {
                          name: 'Array',
                          type: {
                            type: 'Array \\| String',
                          },
                          formula: {
                            type: 'array',
                            arguments: [
                              {
                                Name: 0,
                                formula: {
                                  type: 'value',
                                  value: 'Backspace',
                                },
                              },
                              {
                                Name: 0,
                                formula: {
                                  type: 'value',
                                  value: 'Delete',
                                },
                              },
                            ],
                          },
                        },
                        {
                          name: 'Item',
                          type: {
                            type: 'Any',
                          },
                          formula: {
                            path: ['Parameters', 'code'],
                            type: 'path',
                          },
                        },
                      ],
                      display_name: 'Includes',
                    },
                  },
                ],
              },
            },
            {
              actions: [
                {
                  type: 'TriggerWorkflow',
                  workflow: 'ItqM9k',
                  parameters: null,
                },
              ],
              condition: {
                name: '@toddle/equals',
                type: 'function',
                label: 'Should collapse tree',
                arguments: [
                  {
                    name: 'First',
                    type: {
                      type: 'Any',
                    },
                    formula: {
                      path: ['Parameters', 'code'],
                      type: 'path',
                    },
                  },
                  {
                    name: 'Second',
                    type: {
                      type: 'Any',
                    },
                    formula: {
                      path: [
                        'Contexts',
                        'graphql-state-provider',
                        'j0RZW9',
                        'collapseTree',
                        'code',
                      ],
                      type: 'path',
                    },
                  },
                ],
                display_name: 'Equals',
              },
            },
            {
              actions: [
                {
                  type: 'TriggerWorkflow',
                  workflow: '9vhWUB',
                  parameters: null,
                },
              ],
              condition: {
                name: '@toddle/equals',
                type: 'function',
                label: 'Should open docs',
                arguments: [
                  {
                    name: 'First',
                    type: {
                      type: 'Any',
                    },
                    formula: {
                      path: ['Parameters', 'code'],
                      type: 'path',
                    },
                  },
                  {
                    name: 'Second',
                    type: {
                      type: 'Any',
                    },
                    formula: {
                      path: [
                        'Contexts',
                        'graphql-state-provider',
                        'j0RZW9',
                        'openDocs',
                        'code',
                      ],
                      type: 'path',
                    },
                  },
                ],
                display_name: 'Equals',
              },
            },
            {
              actions: [
                {
                  type: 'TriggerWorkflow',
                  workflow: 'uyFbZk',
                  parameters: {},
                },
              ],
              condition: {
                type: 'or',
                label: 'Is enter or space',
                arguments: [
                  {
                    formula: {
                      name: '@toddle/equals',
                      type: 'function',
                      label: 'Is enter or space',
                      arguments: [
                        {
                          name: 'First',
                          type: {
                            type: 'Any',
                          },
                          formula: {
                            path: ['Parameters', 'code'],
                            type: 'path',
                          },
                        },
                        {
                          name: 'Second',
                          type: {
                            type: 'Any',
                          },
                          formula: {
                            type: 'value',
                            value: 'Enter',
                          },
                        },
                      ],
                      display_name: 'Equals',
                    },
                  },
                  {
                    formula: {
                      name: '@toddle/equals',
                      type: 'function',
                      label: 'Is enter or space',
                      arguments: [
                        {
                          name: 'First',
                          type: {
                            type: 'Any',
                          },
                          formula: {
                            path: ['Parameters', 'code'],
                            type: 'path',
                          },
                        },
                        {
                          name: 'Second',
                          type: {
                            type: 'Any',
                          },
                          formula: {
                            type: 'value',
                            value: 'Space',
                          },
                        },
                      ],
                      display_name: 'Equals',
                    },
                  },
                ],
              },
            },
          ],
          default: {
            actions: [],
          },
        },
      ],
      testValue: '<Event>',
      parameters: [
        {
          name: 'code',
          testValue: 'ArrowLeft',
        },
        {
          name: 'event',
          testValue: '',
        },
      ],
      exposeInContext: false,
    },
    PwrCCJ: {
      name: 'Handle double click',
      actions: [
        {
          type: 'Switch',
          cases: [
            {
              actions: [
                {
                  type: 'TriggerWorkflow',
                  workflow: 'oke_SW',
                  parameters: {
                    isOpen: {
                      formula: {
                        type: 'value',
                        value: true,
                      },
                    },
                  },
                },
              ],
              condition: {
                name: '@toddle/not',
                type: 'function',
                label: 'Should open argument',
                arguments: [
                  {
                    name: 'Input',
                    type: {
                      type: 'Boolean',
                    },
                    formula: {
                      path: ['Variables', 'Is popover open'],
                      type: 'path',
                    },
                  },
                ],
                display_name: 'Not',
              },
            },
          ],
          default: {
            actions: [],
          },
        },
      ],
      testValue: '<Event>',
      exposeInContext: false,
    },
    eXmVSw: {
      name: 'Update children',
      actions: [
        {
          data: {
            name: 'L2mH6h',
            type: 'apply',
            arguments: [],
          },
          type: 'SetVariable',
          variable: 'Filtered children',
        },
        {
          type: 'Switch',
          cases: [
            {
              actions: [
                {
                  type: 'TriggerWorkflow',
                  workflow: 'fZONLZ',
                  parameters: null,
                  contextProvider: 'graphql-tree-item-provider',
                },
              ],
              condition: {
                type: 'and',
                label: 'Should delegate to parent',
                arguments: [
                  {
                    formula: {
                      name: '_hqUE3',
                      type: 'apply',
                      arguments: [],
                    },
                  },
                  {
                    formula: {
                      name: '@toddle/lessThan',
                      type: 'function',
                      arguments: [
                        {
                          name: 'First',
                          type: {
                            type: 'Number',
                          },
                          formula: {
                            name: '@toddle/size',
                            type: 'function',
                            arguments: [
                              {
                                name: 'Collection',
                                type: {
                                  type: 'Array \\| Object \\| String',
                                },
                                formula: {
                                  path: ['Variables', 'Filtered children'],
                                  type: 'path',
                                },
                              },
                            ],
                            display_name: 'Size',
                          },
                        },
                        {
                          name: 'Second',
                          type: {
                            type: 'Number',
                          },
                          formula: {
                            type: 'value',
                            value: 1,
                          },
                        },
                      ],
                      display_name: 'Less than',
                    },
                  },
                ],
              },
            },
          ],
          default: {
            actions: [],
          },
        },
      ],
      testValue: '<Event>',
      exposeInContext: false,
    },
    ep1mW7: {
      name: 'Focus sibling',
      actions: [
        {
          type: 'Switch',
          cases: [
            {
              actions: [
                {
                  name: '@toddle/focus',
                  label: 'Focus',
                  arguments: [
                    {
                      name: 'Element',
                      type: {
                        type: 'Element',
                      },
                      formula: {
                        name: 'graphqlGetPreviousSibling',
                        type: 'function',
                        label: 'Has previous sibling',
                        arguments: [
                          {
                            name: 'parent',
                            type: {
                              type: 'Unknown',
                            },
                            formula: {
                              name: '@toddle/getElementById',
                              type: 'function',
                              arguments: [
                                {
                                  name: 'Id',
                                  type: {
                                    type: 'String',
                                  },
                                  formula: {
                                    path: [
                                      'Contexts',
                                      'graphql-tree-item-provider',
                                      '6Uj9fT',
                                    ],
                                    type: 'path',
                                  },
                                },
                              ],
                              display_name: 'Get element by id',
                            },
                          },
                          {
                            name: 'currentElement',
                            type: {
                              type: 'Unknown',
                            },
                            formula: {
                              name: '@toddle/getElementById',
                              type: 'function',
                              arguments: [
                                {
                                  name: 'Id',
                                  type: {
                                    type: 'String',
                                  },
                                  formula: {
                                    path: ['Variables', 'Button id'],
                                    type: 'path',
                                  },
                                },
                              ],
                              display_name: 'Get element by id',
                            },
                          },
                          {
                            name: 'loop',
                            type: {
                              type: 'Unknown',
                            },
                            formula: {
                              type: 'value',
                              value: false,
                            },
                          },
                          {
                            name: 'selector',
                            type: {
                              type: 'String',
                            },
                            formula: {
                              name: '@toddle/join',
                              type: 'function',
                              arguments: [
                                {
                                  name: 'Array',
                                  type: {
                                    type: 'Array',
                                  },
                                  formula: {
                                    type: 'array',
                                    arguments: [
                                      {
                                        Name: 0,
                                        formula: {
                                          path: [
                                            'Contexts',
                                            'graphql-tree',
                                            'U5WFN_',
                                          ],
                                          type: 'path',
                                        },
                                      },
                                      {
                                        Name: 0,
                                        formula: {
                                          path: [
                                            'Contexts',
                                            'graphql-tree',
                                            '9Gqtni',
                                          ],
                                          type: 'path',
                                        },
                                      },
                                    ],
                                  },
                                },
                                {
                                  name: 'Separator',
                                  type: {
                                    type: 'String',
                                  },
                                  formula: {
                                    type: 'value',
                                    value: ', ',
                                  },
                                },
                              ],
                              display_name: 'Join',
                            },
                          },
                        ],
                      },
                      description: 'The DOM element that should receive focus.',
                    },
                  ],
                },
              ],
              condition: {
                type: 'and',
                label: 'Has previous sibling',
                arguments: [
                  {
                    formula: {
                      name: 'graphqlGetPreviousSibling',
                      type: 'function',
                      label: 'Has previous sibling',
                      arguments: [
                        {
                          name: 'parent',
                          type: {
                            type: 'Unknown',
                          },
                          formula: {
                            name: '@toddle/getElementById',
                            type: 'function',
                            arguments: [
                              {
                                name: 'Id',
                                type: {
                                  type: 'String',
                                },
                                formula: {
                                  path: [
                                    'Contexts',
                                    'graphql-tree-item-provider',
                                    '6Uj9fT',
                                  ],
                                  type: 'path',
                                },
                              },
                            ],
                            display_name: 'Get element by id',
                          },
                        },
                        {
                          name: 'currentElement',
                          type: {
                            type: 'Unknown',
                          },
                          formula: {
                            name: '@toddle/getElementById',
                            type: 'function',
                            arguments: [
                              {
                                name: 'Id',
                                type: {
                                  type: 'String',
                                },
                                formula: {
                                  path: ['Variables', 'Button id'],
                                  type: 'path',
                                },
                              },
                            ],
                            display_name: 'Get element by id',
                          },
                        },
                        {
                          name: 'loop',
                          type: {
                            type: 'Unknown',
                          },
                          formula: {
                            type: 'value',
                            value: false,
                          },
                        },
                        {
                          name: 'selector',
                          type: {
                            type: 'String',
                          },
                          formula: {
                            name: '@toddle/join',
                            type: 'function',
                            arguments: [
                              {
                                name: 'Array',
                                type: {
                                  type: 'Array',
                                },
                                formula: {
                                  type: 'array',
                                  arguments: [
                                    {
                                      Name: 0,
                                      formula: {
                                        path: [
                                          'Contexts',
                                          'graphql-tree',
                                          'U5WFN_',
                                        ],
                                        type: 'path',
                                      },
                                    },
                                    {
                                      Name: 0,
                                      formula: {
                                        path: [
                                          'Contexts',
                                          'graphql-tree',
                                          '9Gqtni',
                                        ],
                                        type: 'path',
                                      },
                                    },
                                  ],
                                },
                              },
                              {
                                name: 'Separator',
                                type: {
                                  type: 'String',
                                },
                                formula: {
                                  type: 'value',
                                  value: ', ',
                                },
                              },
                            ],
                            display_name: 'Join',
                          },
                        },
                      ],
                    },
                  },
                  {
                    formula: {
                      name: '@toddle/notEqual',
                      type: 'function',
                      arguments: [
                        {
                          name: 'First',
                          type: {
                            type: 'Any',
                          },
                          formula: {
                            name: '@toddle/get',
                            type: 'function',
                            arguments: [
                              {
                                name: 'Object',
                                type: {
                                  type: 'Array \\| Object \\| String',
                                },
                                formula: {
                                  name: 'graphqlGetPreviousSibling',
                                  type: 'function',
                                  label: 'Has previous sibling',
                                  arguments: [
                                    {
                                      name: 'parent',
                                      type: {
                                        type: 'Unknown',
                                      },
                                      formula: {
                                        name: '@toddle/getElementById',
                                        type: 'function',
                                        arguments: [
                                          {
                                            name: 'Id',
                                            type: {
                                              type: 'String',
                                            },
                                            formula: {
                                              path: [
                                                'Contexts',
                                                'graphql-tree-item-provider',
                                                '6Uj9fT',
                                              ],
                                              type: 'path',
                                            },
                                          },
                                        ],
                                        display_name: 'Get element by id',
                                      },
                                    },
                                    {
                                      name: 'currentElement',
                                      type: {
                                        type: 'Unknown',
                                      },
                                      formula: {
                                        name: '@toddle/getElementById',
                                        type: 'function',
                                        arguments: [
                                          {
                                            name: 'Id',
                                            type: {
                                              type: 'String',
                                            },
                                            formula: {
                                              path: ['Variables', 'Button id'],
                                              type: 'path',
                                            },
                                          },
                                        ],
                                        display_name: 'Get element by id',
                                      },
                                    },
                                    {
                                      name: 'loop',
                                      type: {
                                        type: 'Unknown',
                                      },
                                      formula: null,
                                    },
                                    {
                                      name: 'selector',
                                      type: {
                                        type: 'String',
                                      },
                                      formula: {
                                        name: '@toddle/join',
                                        type: 'function',
                                        arguments: [
                                          {
                                            name: 'Array',
                                            type: {
                                              type: 'Array',
                                            },
                                            formula: {
                                              type: 'array',
                                              arguments: [
                                                {
                                                  Name: 0,
                                                  formula: {
                                                    path: [
                                                      'Contexts',
                                                      'graphql-tree',
                                                      '9Gqtni',
                                                    ],
                                                    type: 'path',
                                                  },
                                                },
                                                {
                                                  Name: 0,
                                                  formula: {
                                                    path: [
                                                      'Contexts',
                                                      'graphql-tree',
                                                      'U5WFN_',
                                                    ],
                                                    type: 'path',
                                                  },
                                                },
                                              ],
                                            },
                                          },
                                          {
                                            name: 'Separator',
                                            type: {
                                              type: 'String',
                                            },
                                            formula: {
                                              type: 'value',
                                              value: ', ',
                                            },
                                          },
                                        ],
                                        display_name: 'Join',
                                      },
                                    },
                                  ],
                                },
                              },
                              {
                                name: 'Path',
                                type: {
                                  type: 'Array<String> \\| Number \\| String',
                                },
                                formula: {
                                  type: 'value',
                                  value: 'id',
                                },
                              },
                            ],
                            display_name: 'Get',
                          },
                        },
                        {
                          name: 'Second',
                          type: {
                            type: 'Any',
                          },
                          formula: {
                            path: ['Variables', 'Button id'],
                            type: 'path',
                          },
                        },
                      ],
                      display_name: 'Not equal',
                    },
                  },
                  {
                    formula: {
                      name: '@toddle/not',
                      type: 'function',
                      arguments: [
                        {
                          name: 'Input',
                          type: {
                            type: 'Boolean',
                          },
                          formula: {
                            name: '@toddle/includes',
                            type: 'function',
                            arguments: [
                              {
                                name: 'Array',
                                type: {
                                  type: 'Array \\| String',
                                },
                                formula: {
                                  path: ['Variables', 'Unfocusable item ids'],
                                  type: 'path',
                                },
                              },
                              {
                                name: 'Item',
                                type: {
                                  type: 'Any',
                                },
                                formula: {
                                  name: '@toddle/get',
                                  type: 'function',
                                  arguments: [
                                    {
                                      name: 'Object',
                                      type: {
                                        type: 'Array \\| Object \\| String',
                                      },
                                      formula: {
                                        name: 'graphqlGetPreviousSibling',
                                        type: 'function',
                                        label: 'Has previous sibling',
                                        arguments: [
                                          {
                                            name: 'parent',
                                            type: {
                                              type: 'Unknown',
                                            },
                                            formula: {
                                              name: '@toddle/getElementById',
                                              type: 'function',
                                              arguments: [
                                                {
                                                  name: 'Id',
                                                  type: {
                                                    type: 'String',
                                                  },
                                                  formula: {
                                                    path: [
                                                      'Contexts',
                                                      'graphql-tree-item-provider',
                                                      '6Uj9fT',
                                                    ],
                                                    type: 'path',
                                                  },
                                                },
                                              ],
                                              display_name: 'Get element by id',
                                            },
                                          },
                                          {
                                            name: 'currentElement',
                                            type: {
                                              type: 'Unknown',
                                            },
                                            formula: {
                                              name: '@toddle/getElementById',
                                              type: 'function',
                                              arguments: [
                                                {
                                                  name: 'Id',
                                                  type: {
                                                    type: 'String',
                                                  },
                                                  formula: {
                                                    path: [
                                                      'Variables',
                                                      'Button id',
                                                    ],
                                                    type: 'path',
                                                  },
                                                },
                                              ],
                                              display_name: 'Get element by id',
                                            },
                                          },
                                          {
                                            name: 'loop',
                                            type: {
                                              type: 'Unknown',
                                            },
                                            formula: null,
                                          },
                                          {
                                            name: 'selector',
                                            type: {
                                              type: 'String',
                                            },
                                            formula: {
                                              name: '@toddle/join',
                                              type: 'function',
                                              arguments: [
                                                {
                                                  name: 'Array',
                                                  type: {
                                                    type: 'Array',
                                                  },
                                                  formula: {
                                                    type: 'array',
                                                    arguments: [
                                                      {
                                                        Name: 0,
                                                        formula: {
                                                          path: [
                                                            'Contexts',
                                                            'graphql-tree',
                                                            '9Gqtni',
                                                          ],
                                                          type: 'path',
                                                        },
                                                      },
                                                      {
                                                        Name: 0,
                                                        formula: {
                                                          path: [
                                                            'Contexts',
                                                            'graphql-tree',
                                                            'U5WFN_',
                                                          ],
                                                          type: 'path',
                                                        },
                                                      },
                                                    ],
                                                  },
                                                },
                                                {
                                                  name: 'Separator',
                                                  type: {
                                                    type: 'String',
                                                  },
                                                  formula: {
                                                    type: 'value',
                                                    value: ', ',
                                                  },
                                                },
                                              ],
                                              display_name: 'Join',
                                            },
                                          },
                                        ],
                                      },
                                    },
                                    {
                                      name: 'Path',
                                      type: {
                                        type: 'Array<String> \\| Number \\| String',
                                      },
                                      formula: {
                                        type: 'value',
                                        value: 'id',
                                      },
                                    },
                                  ],
                                  display_name: 'Get',
                                },
                              },
                            ],
                            display_name: 'Includes',
                          },
                        },
                      ],
                      display_name: 'Not',
                    },
                  },
                ],
              },
            },
            {
              actions: [
                {
                  name: '@toddle/focus',
                  label: 'Focus',
                  arguments: [
                    {
                      name: 'Element',
                      type: {
                        type: 'Element',
                      },
                      formula: {
                        name: 'graphqlGetNextSibling',
                        type: 'function',
                        label: 'Has previous sibling',
                        arguments: [
                          {
                            name: 'parent',
                            type: {
                              type: 'Unknown',
                            },
                            formula: {
                              name: '@toddle/getElementById',
                              type: 'function',
                              arguments: [
                                {
                                  name: 'Id',
                                  type: {
                                    type: 'String',
                                  },
                                  formula: {
                                    path: [
                                      'Contexts',
                                      'graphql-tree-item-provider',
                                      '6Uj9fT',
                                    ],
                                    type: 'path',
                                  },
                                },
                              ],
                              display_name: 'Get element by id',
                            },
                          },
                          {
                            name: 'currentElement',
                            type: {
                              type: 'Unknown',
                            },
                            formula: {
                              name: '@toddle/getElementById',
                              type: 'function',
                              arguments: [
                                {
                                  name: 'Id',
                                  type: {
                                    type: 'String',
                                  },
                                  formula: {
                                    path: ['Variables', 'Button id'],
                                    type: 'path',
                                  },
                                },
                              ],
                              display_name: 'Get element by id',
                            },
                          },
                          {
                            name: 'loop',
                            type: {
                              type: 'Unknown',
                            },
                            formula: {
                              type: 'value',
                              value: false,
                            },
                          },
                          {
                            name: 'selector',
                            type: {
                              type: 'String',
                            },
                            formula: {
                              name: '@toddle/join',
                              type: 'function',
                              arguments: [
                                {
                                  name: 'Array',
                                  type: {
                                    type: 'Array',
                                  },
                                  formula: {
                                    type: 'array',
                                    arguments: [
                                      {
                                        Name: 0,
                                        formula: {
                                          path: [
                                            'Contexts',
                                            'graphql-tree',
                                            'U5WFN_',
                                          ],
                                          type: 'path',
                                        },
                                      },
                                      {
                                        Name: 0,
                                        formula: {
                                          path: [
                                            'Contexts',
                                            'graphql-tree',
                                            '9Gqtni',
                                          ],
                                          type: 'path',
                                        },
                                      },
                                    ],
                                  },
                                },
                                {
                                  name: 'Separator',
                                  type: {
                                    type: 'String',
                                  },
                                  formula: {
                                    type: 'value',
                                    value: ', ',
                                  },
                                },
                              ],
                              display_name: 'Join',
                            },
                          },
                        ],
                      },
                      description: 'The DOM element that should receive focus.',
                    },
                  ],
                },
              ],
              condition: {
                type: 'and',
                label: 'Has next sibling',
                arguments: [
                  {
                    formula: {
                      name: 'graphqlGetNextSibling',
                      type: 'function',
                      arguments: [
                        {
                          name: 'parent',
                          type: {
                            type: 'Unknown',
                          },
                          formula: {
                            name: '@toddle/getElementById',
                            type: 'function',
                            arguments: [
                              {
                                name: 'Id',
                                type: {
                                  type: 'String',
                                },
                                formula: {
                                  path: [
                                    'Contexts',
                                    'graphql-tree-item-provider',
                                    '6Uj9fT',
                                  ],
                                  type: 'path',
                                },
                              },
                            ],
                            display_name: 'Get element by id',
                          },
                        },
                        {
                          name: 'currentElement',
                          type: {
                            type: 'Unknown',
                          },
                          formula: {
                            name: '@toddle/getElementById',
                            type: 'function',
                            arguments: [
                              {
                                name: 'Id',
                                type: {
                                  type: 'String',
                                },
                                formula: {
                                  path: ['Variables', 'Button id'],
                                  type: 'path',
                                },
                              },
                            ],
                            display_name: 'Get element by id',
                          },
                        },
                        {
                          name: 'loop',
                          type: {
                            type: 'Unknown',
                          },
                          formula: {
                            type: 'value',
                            value: false,
                          },
                        },
                        {
                          name: 'selector',
                          type: {
                            type: 'String',
                          },
                          formula: {
                            name: '@toddle/join',
                            type: 'function',
                            arguments: [
                              {
                                name: 'Array',
                                type: {
                                  type: 'Array',
                                },
                                formula: {
                                  type: 'array',
                                  arguments: [
                                    {
                                      Name: 0,
                                      formula: {
                                        path: [
                                          'Contexts',
                                          'graphql-tree',
                                          'U5WFN_',
                                        ],
                                        type: 'path',
                                      },
                                    },
                                    {
                                      Name: 0,
                                      formula: {
                                        path: [
                                          'Contexts',
                                          'graphql-tree',
                                          '9Gqtni',
                                        ],
                                        type: 'path',
                                      },
                                    },
                                  ],
                                },
                              },
                              {
                                name: 'Separator',
                                type: {
                                  type: 'String',
                                },
                                formula: {
                                  type: 'value',
                                  value: ', ',
                                },
                              },
                            ],
                            display_name: 'Join',
                          },
                        },
                      ],
                    },
                  },
                  {
                    formula: {
                      name: '@toddle/notEqual',
                      type: 'function',
                      arguments: [
                        {
                          name: 'First',
                          type: {
                            type: 'Any',
                          },
                          formula: {
                            name: '@toddle/get',
                            type: 'function',
                            arguments: [
                              {
                                name: 'Object',
                                type: {
                                  type: 'Array \\| Object \\| String',
                                },
                                formula: {
                                  name: 'graphqlGetNextSibling',
                                  type: 'function',
                                  arguments: [
                                    {
                                      name: 'parent',
                                      type: {
                                        type: 'Unknown',
                                      },
                                      formula: {
                                        name: '@toddle/getElementById',
                                        type: 'function',
                                        arguments: [
                                          {
                                            name: 'Id',
                                            type: {
                                              type: 'String',
                                            },
                                            formula: {
                                              path: [
                                                'Contexts',
                                                'graphql-tree-item-provider',
                                                '6Uj9fT',
                                              ],
                                              type: 'path',
                                            },
                                          },
                                        ],
                                        display_name: 'Get element by id',
                                      },
                                    },
                                    {
                                      name: 'currentElement',
                                      type: {
                                        type: 'Unknown',
                                      },
                                      formula: {
                                        name: '@toddle/getElementById',
                                        type: 'function',
                                        arguments: [
                                          {
                                            name: 'Id',
                                            type: {
                                              type: 'String',
                                            },
                                            formula: {
                                              path: ['Variables', 'Button id'],
                                              type: 'path',
                                            },
                                          },
                                        ],
                                        display_name: 'Get element by id',
                                      },
                                    },
                                    {
                                      name: 'loop',
                                      type: {
                                        type: 'Unknown',
                                      },
                                      formula: null,
                                    },
                                    {
                                      name: 'selector',
                                      type: {
                                        type: 'String',
                                      },
                                      formula: {
                                        name: '@toddle/join',
                                        type: 'function',
                                        arguments: [
                                          {
                                            name: 'Array',
                                            type: {
                                              type: 'Array',
                                            },
                                            formula: {
                                              type: 'array',
                                              arguments: [
                                                {
                                                  Name: 0,
                                                  formula: {
                                                    path: [
                                                      'Contexts',
                                                      'graphql-tree',
                                                      '9Gqtni',
                                                    ],
                                                    type: 'path',
                                                  },
                                                },
                                                {
                                                  Name: 0,
                                                  formula: {
                                                    path: [
                                                      'Contexts',
                                                      'graphql-tree',
                                                      'U5WFN_',
                                                    ],
                                                    type: 'path',
                                                  },
                                                },
                                              ],
                                            },
                                          },
                                          {
                                            name: 'Separator',
                                            type: {
                                              type: 'String',
                                            },
                                            formula: {
                                              type: 'value',
                                              value: ', ',
                                            },
                                          },
                                        ],
                                        display_name: 'Join',
                                      },
                                    },
                                  ],
                                },
                              },
                              {
                                name: 'Path',
                                type: {
                                  type: 'Array<String> \\| Number \\| String',
                                },
                                formula: {
                                  type: 'value',
                                  value: 'id',
                                },
                              },
                            ],
                            display_name: 'Get',
                          },
                        },
                        {
                          name: 'Second',
                          type: {
                            type: 'Any',
                          },
                          formula: {
                            path: ['Variables', 'Button id'],
                            type: 'path',
                          },
                        },
                      ],
                      display_name: 'Not equal',
                    },
                  },
                  {
                    formula: {
                      name: '@toddle/not',
                      type: 'function',
                      arguments: [
                        {
                          name: 'Input',
                          type: {
                            type: 'Boolean',
                          },
                          formula: {
                            name: '@toddle/includes',
                            type: 'function',
                            arguments: [
                              {
                                name: 'Array',
                                type: {
                                  type: 'Array \\| String',
                                },
                                formula: {
                                  path: ['Variables', 'Unfocusable item ids'],
                                  type: 'path',
                                },
                              },
                              {
                                name: 'Item',
                                type: {
                                  type: 'Any',
                                },
                                formula: {
                                  name: '@toddle/get',
                                  type: 'function',
                                  arguments: [
                                    {
                                      name: 'Object',
                                      type: {
                                        type: 'Array \\| Object \\| String',
                                      },
                                      formula: {
                                        name: 'graphqlGetNextSibling',
                                        type: 'function',
                                        arguments: [
                                          {
                                            name: 'parent',
                                            type: {
                                              type: 'Unknown',
                                            },
                                            formula: {
                                              name: '@toddle/getElementById',
                                              type: 'function',
                                              arguments: [
                                                {
                                                  name: 'Id',
                                                  type: {
                                                    type: 'String',
                                                  },
                                                  formula: {
                                                    path: [
                                                      'Contexts',
                                                      'graphql-tree-item-provider',
                                                      '6Uj9fT',
                                                    ],
                                                    type: 'path',
                                                  },
                                                },
                                              ],
                                              display_name: 'Get element by id',
                                            },
                                          },
                                          {
                                            name: 'currentElement',
                                            type: {
                                              type: 'Unknown',
                                            },
                                            formula: {
                                              name: '@toddle/getElementById',
                                              type: 'function',
                                              arguments: [
                                                {
                                                  name: 'Id',
                                                  type: {
                                                    type: 'String',
                                                  },
                                                  formula: {
                                                    path: [
                                                      'Variables',
                                                      'Button id',
                                                    ],
                                                    type: 'path',
                                                  },
                                                },
                                              ],
                                              display_name: 'Get element by id',
                                            },
                                          },
                                          {
                                            name: 'loop',
                                            type: {
                                              type: 'Unknown',
                                            },
                                            formula: null,
                                          },
                                          {
                                            name: 'selector',
                                            type: {
                                              type: 'String',
                                            },
                                            formula: {
                                              name: '@toddle/join',
                                              type: 'function',
                                              arguments: [
                                                {
                                                  name: 'Array',
                                                  type: {
                                                    type: 'Array',
                                                  },
                                                  formula: {
                                                    type: 'array',
                                                    arguments: [
                                                      {
                                                        Name: 0,
                                                        formula: {
                                                          path: [
                                                            'Contexts',
                                                            'graphql-tree',
                                                            '9Gqtni',
                                                          ],
                                                          type: 'path',
                                                        },
                                                      },
                                                      {
                                                        Name: 0,
                                                        formula: {
                                                          path: [
                                                            'Contexts',
                                                            'graphql-tree',
                                                            'U5WFN_',
                                                          ],
                                                          type: 'path',
                                                        },
                                                      },
                                                    ],
                                                  },
                                                },
                                                {
                                                  name: 'Separator',
                                                  type: {
                                                    type: 'String',
                                                  },
                                                  formula: {
                                                    type: 'value',
                                                    value: ', ',
                                                  },
                                                },
                                              ],
                                              display_name: 'Join',
                                            },
                                          },
                                        ],
                                      },
                                    },
                                    {
                                      name: 'Path',
                                      type: {
                                        type: 'Array<String> \\| Number \\| String',
                                      },
                                      formula: {
                                        type: 'value',
                                        value: 'id',
                                      },
                                    },
                                  ],
                                  display_name: 'Get',
                                },
                              },
                            ],
                            display_name: 'Includes',
                          },
                        },
                      ],
                      display_name: 'Not',
                    },
                  },
                ],
              },
            },
          ],
          default: {
            actions: [
              {
                type: 'TriggerWorkflow',
                workflow: 'VpLHn5',
                parameters: {
                  isFocusingParent: {
                    type: 'value',
                    formula: null,
                  },
                  unfocusableItemIds: {
                    formula: {
                      name: '@toddle/append',
                      type: 'function',
                      arguments: [
                        {
                          name: 'Array',
                          type: {
                            type: 'Array',
                          },
                          formula: {
                            path: ['Variables', 'Unfocusable item ids'],
                            type: 'path',
                          },
                        },
                        {
                          name: 'Item',
                          type: {
                            type: 'Any',
                          },
                          formula: {
                            path: ['Variables', 'Button id'],
                            type: 'path',
                          },
                        },
                      ],
                      display_name: 'Append',
                    },
                  },
                },
                contextProvider: 'graphql-tree-item-provider',
              },
            ],
          },
        },
      ],
      testValue: '<Event>',
      parameters: [
        {
          name: 'isRemovingRoot',
          testValue: true,
        },
      ],
      exposeInContext: false,
    },
    fLyCgA: {
      name: 'Update focused path',
      actions: [
        {
          data: {
            type: 'value',
            value: true,
          },
          type: 'SetVariable',
          variable: 'Is focused',
        },
        {
          type: 'TriggerWorkflow',
          workflow: 'IiDNlG',
          parameters: {
            data: {
              type: 'value',
              formula: {
                path: ['Attributes', 'data'],
                type: 'path',
              },
            },
            path: {
              formula: {
                name: 'wKA68w',
                type: 'apply',
                arguments: [],
              },
            },
          },
          contextProvider: 'graphql-state-provider',
        },
      ],
      testValue: '<Event>',
      parameters: [],
      exposeInContext: false,
    },
    oke_SW: {
      name: 'Toggle popover',
      actions: [
        {
          data: {
            path: ['Parameters', 'isOpen'],
            type: 'path',
          },
          type: 'SetVariable',
          variable: 'Is popover open',
        },
      ],
      testValue: '<Event>',
      parameters: [
        {
          name: 'isOpen',
          testValue: '',
        },
      ],
      exposeInContext: false,
    },
    osJJfp: {
      name: 'Focus self',
      actions: [
        {
          name: '@toddle/sleep',
          label: 'Sleep',
          events: {
            tick: {
              actions: [
                {
                  name: '@toddle/focus',
                  label: 'Focus',
                  arguments: [
                    {
                      name: 'Element',
                      type: {
                        type: 'Element',
                      },
                      formula: {
                        name: '@toddle/getElementById',
                        type: 'function',
                        arguments: [
                          {
                            name: 'Id',
                            type: {
                              type: 'String',
                            },
                            formula: {
                              path: ['Variables', 'Button id'],
                              type: 'path',
                            },
                          },
                        ],
                        display_name: 'Get element by id',
                      },
                      description: 'The DOM element that should receive focus.',
                    },
                  ],
                },
              ],
              trigger: 'tick',
            },
          },
          arguments: [
            {
              name: 'Delay in milliseconds',
              type: {
                type: 'Number',
              },
              formula: {
                type: 'value',
                value: 50,
              },
              description:
                'The number of milliseconds to wait before an action is executed.',
            },
          ],
        },
      ],
      testValue: '<Event>',
      exposeInContext: false,
    },
    s4fde_: {
      name: 'Handle click icon button',
      actions: [
        {
          type: 'Switch',
          cases: [
            {
              actions: [
                {
                  type: 'TriggerWorkflow',
                  workflow: 'p373Ni',
                  parameters: {
                    path: {
                      formula: {
                        name: 'wKA68w',
                        type: 'apply',
                        arguments: [],
                      },
                    },
                  },
                  contextProvider: 'graphql-state-provider',
                },
                {
                  type: 'TriggerWorkflow',
                  workflow: 'eXmVSw',
                  parameters: null,
                },
              ],
              condition: {
                name: '_hqUE3',
                type: 'apply',
                label: 'Should show children',
                arguments: [],
              },
            },
            {
              actions: [
                {
                  type: 'TriggerWorkflow',
                  workflow: 'UxJ9O0',
                  parameters: {
                    path: {
                      formula: {
                        name: 'wKA68w',
                        type: 'apply',
                        arguments: [],
                      },
                    },
                  },
                  contextProvider: 'graphql-state-provider',
                },
                {
                  type: 'TriggerWorkflow',
                  workflow: 'eXmVSw',
                  parameters: null,
                },
              ],
              condition: {
                name: '9th4ws',
                type: 'apply',
                label: 'Should hide children',
                arguments: [],
              },
            },
          ],
          default: {
            actions: [
              {
                type: 'TriggerWorkflow',
                workflow: 'uyFbZk',
                parameters: {},
              },
            ],
          },
        },
      ],
      testValue: '<Event>',
      exposeInContext: false,
    },
    uyFbZk: {
      name: 'Toggle selection',
      actions: [
        {
          type: 'Switch',
          cases: [
            {
              actions: [
                {
                  type: 'TriggerWorkflow',
                  workflow: 'oke_SW',
                  parameters: {
                    isOpen: {
                      formula: {
                        type: 'value',
                        value: true,
                      },
                    },
                  },
                },
              ],
              condition: {
                name: '@toddle/not',
                type: 'function',
                label: 'Should open argument',
                arguments: [
                  {
                    name: 'Input',
                    type: {
                      type: 'Boolean',
                    },
                    formula: {
                      path: ['Variables', 'Is popover open'],
                      type: 'path',
                    },
                  },
                ],
                display_name: 'Not',
              },
            },
          ],
          default: {
            actions: [
              {
                type: 'TriggerWorkflow',
                workflow: 'oke_SW',
                parameters: {
                  isOpen: {
                    formula: {
                      type: 'value',
                      value: false,
                    },
                  },
                },
              },
            ],
          },
        },
      ],
      testValue: '<Event>',
      parameters: [],
      exposeInContext: false,
    },
  },
  attributes: {
    data: {
      name: 'data',
      testValue: {
        key: 'inputFields',
        name: 'filter',
        type: {
          kind: 'INPUT_OBJECT',
          name: 'Asset',
          ofType: null,
        },
        description: null,
        inputFields: [
          {
            name: 'id',
            type: {
              kind: 'NON_NULL',
              name: null,
              ofType: {
                kind: 'SCALAR',
                name: 'String',
                ofType: null,
              },
            },
            description: null,
            defaultValue: null,
          },
          {
            name: 'locale',
            type: {
              kind: 'SCALAR',
              name: 'String',
              ofType: null,
            },
            description: null,
            defaultValue: null,
          },
          {
            name: 'preview',
            type: {
              kind: 'SCALAR',
              name: 'Boolean',
              ofType: null,
            },
            description: null,
            defaultValue: null,
          },
        ],
        isDeprecated: false,
        deprecationReason: null,
      },
    },
    indent: {
      name: 'indent',
      testValue: 0,
    },
    'parent-path': {
      name: 'parent-path',
      testValue: 'query-fields/exercises',
    },
    'update-children': {
      name: 'update-children',
      testValue: true,
    },
  },
  onAttributeChange: {
    actions: [
      {
        type: 'Switch',
        cases: [
          {
            actions: [
              {
                type: 'TriggerWorkflow',
                workflow: 'eXmVSw',
                parameters: null,
              },
            ],
            condition: {
              path: ['Attributes', 'update-children'],
              type: 'path',
              label: 'Should update children',
            },
          },
        ],
        default: {
          actions: [],
        },
      },
    ],
    trigger: 'Attribute change',
  },
}
