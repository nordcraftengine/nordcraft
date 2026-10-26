import type { ActionModel, Formula, ToddleComponent } from '@nordcraft/core'
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

export const getFormulasInComponent = <Handler>(
  memo: MemoFn,
  component: ToddleComponent<Handler>,
): ComponentFormulaEntry[] =>
  memo(`formulas-in-component/${component.name}`, () =>
    Array.from(
      component.formulasInComponent(),
      ({ formula, path, packageName }) => ({
        formula,
        path,
        packageName: packageName ?? undefined,
      }),
    ),
  )

export const getActionsInComponent = <Handler>(
  memo: MemoFn,
  component: ToddleComponent<Handler>,
): ComponentActionEntry[] =>
  memo(`actions-in-component/${component.name}`, () =>
    Array.from(component.actionModelsInComponent(), ([actionPath, action]) => ({
      actionPath,
      action,
    })),
  )
