import type { Rule } from '../../../types'

export const unknownProjectFormulaRule: Rule<{ name: string }> = {
  code: 'unknown project formula',
  level: 'warning',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'formula' ||
      value.type !== 'function' ||
      (value.name ?? '').startsWith('@toddle/')
    ) {
      return
    }
    const formula = (
      value.package ? files.packages?.[value.package]?.formulas : files.formulas
    )?.[value.name]
    if (formula) {
      return
    }
    report(path, { name: value.name })
  },
}
