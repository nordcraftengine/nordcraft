import { contextlessEvaluateFormula } from '@nordcraft/core'
import type { ComponentNodeNode, IssueRule } from '../../../types'

export const noStaticRepeatKeyRule: IssueRule<
  {
    result: unknown
  },
  ComponentNodeNode
> = {
  code: 'no-static-repeat-key',
  level: 'warning',
  category: 'Quality',
  nodeTypes: 'component-node',
  visit: (report, { nodeType, path, value, files }) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (nodeType !== 'component-node' || !value || value.type === 'slot') {
      return
    }
    const repeatKey = (value as { repeatKey?: unknown })
      .repeatKey as Parameters<typeof contextlessEvaluateFormula>[0]
    if (repeatKey == null) {
      return
    }
    const component =
      path[0] === 'components' ? files.components[path[1] as string] : undefined
    const { isStatic, result } = contextlessEvaluateFormula(repeatKey, {
      component,
      formulas: files.formulas,
      packages: files.packages,
    })
    if (!isStatic) {
      return
    }
    report({
      path: [...path, 'repeatKey'],
      info: {
        title: 'Static repeat key',
        description:
          '**Repeat key** is static and will be the same for every repeated item. Use a unique value per item (e.g. an id from **ListItem.Item**) instead of a static value.',
      },
      details: { result },
    })
  },
}
