import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import {
  isToddleFormula,
  type Formula,
} from '@nordcraft/core/dist/formula/formula'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import { ToddleApiService } from '@nordcraft/ssr/dist/ToddleApiService'
import { ToddleRoute } from '@nordcraft/ssr/dist/ToddleRoute'
import type { MemoFn } from '../../../types'

export const projectFormulaIsReferenced = (
  files: Omit<ProjectFiles, 'config'> & Partial<Pick<ProjectFiles, 'config'>>,
  memo: MemoFn,
) => {
  const allUsedFormulaKeys = memo('all-used-formulas', () => {
    const usedFormulas = new Set<string>()

    // Check in all API services first, since that should be quick
    for (const apiService of Object.values(files.services ?? {})) {
      const service = new ToddleApiService({
        service: apiService,
        globalFormulas: { formulas: files.formulas, packages: files.packages },
      })
      const formulas = service.formulasInService()
      for (const { path: _formulaPath, formula } of formulas) {
        // Check if the formula is used in the formula
        checkFormula(usedFormulas, formula)
      }
    }

    // Check routes before components, since they should be quicker
    for (const projectRoute of Object.values(files.routes ?? {})) {
      const route = new ToddleRoute({
        route: projectRoute,
        globalFormulas: { formulas: files.formulas, packages: files.packages },
      })
      const formulas = route.formulasInRoute()
      for (const { path: _formulaPath, formula } of formulas) {
        // Check if the formula is used in the formula
        checkFormula(usedFormulas, formula)
      }
    }

    for (const component of Object.values(files.components)) {
      const c = new ToddleComponent({
        // Enforce that the component is not undefined since we're iterating
        component: component!,
        getComponent: (name) => files.components[name],
        packageName: undefined,
        globalFormulas: {
          formulas: files.formulas,
          packages: files.packages,
        },
      })
      for (const { formula } of c.formulasInComponent()) {
        if (formula.type === 'function') {
          usedFormulas.add(
            [formula.package, formula.name].filter(isDefined).join('/'),
          )
        }
      }
    }

    for (const f of Object.values(files.formulas ?? {})) {
      // Check if the formula is used in the formula
      if (isToddleFormula(f)) {
        const usedFormulasMinusSelf = new Set<string>()
        checkFormula(usedFormulasMinusSelf, f.formula)
        // Add all minus self (a formula is unused, if it's only used by itself)
        usedFormulasMinusSelf.delete(f.name)
        usedFormulasMinusSelf.forEach((f) => usedFormulas.add(f))
      }
    }

    return usedFormulas
  })

  return (formulaName: string, packageName?: string) => {
    return allUsedFormulaKeys.has(
      [packageName, formulaName].filter(isDefined).join('/'),
    )
  }
}

const checkArguments = (
  usedFormulas: Set<string>,
  args: {
    formula: Formula
  }[],
) => {
  args.forEach((a) => {
    checkFormula(usedFormulas, a.formula)
  })
}

const checkFormula = (usedFormulas: Set<string>, formula: Formula) => {
  if (formula.type === 'function') {
    usedFormulas.add(
      [formula.package, formula.name].filter(isDefined).join('/'),
    )
    checkArguments(usedFormulas, formula.arguments ?? [])
  } else if (
    formula.type === 'object' ||
    formula.type === 'array' ||
    formula.type === 'or' ||
    formula.type === 'and' ||
    formula.type === 'apply'
  ) {
    checkArguments(usedFormulas, formula.arguments ?? [])
  }
}
