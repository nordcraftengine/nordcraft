import type { FormulaNode, IssueRule } from '../../../types'
import { contextlessEvaluateFormula } from '../../../util/contextlessEvaluateFormula'

// Formula switches are if/else (single case + default), even though the
// data structure technically allows multiple cases.
export const noUnreachableSwitchCaseRule: IssueRule<
  {
    alwaysTrueIndex: number
    unreachableIndex: number
  },
  FormulaNode
> = {
  code: 'no-unreachable-switch-case',
  level: 'warning',
  category: 'Quality',
  visit: (report, { nodeType, path, value }) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (nodeType !== 'formula' || value.type !== 'switch') {
      return
    }
    const cases = value.cases ?? []

    // Standard if/else: a single case (then) + default (else)
    if (cases.length === 1) {
      const c = cases[0]
      if (!c) {
        return
      }
      const { isStatic, result } = contextlessEvaluateFormula(c.condition)
      if (!isStatic) {
        return
      }
      if (Boolean(result) === true) {
        report({
          path: [...path, 'default'],
          info: {
            title: 'Unreachable else',
            description: `The **else** is never reached as the condition always evaluates to **true**. Consider removing it.`,
          },
          details: { alwaysTrueIndex: 0, unreachableIndex: 1 },
        })
      } else {
        report({
          path: [...path, 'cases', 0],
          info: {
            title: 'Unreachable then',
            description: `The **then** is never reached as the condition always evaluates to **false**. Consider removing it.`,
          },
          details: { alwaysTrueIndex: -1, unreachableIndex: 0 },
        })
      }
      return
    }

    // Defensive: the data structure allows multiple cases, even though the
    // UI only produces if/else. Keep switch-style wording here.
    let alwaysTrueIndex = -1
    for (let i = 0; i < cases.length; i++) {
      const c = cases[i]
      if (!c) {
        continue
      }
      if (alwaysTrueIndex !== -1) {
        report({
          path: [...path, 'cases', i],
          info: {
            title: 'Unreachable switch case',
            description: `This **switch case** comes after a case that is always true (case ${alwaysTrueIndex + 1}) and can never be reached. Consider removing it.`,
          },
          details: { alwaysTrueIndex, unreachableIndex: i },
        })
        continue
      }
      const { isStatic, result } = contextlessEvaluateFormula(c.condition)
      if (isStatic && Boolean(result) === true) {
        alwaysTrueIndex = i
      }
    }
    if (alwaysTrueIndex !== -1) {
      // Default is also unreachable when an always-true case exists
      report({
        path: [...path, 'default'],
        info: {
          title: 'Unreachable switch default',
          description: `The **switch default** comes after a case that is always true (case ${alwaysTrueIndex + 1}) and can never be reached. Consider removing it.`,
        },
        details: {
          alwaysTrueIndex,
          unreachableIndex: cases.length,
        },
      })
    }
  },
}
