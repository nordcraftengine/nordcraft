import type { Rule } from '../../../types'

export const duplicateFormulaArgumentNameRule: Rule<{
  name: string
}> = {
  code: 'duplicate formula argument name',
  level: 'error',
  category: 'Quality',
  visit: (report, { path, value, nodeType }) => {
    if (nodeType !== 'project-formula' && nodeType !== 'component-formula') {
      return
    }
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
