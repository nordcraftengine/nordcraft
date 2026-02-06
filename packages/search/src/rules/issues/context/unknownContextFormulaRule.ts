import type { Rule } from '../../../types'

export const unknownContextFormulaRule: Rule<{
  providerName: string
  formulaName: string
}> = {
  code: 'unknown context formula',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      path[0] !== 'components' ||
      nodeType !== 'formula' ||
      value.type !== 'path' ||
      value.path[0] !== 'Contexts'
    ) {
      return
    }

    const contexts = files.components[path[1]]?.contexts ?? {}
    if (contexts[value.path[1]]?.formulas.includes(value.path[2])) {
      return
    }

    report({
      path,
      info: {
        title: 'Unknown context formula',
        description: `**${value.path[2]}** is not subscribed. Make sure to subscribe to it in the component context section before using it.`,
      },
      details: {
        providerName: value.path[1],
        formulaName: value.path[2],
      },
    })
  },
}
