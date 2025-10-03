import type { Rule } from '../../../types'

export const unknownContextProviderFormulaRule: Rule<{
  providerName: string
  formulaName: string
}> = {
  code: 'unknown context provider formula',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'component-context' ||
      !value.componentName ||
      (value.formulas ?? []).length === 0
    ) {
      return
    }

    // Lookup the target component and verify it holds the formula
    const component = value.package
      ? files.packages?.[value.package]?.components[value.componentName]
      : files.components[value.componentName]
    if (!component) {
      return
    }
    for (const formulaName of value.formulas) {
      if (component.formulas?.[formulaName]?.exposeInContext !== true) {
        report(path, {
          providerName: value.componentName,
          formulaName,
        })
      }
    }
  },
}
