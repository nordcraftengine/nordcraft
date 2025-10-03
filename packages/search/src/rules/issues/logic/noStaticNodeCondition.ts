import type { FixFunction, NodeType, Rule } from '../../../types'
import { contextlessEvaluateFormula } from '../../../util/contextlessEvaluateFormula'
import {
  removeFromPathFix,
  removeNodeFromPathFix,
} from '../../../util/removeUnused.fix'

export const noStaticNodeCondition: Rule<{
  result: ReturnType<typeof contextlessEvaluateFormula>['result']
}> = {
  code: 'no-static-node-condition',
  level: 'warning',
  category: 'Quality',
  visit: (report, { path, value, nodeType }) => {
    if (
      nodeType !== 'formula' ||
      !(
        path.length === 5 &&
        path[0] === 'components' &&
        path[2] === 'nodes' &&
        path[4] === 'condition'
      )
    ) {
      return
    }

    const { isStatic, result } = contextlessEvaluateFormula(value)
    if (isStatic) {
      // - if truthy: "Condition is always true, you can safely remove the condition as it will always be rendered."
      // - if falsy: "Condition is always false, you can safely remove the entire node as it will never be rendered."
      report(
        path,
        {
          result,
        },
        Boolean(result) === true ? ['remove-condition'] : ['remove-node'],
      )
    }
  },
  fixes: {
    'remove-condition': removeFromPathFix,
    'remove-node': (({ path, ...data }) =>
      removeNodeFromPathFix({
        path: path.slice(0, -1),
        ...data,
      })) as FixFunction<NodeType>,
  },
}

export type NoStaticNodeConditionRuleFix = 'remove-condition' | 'remove-node'
