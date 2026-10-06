import type { FormulaNode, IssueRule } from '../../../types'
import { contextlessEvaluateFormula } from '../../../util/contextlessEvaluateFormula'

export const noUnnecessaryConditionFalsy: IssueRule<unknown, FormulaNode> = {
  code: 'no-unnecessary-condition-falsy',
  level: 'info',
  category: 'Quality',
  nodeTypes: 'formula',
  visit: (report, { path, value }) => {
    if (value.type !== 'and') {
      return
    }

    if (
      (value.arguments ?? []).some((arg) => {
        const { result, isStatic } = contextlessEvaluateFormula(arg.formula)
        return isStatic && Boolean(result) === false
      })
    ) {
      report({
        path,
        info: {
          title: 'Unnecessary condition',
          description:
            '**And condition** is always falsy. Consider replacing it with a single *false* node.',
        },
      })
    }
  },
}
