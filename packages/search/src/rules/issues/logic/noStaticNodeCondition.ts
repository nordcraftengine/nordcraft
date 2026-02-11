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
      report({
        path,
        info: {
          title:
            Boolean(result) === true
              ? `Unnecessary show/hide, value is always truthy`
              : `Unnecessary show/hide, value is always falsy`,
          description:
            Boolean(result) === true
              ? `Condition always evaluates to **show** the element. Consider removing the show/hide formula.`
              : `Condition always evaluates to **hide** the element. Consider removing the element node.`,
        },
        details: {
          result,
        },
        fixes:
          Boolean(result) === true ? ['remove-condition'] : ['remove-node'],
      })
    }
  },
  fixes: {
    'remove-condition': removeFromPathFix,
    'remove-node': (({ data: { path, ...data } }) =>
      removeNodeFromPathFix({
        data: {
          path: path.slice(0, -1),
          ...data,
        },
      })) as FixFunction<NodeType>,
  },
}

export type NoStaticNodeConditionRuleFix = 'remove-condition' | 'remove-node'
