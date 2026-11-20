import { contextlessEvaluateFormula } from '@nordcraft/core'
import type { FormulaNode, IssueRule } from '../../../types'

export const noUnnecessaryConditionFalsy: IssueRule<unknown, FormulaNode> = {
  code: 'no-unnecessary-condition-falsy',
  level: 'info',
  category: 'Quality',
  nodeTypes: 'formula',
  visit: (report, { path, value, files }) => {
    if (value.type !== 'and') {
      return
    }

    if (
      (value.arguments ?? []).some((arg) => {
        const { result, isStatic } = contextlessEvaluateFormula(arg.formula, {
          component:
            path[0] === 'components' ? files.components[path[1]] : undefined,
          formulas: files.formulas,
          packages: files.packages,
        })
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
