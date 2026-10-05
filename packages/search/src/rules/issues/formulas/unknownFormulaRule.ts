import { isFormulaApplyOperation } from '@nordcraft/core/dist/formula/formula'
import type { FormulaNode, IssueRule } from '../../../types'

export const unknownFormulaRule: IssueRule<
  {
    name: string
  },
  FormulaNode
> = {
  code: 'unknown formula',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'formula',
  visit: (report, { path, files, value }) => {
    if (!isFormulaApplyOperation(value)) {
      return
    }

    const [, componentName] = path
    const component = files.components[componentName]
    if (!component?.formulas?.[value.name]) {
      report({
        path,
        info: {
          title: 'Unknown formula',
          description: `**${value.name}** does not exist. Using an unknown formula will always return *Null*`,
        },
        details: { name: value.name },
      })
    }
  },
}
