import type { ActionModel } from '../component/component.types'
import type { Nullable } from '../types'
import { isDefined } from '../utils/util'
import type {
  Formula,
  FunctionOperation,
  PathOperation,
  ValueOperation,
} from './formula'
import { isFormula, isToddleFormula } from './formula'
import type { GlobalFormulas } from './formulaTypes'

export const valueFormula = (
  value: string | number | boolean | null | object,
): ValueOperation => ({
  type: 'value',
  value,
})

export const pathFormula = (path: string[]): PathOperation => ({
  type: 'path',
  path,
})

export const functionFormula = (
  name: string,
  formula?: Omit<Partial<FunctionOperation>, 'type' | 'name'>,
): FunctionOperation => ({
  type: 'function',
  name,
  package: formula?.package,
  arguments: formula?.arguments ?? [],
  variableArguments: formula?.variableArguments,
})

export function* getFormulasInFormula<Handler>({
  formula,
  globalFormulas,
  path: _path,
  visitedFormulas: _visitedFormulas,
  packageName: _packageName,
}: {
  formula: Nullable<Formula>
  globalFormulas: GlobalFormulas<Handler>
  path?: Nullable<(string | number)[]>
  visitedFormulas?: Nullable<Set<string>>
  packageName?: Nullable<string>
}): Generator<{
  path: (string | number)[]
  formula: Formula
  packageName?: string
}> {
  if (!isDefined(formula)) {
    return
  }
  const path = _path ?? []
  let packageName = _packageName ?? undefined
  const visitedFormulas = _visitedFormulas ?? new Set<string>()

  yield {
    path,
    formula,
    packageName,
  }
  switch (formula.type) {
    case 'path':
    case 'value':
      break
    case 'record':
      for (const [key, entry] of formula.entries.entries()) {
        yield* getFormulasInFormula({
          formula: entry.formula,
          globalFormulas,
          path: [...path, 'entries', key, 'formula'],
          visitedFormulas,
          packageName,
        })
      }
      break
    case 'function': {
      packageName = formula.package ?? packageName
      const formulaKey = [packageName, formula.name].filter(isDefined).join('/')
      const shouldVisitFormula = !visitedFormulas.has(formulaKey)
      visitedFormulas.add(formulaKey)
      const globalFormula = packageName
        ? globalFormulas.packages?.[packageName]?.formulas?.[formula.name]
        : globalFormulas.formulas?.[formula.name]
      for (const [key, arg] of (
        (formula.arguments as typeof formula.arguments | undefined) ?? []
      ).entries()) {
        yield* getFormulasInFormula({
          formula: arg.formula,
          globalFormulas,
          path: [...path, 'arguments', key, 'formula'],
          visitedFormulas,
          packageName,
        })
      }
      // Lookup the actual function and traverse its potential formula references
      // if this formula wasn't already visited
      if (
        globalFormula &&
        isToddleFormula(globalFormula) &&
        shouldVisitFormula
      ) {
        yield* getFormulasInFormula({
          formula: globalFormula.formula,
          globalFormulas,
          path: [...path, 'formula'],
          visitedFormulas,
          packageName,
        })
      }
      break
    }
    case 'array':
    case 'or':
    case 'and':
    case 'object':
      for (const [key, arg] of (
        (formula.arguments as typeof formula.arguments | undefined) ?? []
      ).entries()) {
        yield* getFormulasInFormula({
          formula: arg.formula,
          globalFormulas,
          path: [...path, 'arguments', key, 'formula'],
          visitedFormulas,
          packageName,
        })
      }
      break
    case 'apply':
      for (const [key, arg] of (
        (formula.arguments as typeof formula.arguments | undefined) ?? []
      ).entries()) {
        yield* getFormulasInFormula({
          formula: arg.formula,
          globalFormulas,
          path: [...path, 'arguments', key, 'formula'],
          visitedFormulas,
          packageName,
        })
      }
      break
    case 'switch':
      for (const [key, c] of formula.cases.entries()) {
        yield* getFormulasInFormula({
          formula: c.condition,
          globalFormulas,
          path: [...path, 'cases', key, 'condition'],
          visitedFormulas,
          packageName,
        })
        yield* getFormulasInFormula({
          formula: c.formula,
          globalFormulas,
          path: [...path, 'cases', key, 'formula'],
          visitedFormulas,
          packageName,
        })
      }
      yield* getFormulasInFormula({
        formula: formula.default,
        globalFormulas,
        path: [...path, 'default'],
        visitedFormulas,
        packageName,
      })
      break
  }
}
export function* getFormulasInAction<Handler>({
  action,
  globalFormulas,
  path: _path,
  visitedFormulas = new Set<string>(),
  packageName: _packageName,
}: {
  action: Nullable<ActionModel>
  globalFormulas: GlobalFormulas<Handler>
  path?: Nullable<(string | number)[]>
  visitedFormulas?: Nullable<Set<string>>
  packageName?: Nullable<string>
}): Generator<{
  path: (string | number)[]
  formula: Formula
  packageName?: string
}> {
  if (!isDefined(action)) {
    return
  }
  const path = _path ?? []
  let packageName = _packageName ?? undefined

  switch (action.type) {
    case 'Fetch':
      for (const [inputKey, input] of Object.entries(action.inputs ?? {})) {
        yield* getFormulasInFormula({
          formula: input.formula,
          globalFormulas,
          path: [...path, 'input', inputKey, 'formula'],
          visitedFormulas,
          packageName,
        })
      }
      for (const [key, a] of Object.entries(action.onSuccess?.actions ?? {})) {
        yield* getFormulasInAction({
          action: a,
          globalFormulas,
          path: [...path, 'onSuccess', 'actions', key],
          visitedFormulas,
          packageName,
        })
      }
      for (const [key, a] of Object.entries(action.onError?.actions ?? {})) {
        yield* getFormulasInAction({
          action: a,
          globalFormulas,
          path: [...path, 'onError', 'actions', key],
          visitedFormulas,
          packageName,
        })
      }
      for (const [key, a] of Object.entries(action.onMessage?.actions ?? {})) {
        yield* getFormulasInAction({
          action: a,
          globalFormulas,
          path: [...path, 'onMessage', 'actions', key],
          visitedFormulas,
          packageName,
        })
      }
      break
    case 'Custom':
    case undefined:
    case null:
      packageName = action.package ?? packageName
      if (isFormula(action.data)) {
        yield* getFormulasInFormula({
          formula: action.data,
          globalFormulas,
          path: [...path, 'data'],
          visitedFormulas,
          packageName,
        })
      }
      for (const [key, a] of Object.entries(action.arguments ?? {})) {
        if (a) {
          yield* getFormulasInFormula({
            formula: a.formula,
            globalFormulas,
            path: [...path, 'arguments', key, 'formula'],
            visitedFormulas,
            packageName,
          })
        }
      }

      for (const [eventKey, event] of Object.entries(action.events ?? {})) {
        for (const [key, a] of Object.entries(event.actions ?? {})) {
          yield* getFormulasInAction({
            action: a,
            globalFormulas,
            path: [...path, 'events', eventKey, 'actions', key],
            visitedFormulas,
            packageName,
          })
        }
      }
      break
    case 'SetVariable':
    case 'TriggerEvent':
    case 'TriggerWorkflowCallback':
      yield* getFormulasInFormula({
        formula: action.data,
        globalFormulas,
        path: [...path, 'data'],
        visitedFormulas,
        packageName,
      })
      break
    case 'SetURLParameter':
      yield* getFormulasInFormula({
        formula: action.data,
        globalFormulas,
        path: [...path, 'data'],
        visitedFormulas,
      })
      break
    case 'SetURLParameters':
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      for (const [key, formula] of Object.entries(action.parameters ?? {})) {
        yield* getFormulasInFormula({
          formula,
          globalFormulas,
          path: [...path, 'parameters', key],
          visitedFormulas,
        })
      }
      break
    case 'TriggerWorkflow':
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      for (const [key, a] of Object.entries(action.parameters ?? {})) {
        if (isDefined(a.formula)) {
          yield* getFormulasInFormula({
            formula: a.formula,
            globalFormulas,
            path: [...path, 'parameters', key, 'formula'],
            visitedFormulas,
            packageName,
          })
        }
      }
      break
    case 'Switch':
      if (isDefined(action.data) && isFormula(action.data)) {
        yield* getFormulasInFormula({
          formula: action.data,
          globalFormulas,
          path: [...path, 'data'],
          visitedFormulas,
          packageName,
        })
      }
      for (const [key, c] of action.cases.entries()) {
        yield* getFormulasInFormula({
          formula: c.condition,
          globalFormulas,
          path: [...path, 'cases', key, 'condition'],
          visitedFormulas,
          packageName,
        })
        for (const [actionKey, a] of Object.entries(c.actions)) {
          yield* getFormulasInAction({
            action: a,
            globalFormulas,
            path: [...path, 'cases', key, 'actions', actionKey],
            visitedFormulas,
            packageName,
          })
        }
      }
      for (const [actionKey, a] of Object.entries(action.default.actions)) {
        yield* getFormulasInAction({
          action: a,
          globalFormulas,
          path: [...path, 'default', 'actions', actionKey],
          visitedFormulas,
          packageName,
        })
      }
      break
  }
}
