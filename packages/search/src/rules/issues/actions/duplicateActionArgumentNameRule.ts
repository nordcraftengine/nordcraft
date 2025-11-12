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
        report(path, { name: arg.name })
      }
      argumentNames.add(arg.name)
    })
  },
}
