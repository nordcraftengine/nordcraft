import type {
  ComponentFormulaNode,
  IssueRule,
  ProjectFormulaNode,
} from '../../../types'

export const duplicateFormulaArgumentNameRule: IssueRule<
  {
    name: string
  },
  ProjectFormulaNode | ComponentFormulaNode
> = {
  code: 'duplicate formula argument name',
  level: 'error',
  category: 'Quality',
  nodeTypes: ['project-formula', 'component-formula'],
  visit: (report, { path, value }) => {
    const argumentNames = new Set<string>()
    value.arguments?.forEach((arg) => {
      if (argumentNames.has(arg.name)) {
        report({
          path,
          info: {
            title: 'Duplicate formula argument name',
            description: `Multiple arguments with the name **${arg.name}** exist. Ensure argument names are unique.`,
          },
          details: { name: arg.name },
        })
      }
      argumentNames.add(arg.name)
    })
  },
}
