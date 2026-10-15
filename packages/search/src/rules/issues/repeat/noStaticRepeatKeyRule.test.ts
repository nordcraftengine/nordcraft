import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { noStaticRepeatKeyRule } from './noStaticRepeatKeyRule'

const baseComponent = (repeatKey: any) => ({
  components: {
    test: {
      name: 'test',
      nodes: {
        root: {
          type: 'element',
          tag: 'div',
          repeat: { type: 'value', value: [1, 2, 3] },
          repeatKey,
        },
      },
      formulas: {},
      apis: {},
      attributes: {},
      variables: {},
    },
  },
})

describe('noStaticRepeatKeyRule', () => {
  test('should report static value repeat key', () => {
    const problems = Array.from(
      searchProject({
        files: baseComponent({ type: 'value', value: 'my-key' }) as any,
        rules: [noStaticRepeatKeyRule],
      }),
    )
    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-static-repeat-key')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      'root',
      'repeatKey',
    ])
  })

  test('should not report dynamic repeat key', () => {
    const problems = Array.from(
      searchProject({
        files: baseComponent({
          type: 'path',
          path: ['ListItem', 'Item', 'id'],
        }) as any,
        rules: [noStaticRepeatKeyRule],
      }),
    )
    expect(problems).toBeEmpty()
  })

  test('should not report when repeatKey is missing', () => {
    const problems = Array.from(
      searchProject({
        files: baseComponent(null) as any,
        rules: [noStaticRepeatKeyRule],
      }),
    )
    expect(problems).toBeEmpty()
  })
})
