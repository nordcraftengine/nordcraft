import { contextlessEvaluateFormula } from '@nordcraft/core'
import type { FormulaNode, IssueRule } from '../../../types'

export const noUnnecessaryConditionTruthy: IssueRule<unknown, FormulaNode> = {
  code: 'no-unnecessary-condition-truthy',
  level: 'info',
  category: 'Quality',
  nodeTypes: 'formula',
  visit: (report, { path, value, files }) => {
    if (value.type !== 'or') {
      return
    }

    if (
      (value.arguments ?? []).some((arg) => {
        // Objects and arrays, even empty ones, are always truthy
        if (arg.formula.type === 'object' || arg.formula.type === 'array') {
          return true
        }

        const { result, isStatic } = contextlessEvaluateFormula(arg.formula, {
          component:
            path[0] === 'components' ? files.components[path[1]] : undefined,
          formulas: files.formulas,
          packages: files.packages,
        })
        return isStatic && Boolean(result) === true
      })
    ) {
      report({
        path,
        info: {
          title: 'Unnecessary condition',
          description:
            '**Or condition** is always truthy. Consider replacing it with a single *true* node.',
        },
      })
    }
  },
}
