import type { Rule } from '../../../types'

export const duplicateActionArgumentNameRule: Rule<{
  name: string
}> = {
  code: 'duplicate action argument name',
  level: 'error',
  category: 'Quality',
  visit: (report, { path, value, nodeType }) => {
    if (nodeType !== 'project-action') {
      return
    }
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
