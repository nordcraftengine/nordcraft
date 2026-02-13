import type { CustomActionModel } from '@nordcraft/core/dist/component/component.types'
import { describe, expect, test } from 'bun:test'
import { fixProject } from '../../../fixProject'
import { searchProject } from '../../../searchProject'
import { unknownActionEventRule } from './unknownActionEventRule'

describe('finds unknownActionEventRule', () => {
  test('should find invalid action events', () => {
    const problems = Array.from(
      searchProject({
        files: {
          actions: {
            'legacy-action': {
              name: 'legacy-action',
              handler: '',
              arguments: [],
              events: {
                success: { dummyEvent: 'hello' },
              },
              variableArguments: false,
            },
            'modern-action': {
              name: 'modern-action',
              handler: '',
              version: 2,
              arguments: [],
              events: {
                success: { dummyEvent: 'hello' },
              },
              variableArguments: false,
            },
          },
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              onLoad: {
                trigger: 'onLoad',
                actions: [
                  {
                    name: 'legacy-action',
                    arguments: [],
                    events: {
                      nonExistingEvent: { actions: [] },
                    },
                  },
                  {
                    name: 'modern-action',
                    arguments: [],
                    events: {
                      nonExistingEvent: { actions: [] },
                    },
                  },
                ],
              },
            },
          },
        },
        rules: [unknownActionEventRule],
      }),
    )

    expect(problems).toHaveLength(2)
    expect(problems[0].code).toBe('unknown action event')
    expect(problems[0].details).toEqual({ name: 'nonExistingEvent' })
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'onLoad',
      'actions',
      '0',
      'events',
      'nonExistingEvent',
    ])
    expect(problems[1].code).toBe('unknown action event')
    expect(problems[1].details).toEqual({ name: 'nonExistingEvent' })
    expect(problems[1].path).toEqual([
      'components',
      'test',
      'onLoad',
      'actions',
      '1',
      'events',
      'nonExistingEvent',
    ])
  })
  test('should not find valid action events', () => {
    const problems = Array.from(
      searchProject({
        files: {
          actions: {
            'legacy-action': {
              name: 'legacy-action',
              handler: '',
              arguments: [],
              events: {
                success: { dummyEvent: 'hello' },
              },
              variableArguments: false,
            },
            'modern-action': {
              name: 'modern-action',
              handler: '',
              version: 2,
              arguments: [],
              events: {
                success: { dummyEvent: 'hello' },
              },
              variableArguments: false,
            },
          },
          components: {
            test: {
              name: 'test',
              nodes: {},
              formulas: {},
              apis: {},
              attributes: {},
              variables: {},
              onLoad: {
                trigger: 'onLoad',
                actions: [
                  {
                    name: 'legacy-action',
                    arguments: [],
                    events: {
                      success: { actions: [] },
                    },
                  },
                  {
                    name: 'modern-action',
                    arguments: [],
                    events: {
                      success: { actions: [] },
                    },
                  },
                ],
              },
            },
          },
        },
        rules: [unknownActionEventRule],
      }),
    )

    expect(problems).toBeEmpty()
  })
})

describe('fix unknownActionEventRule', () => {
  test('should fix invalid action events', () => {
    const fixedProject = fixProject({
      files: {
        actions: {
          'legacy-action': {
            name: 'legacy-action',
            handler: '',
            arguments: [],
            events: {
              success: { dummyEvent: 'hello' },
            },
            variableArguments: false,
          },
          'modern-action': {
            name: 'modern-action',
            handler: '',
            version: 2,
            arguments: [],
            events: {
              success: { dummyEvent: 'hello' },
            },
            variableArguments: false,
          },
        },
        components: {
          test: {
            name: 'test',
            nodes: {},
            formulas: {},
            apis: {},
            attributes: {},
            variables: {},
            onLoad: {
              trigger: 'onLoad',
              actions: [
                {
                  name: 'legacy-action',
                  arguments: [],
                  events: {
                    success: { actions: [] },
                    nonExistingEvent: { actions: [] },
                  },
                },
                {
                  name: 'modern-action',
                  arguments: [],
                  events: {
                    success: { actions: [] },
                    nonExistingEvent: { actions: [] },
                  },
                },
              ],
            },
          },
        },
      },
      rule: unknownActionEventRule,
      fixType: 'delete-unknown-action-event',
      state: {},
    })

    expect(
      (
        fixedProject.components['test']?.onLoad
          ?.actions?.[0] as CustomActionModel
      ).events,
    ).toEqual({
      success: {
        actions: [],
      },
    })
    expect(
      (
        fixedProject.components['test']?.onLoad
          ?.actions?.[1] as CustomActionModel
      ).events,
    ).toEqual({
      success: {
        actions: [],
      },
    })
  })
  test('should not remove valid action arguments', () => {
    const files = {
      actions: {
        'legacy-action': {
          name: 'legacy-action',
          handler: '',
          arguments: [],
          events: {
            success: { dummyEvent: 'hello' },
          },
          variableArguments: false,
        },
        'modern-action': {
          name: 'modern-action',
          handler: '',
          version: 2,
          arguments: [],
          events: {
            success: { dummyEvent: 'hello' },
          },
          variableArguments: false,
        },
      },
      components: {
        test: {
          name: 'test',
          nodes: {},
          formulas: {},
          apis: {},
          attributes: {},
          variables: {},
          onLoad: {
            trigger: 'onLoad',
            actions: [
              {
                name: 'legacy-action',
                arguments: [],
                events: {
                  success: { actions: [] },
                },
              },
              {
                name: 'modern-action',
                arguments: [],
                events: {
                  success: { actions: [] },
                },
              },
            ],
          },
        },
      },
    }
    const fixedProject = fixProject({
      files,
      rule: unknownActionEventRule,
      fixType: 'delete-unknown-action-argument',
      state: {},
    })
    expect(fixedProject).toEqual(files)
  })
})
