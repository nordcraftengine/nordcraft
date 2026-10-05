import type { IssueRule, ProjectActionNode } from '../../../types'

export const duplicateActionArgumentNameRule: IssueRule<
  {
    name: string
  },
  ProjectActionNode
> = {
  code: 'duplicate action argument name',
  level: 'error',
  category: 'Quality',
  nodeTypes: 'project-action',
  visit: (report, { path, value }) => {
    const argumentNames = new Set<string>()
    value.arguments?.forEach((arg) => {
      if (argumentNames.has(arg.name)) {
        report({
          path,
          info: {
            title: 'Duplicate action argument name',
            description: `Multiple arguments with the name **${arg.name}** exist. Ensure argument names are unique.`,
          },
          details: { name: arg.name },
        })
      }
      argumentNames.add(arg.name)
    })
  },
}
