import type { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import {
  applyFormula,
  type FormulaContext,
} from '@nordcraft/core/dist/formula/formula'

export const evaluateAllComponentFormulas = ({
  component,
  formulaContext,
}: {
  component: ToddleComponent<any>
  formulaContext: FormulaContext
}) => {
  const formulas = Array.from(component.formulasInComponent()).filter(
    (f) => typeof f.packageName !== 'string',
  )
  const results: Record<string, any> = {}
  for (const formula of formulas) {
    applyFormula(
      formula.formula,
      {
        ...formulaContext,
        jsonPath: formula.path,
        reportFormulaEvaluation: (path, result) => {
          results[[...formula.path, ...path].join('/')] = result
        },
      },
      [],
    )
  }
  return results
}
