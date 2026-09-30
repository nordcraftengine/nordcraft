import { isToddleFormula } from '@nordcraft/core/dist/formula/formula'
import type { IssueRule } from '../../../types'
import { contextlessEvaluateFormula } from '../../../util/contextlessEvaluateFormula'
import {
  getArgumentFormula,
  normalizePathSegments,
  validateStaticPath,
} from '../../../util/validateStaticPropertyPath'

export const invalidProjectFormulaReferenceRule: IssueRule<{
  formulaName: string
  invalidKey: string | number
}> = {
  code: 'invalid project formula reference',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
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
      objectFormula.type !== 'function' ||
      objectFormula.name.startsWith('@toddle/')
    ) {
      return
    }

    const projectFormula = (
      objectFormula.package
        ? files.packages?.[objectFormula.package]?.formulas
        : files.formulas
    )?.[objectFormula.name]

    if (!projectFormula || !isToddleFormula(projectFormula)) {
      return
    }

    const formulaEval = contextlessEvaluateFormula(projectFormula.formula)
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
          title: 'Invalid global formula reference',
          description: `Property **${validation.invalidKey}** does not exist on global formula **${objectFormula.name}**.`,
        },
        details: {
          formulaName: objectFormula.name,
          invalidKey: validation.invalidKey,
        },
      })
    }
  },
}
