import type {
  Component,
  ComponentContext as ComponentContextConfig,
  ComponentData,
  Nullable,
} from '@nordcraft/core'
import { isDefined } from '@nordcraft/core'
import '@nordcraft/core/compileTime'
import { providerContextMock } from '../editor/mockProviderContext'
import { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { isStaticFormula } from '../utils/isStaticFormula'

export function subscribeToContext(
  componentDataSignal: Signal<ComponentData>,
  component: Component,
  ctx: ComponentContext,
) {
  const contexts = component.contexts
  if (!contexts) {
    return
  }
  for (const providerName in contexts) {
    const providerContext: Nullable<ComponentContextConfig> =
      contexts[providerName]
    if (!providerContext) {
      continue
    }
    const providerKey = isDefined(ctx.package)
      ? `${ctx.package}/${providerName}`
      : providerName
    const provider = ctx.providers[providerKey] ?? ctx.providers[providerName]

    if (provider) {
      const formulas: string[] = providerContext.formulas
      for (let i = 0; i < formulas.length; i++) {
        const formulaName = formulas[i]!
        const formulaDataSignal = provider.formulaDataSignals[formulaName]
        if (!formulaDataSignal) {
          // eslint-disable-next-line no-console
          console.warn(
            `Component error(${component.name}): Provider ${providerName} does not expose a formula named "${formulaName}". Available formulas are: ["${Object.keys(
              provider.formulaDataSignals,
            ).join('", "')}"]`,
          )
          continue
        }

        const initialVal = formulaDataSignal.get()
        const initialContexts = (componentDataSignal.value.Contexts ??= {})
        const initialProviderContext = (initialContexts[providerName] ??= {})
        initialProviderContext[formulaName] = initialVal

        const exposedFormula: unknown =
          provider.component.formulas?.[formulaName]?.formula
        if (isStaticFormula(exposedFormula)) {
          continue
        }

        const unsubscribe = formulaDataSignal.subscribe((value) => {
          const data = componentDataSignal.value
          const currentContexts = data.Contexts
          const currentProviderContext = currentContexts?.[providerName]
          if (currentProviderContext?.[formulaName] === value) {
            return
          }

          componentDataSignal.set(
            {
              ...data,
              Contexts: {
                ...currentContexts,
                [providerName]: {
                  ...currentProviderContext,
                  [formulaName]: value,
                },
              },
            },
            // We know that the value has changed as we are just forwarding it,
            // so we can safely force the update and skip any subsequent checks for equality
            Signal.FORCE_UPDATE,
          )
        })
        componentDataSignal.subscriptions.push(unsubscribe)
      }
    }

    // In preview and absence of a real provider, we fake providers with their testData values.
    // This is useful for testing components in isolation.
    else if (IS_PREVIEW && !provider && ctx.toddle._preview) {
      providerContextMock({
        componentDataSignal,
        component,
        ctx,
        providerName,
        context: providerContext,
      })
    }
  }
}
