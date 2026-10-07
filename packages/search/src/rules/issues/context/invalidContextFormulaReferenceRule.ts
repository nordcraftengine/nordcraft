import type { IssueRule } from '../../../types'
import { contextlessEvaluateFormula } from '../../../util/contextlessEvaluateFormula'
import {
  getArgumentFormula,
  normalizePathSegments,
  validateStaticPath,
} from '../../../util/validateStaticPropertyPath'

export const invalidContextFormulaReferenceRule: IssueRule<{
  providerName: string
  formulaName: string
  invalidKey: string | number
}> = {
  code: 'invalid context formula reference',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (path[0] !== 'components' || nodeType !== 'formula') {
      return
    }

    let providerName: string | undefined
    let formulaName: string | undefined
    let segments: (string | number)[] = []

    if (value.type === 'path' && value.path[0] === 'Contexts') {
      providerName = value.path[1] as string | undefined
      formulaName = value.path[2] as string | undefined
      segments = value.path.slice(3)
    } else if (value.type === 'function' && value.name === '@toddle/get') {
      const objectFormula = getArgumentFormula(value.arguments, 'Object', 0)
      const pathFormula = getArgumentFormula(value.arguments, 'Path', 1)

      if (
        !objectFormula ||
        !pathFormula ||
        objectFormula.type !== 'path' ||
        objectFormula.path[0] !== 'Contexts'
      ) {
        return
      }

      providerName = objectFormula.path[1] as string | undefined
      formulaName = objectFormula.path[2] as string | undefined
      const extraSegments = objectFormula.path.slice(3)

      const pathEval = contextlessEvaluateFormula(pathFormula)
      if (!pathEval.isStatic) {
        return
      }

      const normalized = normalizePathSegments(pathEval.result)
      if (!normalized || normalized.length === 0) {
        return
      }

      segments = [...extraSegments, ...normalized]
    } else {
      return
    }

    if (!providerName || !formulaName || segments.length === 0) {
      return
    }

    const componentName = path[1] as string
    const currentComponent = files.components[componentName]
    const contextSub = currentComponent?.contexts?.[providerName]
    const providerComponent = contextSub?.package
      ? files.packages?.[contextSub.package]?.components[
          contextSub.componentName ?? providerName
        ]
      : files.components[contextSub?.componentName ?? providerName]
    const contextFormula = providerComponent?.formulas?.[formulaName]

    if (contextFormula?.exposeInContext !== true) {
      return
    }

    const formulaEval = contextlessEvaluateFormula(contextFormula.formula)
    if (!formulaEval.isStatic) {
      return
    }

    const validation = validateStaticPath(formulaEval.result, segments)
    if (!validation.isValid) {
      report({
        path,
        info: {
          title: 'Invalid context formula reference',
          description: `Property **${validation.invalidKey}** does not exist on context formula **${formulaName}**.`,
        },
        details: {
          providerName,
          formulaName,
          invalidKey: validation.invalidKey,
        },
      })
    }
  },
}
