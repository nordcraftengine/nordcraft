import type { ApiRequest } from '@nordcraft/core/dist/api/apiTypes'
import type { FormulaNode, IssueRule } from '../../../types'

export const unknownApiInputRule: IssueRule<
  {
    name: string
  },
  FormulaNode
> = {
  code: 'unknown api input',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'formula',
  visit: (report, { path, files, value }) => {
    if (
      value.type !== 'path' ||
      value.path[0] !== 'ApiInputs' ||
      typeof value.path[1] !== 'string' ||
      path.length < 4
    ) {
      return
    }
    const [_components, componentName, _apis, apiKey] = path
    if (typeof apiKey !== 'string') {
      return
    }
    const apiInput = (
      files.components?.[componentName]?.apis?.[apiKey] as
        | ApiRequest
        | undefined
    )?.inputs?.[value.path[1]]
    if (!apiInput) {
      report({
        path,
        info: {
          title: 'Unknown API input',
          description: `**${value.path[1]}** does not exist as an input on the API. Using an unknown input will always return *Null*. Make sure to define it before using it.`,
        },
        details: { name: value.path[1] },
      })
    }
  },
}
