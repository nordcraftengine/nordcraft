import type { Rule } from '../../../types'
import { contextlessEvaluateFormula } from '../../../util/contextlessEvaluateFormula'

export const noUnnecessaryConditionTruthy: Rule = {
  code: 'no-unnecessary-condition-truthy',
  level: 'info',
  category: 'Quality',
  visit: (report, { path, value, nodeType }) => {
    if (nodeType !== 'formula' || value.type !== 'or') {
      return
    }

    if (
      value.arguments.some((arg) => {
        // Objects and arrays, even empty ones, are always truthy
        if (arg.formula.type === 'object' || arg.formula.type === 'array') {
          return true
        }

        const { result, isStatic } = contextlessEvaluateFormula(arg.formula)
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
