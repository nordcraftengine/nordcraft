import { describe, expect, test } from 'bun:test'
import { searchProject } from '../../../searchProject'
import { noIndexRepeatKeyRule } from './noIndexRepeatKeyRule'

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

describe('noIndexRepeatKeyRule', () => {
  test('should report direct index usage', () => {
    const problems = Array.from(
      searchProject({
        files: baseComponent({
          type: 'path',
          path: ['ListItem', 'Index'],
        }) as any,
        rules: [noIndexRepeatKeyRule],
      }),
    )
    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-index-repeat-key')
    expect(problems[0].path).toEqual([
      'components',
      'test',
      'nodes',
      'root',
      'repeatKey',
    ])
  })

  test('should report index used anywhere nested in formula', () => {
    const problems = Array.from(
      searchProject({
        files: baseComponent({
          type: 'function',
          name: 'concat',
          arguments: [
            { formula: { type: 'path', path: ['ListItem', 'Item', 'id'] } },
            { formula: { type: 'path', path: ['ListItem', 'Index'] } },
          ],
        }) as any,
        rules: [noIndexRepeatKeyRule],
      }),
    )
    expect(problems).toHaveLength(1)
    expect(problems[0].code).toBe('no-index-repeat-key')
  })

  test('should not report item id usage', () => {
    const problems = Array.from(
      searchProject({
        files: baseComponent({
          type: 'path',
          path: ['ListItem', 'Item', 'id'],
        }) as any,
        rules: [noIndexRepeatKeyRule],
      }),
    )
    expect(problems).toBeEmpty()
  })
})
