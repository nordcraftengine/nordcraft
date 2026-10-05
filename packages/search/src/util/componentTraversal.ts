import type { ActionModel } from '@nordcraft/core/dist/component/component.types'
import type { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { Formula } from '@nordcraft/core/dist/formula/formula'
import type { MemoFn } from '../types'

export interface ComponentFormulaEntry {
  formula: Formula
  path: (string | number)[]
  packageName?: string | null
}

export interface ComponentActionEntry {
  actionPath: (string | number)[]
  action: ActionModel
}

/**
 * Shared per-component formula traversal.
 *
 * Several no-reference rules each walked `formulasInComponent()` separately
 * (one full traversal per rule per component). This memoizes the raw entries
 * once per component per search so every rule filters the same array instead
 * of re-walking the component.
 */
export const getFormulasInComponent = <Handler>(
  memo: MemoFn,
  component: ToddleComponent<Handler>,
): ComponentFormulaEntry[] =>
  memo(`formulas-in-component/${component.name}`, () =>
    Array.from(
      component.formulasInComponent(),
      ({ formula, path, packageName }) => ({
        formula,
        path: [...path],
        packageName: packageName ?? undefined,
      }),
    ),
  )

/**
 * Shared per-component action traversal.
 *
 * Same idea as {@link getFormulasInComponent} for
 * `actionModelsInComponent()`.
 */
export const getActionsInComponent = <Handler>(
  memo: MemoFn,
  component: ToddleComponent<Handler>,
): ComponentActionEntry[] =>
  memo(`actions-in-component/${component.name}`, () =>
    Array.from(component.actionModelsInComponent(), ([actionPath, action]) => ({
      actionPath: [...actionPath],
      action,
    })),
  )
