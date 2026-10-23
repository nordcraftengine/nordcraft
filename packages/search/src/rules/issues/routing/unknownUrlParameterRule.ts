import type { FormulaNode, IssueRule } from '../../../types'

export const unknownUrlParameterRule: IssueRule<
  {
    name: string | number
  },
  FormulaNode
> = {
  code: 'unknown url parameter',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'formula',
  visit: (report, { path, files, value }) => {
    if (value.type !== 'path' || value.path[0] !== 'URL parameters') {
      return
    }

    const [, componentName] = path
    const [, parameterKey] = value.path
    const component = files.components[componentName]
    if (
      !component?.route?.query?.[parameterKey] &&
      !component?.route?.path?.some((p) => p.name === parameterKey)
    ) {
      report({
        path,
        info: {
          title: 'Unknown URL parameter',
          description: `**${parameterKey}** does not exist as a path- or query-parameter. Using an unknown URL parameter will always return *Null*.`,
        },
        details: { name: parameterKey },
      })
    }
  },
}
