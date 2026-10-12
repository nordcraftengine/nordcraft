import type { Formula } from '@nordcraft/core/dist/formula/formula'
import type { Nullable } from '@nordcraft/core/dist/types'
import type { ComponentNodeNode, IssueRule } from '../../../types'

export const containsRepeatIndex = (formula?: Nullable<Formula>): boolean => {
  if (!formula || typeof formula !== 'object') {
    return false
  }
  if (formula.type === 'path') {
    const path = (formula.path ?? []) as Array<string | number>
    // Flag if index is used ANYWHERE in the formula, e.g.:
    // ["ListItem", "Index"], ["ListItem", "Parent", "Index"], etc.
    return path[0] === 'ListItem' && path.includes('Index')
  }
  switch (formula.type) {
    case 'value':
      return false
    case 'function':
    case 'apply':
    case 'record':
    case 'object':
    case 'array':
    case 'or':
    case 'and': {
      const args =
        (formula as { arguments?: Nullable<Array<{ formula: Formula }>> })
          .arguments ?? []
      // record uses `entries`, but entries also contain `{ formula }`
      const entries =
        (formula as { entries?: Nullable<Array<{ formula: Formula }>> })
          .entries ?? []
      return (
        args.some((arg) => containsRepeatIndex(arg?.formula)) ||
        entries.some((entry) => containsRepeatIndex(entry?.formula))
      )
    }
    case 'switch': {
      return (
        (formula.cases ?? []).some(
          (c) =>
            containsRepeatIndex(c?.condition) ||
            containsRepeatIndex(c?.formula),
        ) || containsRepeatIndex(formula.default)
      )
    }
    default:
      return false
  }
}

export const noIndexRepeatKeyRule: IssueRule<unknown, ComponentNodeNode> = {
  code: 'no-index-repeat-key',
  level: 'warning',
  category: 'Quality',
  visit: (report, { nodeType, path, value }) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (nodeType !== 'component-node' || !value || value.type === 'slot') {
      return
    }
    const repeatKey = (value as { repeatKey?: Nullable<Formula> }).repeatKey
    if (repeatKey == null) {
      return
    }
    if (!containsRepeatIndex(repeatKey)) {
      return
    }
    report({
      path: [...path, 'repeatKey'],
      info: {
        title: 'Repeat key uses index',
        description:
          '**Repeat key** uses the repeat **index**, which is unstable when the list order changes. Use a stable unique value per item (e.g. an id from **ListItem.Item**) instead.',
      },
    })
  },
}
