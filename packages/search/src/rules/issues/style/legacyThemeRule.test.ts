import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { legacyThemeRule } from './legacyThemeRule'

describe('legacyThemeRule', () => {
  test('should detect legacy themes variables', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {},
          themes: {
            default: {
              fonts: [],
            },
          },
        },
        rules: [legacyThemeRule],
      }),
    )

    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('legacy style variable')
  })

  test('should not report when propertyDefinitions has values', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {},
          themes: {
            default: {
              fonts: [],
              propertyDefinitions: {
                '--custom-color': {
                  description: 'A custom color',
                  syntax: {
                    type: 'primitive',
                    name: 'color',
                  },
                  inherits: false,
                  initialValue: '#000000',
                  values: {},
                },
              },
            },
          },
        },
        rules: [legacyThemeRule],
      }),
    )
    expect(problems).toBeEmpty()
  })

  test('should not report when propertyDefinitions is an empty object', () => {
    const problems = Array.from(
      searchProject({
        files: {
          components: {},
          themes: {
            default: {
              fonts: [],
              propertyDefinitions: {},
            },
          },
        },
        rules: [legacyThemeRule],
      }),
    )
    expect(problems).toBeEmpty()
  })
})
