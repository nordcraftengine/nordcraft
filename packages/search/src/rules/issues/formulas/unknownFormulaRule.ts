import { isFormulaApplyOperation } from '@nordcraft/core/dist/formula/formula'
import type { Rule } from '../../../types'

export const unknownFormulaRule: Rule<{
  name: string
}> = {
  code: 'unknown formula',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (nodeType !== 'formula' || !isFormulaApplyOperation(value)) {
      return
    }

    const [, componentName] = path
    const component = files.components[componentName]
    if (!component?.formulas?.[value.name]) {
      report(path, { name: value.name })
    }
  },
}
