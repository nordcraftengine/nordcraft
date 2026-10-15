import type { ActionModelNode, IssueRule } from '../../../types'
import { contextlessEvaluateFormula } from '../../../util/contextlessEvaluateFormula'

// Workflow action switches support multiple cases (unlike formula switches,
// which are if/else). Any case after an always-true case - including the
// default - can never be reached.
export const noUnreachableActionSwitchCaseRule: IssueRule<
  {
    alwaysTrueIndex: number
    unreachableIndex: number
  },
  ActionModelNode
> = {
  code: 'no-unreachable-action-switch-case',
  level: 'warning',
  category: 'Quality',
  nodeTypes: 'action-model',
  visit: (report, { nodeType, path, value }) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (nodeType !== 'action-model' || value.type !== 'Switch') {
      return
    }
    const cases = value.cases ?? []
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
    if (alwaysTrueIndex !== -1 && value.default) {
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
