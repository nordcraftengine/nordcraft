import type { FormulaNode, IssueRule } from '../../../types'

export const unknownAttributeRule: IssueRule<
  {
    name: string | number
  },
  FormulaNode
> = {
  code: 'unknown attribute',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'formula',
  visit: (report, { path, files, value }) => {
    if (value.type !== 'path' || value.path[0] !== 'Attributes') {
      return
    }

    const [, componentName] = path
    const [, attributeKey] = value.path
    const component = files.components[componentName]
    if (!component?.attributes?.[attributeKey]) {
      report({
        path,
        info: {
          title: 'Unknown attribute',
          description: `**${attributeKey}** does not exist. Using an unknown attribute will always return *Null*.`,
        },
        details: { name: attributeKey },
      })
    }
  },
}
