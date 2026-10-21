import { contextlessEvaluateFormula } from '@nordcraft/core/dist/formula/contextlessEvaluateFormula'
import type { IssueRule } from '../../../types'

export const noUnnecessaryConditionFalsy: IssueRule = {
  code: 'no-unnecessary-condition-falsy',
  level: 'info',
  category: 'Quality',
  visit: (report, { path, files, value, nodeType }) => {
    if (nodeType !== 'formula' || value.type !== 'and') {
      return
    }

    const component =
      path[0] === 'components' ? files.components[path[1]] : undefined

    if (
      (value.arguments ?? []).some((arg) => {
        const { result, isStatic } = contextlessEvaluateFormula(arg.formula, {
          component,
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
