import type { IssueRule } from '../../../types'
import { contextlessEvaluateFormula } from '../../../util/contextlessEvaluateFormula'
import {
  getArgumentFormula,
  normalizePathSegments,
  validateStaticPath,
} from '../../../util/validateStaticPropertyPath'

export const invalidComponentFormulaReferenceRule: IssueRule<{
  formulaName: string
  invalidKey: string | number
}> = {
  code: 'invalid component formula reference',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      path[0] !== 'components' ||
      nodeType !== 'formula' ||
      value.type !== 'function' ||
      value.name !== '@toddle/get'
    ) {
      return
    }

    const objectFormula = getArgumentFormula(value.arguments, 'Object', 0)
    const pathFormula = getArgumentFormula(value.arguments, 'Path', 1)

    if (
      !objectFormula ||
      !pathFormula ||
      objectFormula.type !== 'apply' ||
      !objectFormula.name
    ) {
      return
    }

    const componentName = path[1] as string
    const currentComponent = files.components[componentName]
    const componentFormula = currentComponent?.formulas?.[objectFormula.name]

    if (!componentFormula?.formula) {
      return
    }

    const formulaEval = contextlessEvaluateFormula(componentFormula.formula)
    if (!formulaEval.isStatic) {
      return
    }

    const pathEval = contextlessEvaluateFormula(pathFormula)
    if (!pathEval.isStatic) {
      return
    }

    const segments = normalizePathSegments(pathEval.result)
    if (!segments || segments.length === 0) {
      return
    }

    const validation = validateStaticPath(formulaEval.result, segments)
    if (!validation.isValid) {
      report({
        path,
        info: {
          title: 'Invalid formula reference',
          description: `Property **${validation.invalidKey}** does not exist on formula **${objectFormula.name}**.`,
        },
        details: {
          formulaName: objectFormula.name,
          invalidKey: validation.invalidKey,
        },
      })
    }
  },
}
