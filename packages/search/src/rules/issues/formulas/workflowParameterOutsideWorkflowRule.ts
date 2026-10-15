import type { FormulaNode, IssueRule } from '../../../types'
import { isPathFormula } from '../../../util/formulas'

export const workflowParameterOutsideWorkflowRule: IssueRule<
  unknown,
  FormulaNode
> = {
  code: 'invalid path formula',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'formula',
  visit: (report, { path, value }) => {
    if (!isPathFormula(value)) {
      return
    }

    if (value.path.at(0) === 'Parameters' && !path.includes('workflows')) {
      report({
        path,
        info: {
          title: `Invalid workflow parameter reference`,
          description: `A formula cannot reference workflow parameters (**Parameters**) outside of a workflow.`,
        },
      })
    }
  },
}
