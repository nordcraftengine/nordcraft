import type { Rule } from '../../../types'
import { contextlessEvaluateFormula } from '../../../util/contextlessEvaluateFormula'

export const noUnnecessaryConditionFalsy: Rule = {
  code: 'no-unnecessary-condition-falsy',
  level: 'info',
  category: 'Quality',
  visit: (report, { path, value, nodeType }) => {
    if (nodeType !== 'formula' || value.type !== 'and') {
      return
    }

    if (
      value.arguments.some((arg) => {
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
