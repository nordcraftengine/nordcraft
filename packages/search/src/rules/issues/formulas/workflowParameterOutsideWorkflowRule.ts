import type { IssueRule } from '../../../types'
import { isPathFormula } from '../../../util/formulas'

export const workflowParameterOutsideWorkflowRule: IssueRule = {
  code: 'invalid path formula',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, value, nodeType }) => {
    if (nodeType !== 'formula' || !isPathFormula(value)) {
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
