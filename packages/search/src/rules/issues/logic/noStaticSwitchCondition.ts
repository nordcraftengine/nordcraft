import { contextlessEvaluateFormula } from '@nordcraft/core/dist/formula/contextlessEvaluateFormula'
import type { SwitchOperation } from '@nordcraft/core/dist/formula/formula'
import { toBoolean } from '@nordcraft/core/dist/utils/util'
import type { FormulaNode, IssueRule, NodeType } from '../../../types'

export const noStaticSwitchCondition: IssueRule<
  void,
  NodeType,
  FormulaNode<SwitchOperation>
> = {
  code: 'no-static-switch-condition',
  level: 'info',
  category: 'Quality',
  visit: (report, { path, files, value, nodeType }) => {
    if (nodeType !== 'formula' || value.type !== 'switch') {
      return
    }

    const component =
      path[0] === 'components' ? files.components[path[1]] : undefined

    for (const [index, switchCase] of (value.cases ?? []).entries()) {
      if (!switchCase?.condition) {
        continue
      }

      const { result, isStatic } = contextlessEvaluateFormula(
        switchCase.condition,
        {
          component,
          formulas: files.formulas,
          packages: files.packages,
        },
      )
      const hasComputedResult = result !== undefined
      const booleanResult = hasComputedResult ? toBoolean(result) : undefined
      const isAlwaysTruthy = isStatic && booleanResult === true
      const isAlwaysFalsy = isStatic && booleanResult === false

      if (isAlwaysTruthy || isAlwaysFalsy || isStatic) {
        report({
          path: [...path, 'cases', index, 'condition'],
          info: {
            title: 'Unnecessary condition',
            description: isAlwaysTruthy
              ? '**If condition** is always truthy. Consider simplifying or removing this condition.'
              : isAlwaysFalsy
                ? '**If condition** is always falsy. Consider removing this case.'
                : '**If condition** is static. Consider simplifying or removing this condition.',
          },
        })
      }
    }
  },
}
