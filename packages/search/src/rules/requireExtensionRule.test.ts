import { describe, expect, test } from 'bun:test'
import { searchProject } from '../searchProject'
import { requireExtensionRule } from './requireExtensionRule'

describe('requireExtension', () => {
  test('should report missing browser extension', () => {
    const problems = Array.from(
      searchProject({
        files: {
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
                    name: '@toddle/setSessionCookies',
                    arguments: [],
                  },
                ],
              },
            },
          },
        },
        rules: [requireExtensionRule],
        state: {
          isBrowserExtensionAvailable: false,
        },
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('required extension')
  })
  test('should not report missing browser extension', () => {
    const problems = Array.from(
      searchProject({
        files: {
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
                    type: 'Custom',
                    name: 'Set session cookies',
                    arguments: [],
                  },
                ],
              },
            },
          },
        },
        rules: [requireExtensionRule],
        state: {
          isBrowserExtensionAvailable: true,
        },
      }),
    )

    expect(problems).toHaveLength(0)
  })
})
