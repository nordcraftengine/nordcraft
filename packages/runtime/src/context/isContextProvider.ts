import type {
  Component,
  ComponentData,
  ComponentFormula,
  FormulaContext,
} from '@nordcraft/core'
import { applyFormula } from '@nordcraft/core'
import '@nordcraft/core/compileTime'
import type { Signal } from '../signal/signal'
import { signal } from '../signal/signal'
import { isStaticFormula } from '../utils/isStaticFormula'

const contextProviderCache = new WeakMap<Component, boolean>()

const checkContextProvider = ({ formulas, workflows }: Component) => {
  for (const name in formulas) {
    if (formulas[name]?.exposeInContext) {
      return true
    }
  }
  for (const name in workflows) {
    if (workflows[name]?.exposeInContext) {
      return true
    }
  }
  return false
}

export const isContextProvider = (component: Component) => {
  let cached = contextProviderCache.get(component)
  if (cached === undefined) {
    cached = checkContextProvider(component)
    contextProviderCache.set(component, cached)
  }
  return cached
}

export const createFormulaDataSignals = (
  component: Component,
  dataSignal: Signal<ComponentData>,
  ctx: FormulaContext,
) => {
  const formulaDataSignals: Record<string, Signal<ComponentData>> = {}
  const componentFormulas = component.formulas
  if (componentFormulas) {
    for (const name in componentFormulas) {
      const formula = componentFormulas[name]
      if (!formula?.exposeInContext) {
        continue
      }
      const exposed = (formula as ComponentFormula).formula
      formulaDataSignals[name] = isStaticFormula(exposed)
        ? signal(applyFormula(exposed, ctx, dataSignal.get()))
        : dataSignal.map((data) =>
            applyFormula(
              exposed,
              ctx,
              data,
              IS_PREVIEW ? ['formulas', name] : undefined,
            ),
          )
    }
  }
  return formulaDataSignals
}
