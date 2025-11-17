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
    if (contexts[value.path[1]]?.formulas.includes(value.path[2] as string)) {
      return
    }

    report(path, {
      providerName: value.path[1] as string,
      formulaName: value.path[2] as string,
    })
  },
}
