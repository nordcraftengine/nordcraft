import type { FormulaNode, IssueRule } from '../../../types'
import { isPathFormula } from '../../../util/formulas'

export const invalidPathRule: IssueRule<unknown, FormulaNode> = {
  code: 'invalid path formula',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'formula',
  visit: (report, { path, value }) => {
    if (!isPathFormula(value)) {
      return
    }

    const firstElement = value.path.at(0)
    if (typeof firstElement === 'string') {
      switch (firstElement) {
        case 'Formulas':
          report({
            path,
            info: {
              title: `Invalid path reference`,
              description: `A path formula cannot reference formulas directly. Use an apply formula instead.`,
            },
          })
          break
        case 'Workflows':
          report({
            path,
            info: {
              title: `Invalid path reference`,
              description: `A path formula cannot reference workflows directly. Use a workflow action instead.`,
            },
          })
          break
      }
    }
  },
}
