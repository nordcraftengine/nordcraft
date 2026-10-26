import type { Component, ComponentData } from '@nordcraft/core'
import { isDefined } from '@nordcraft/core'
import '@nordcraft/core/compileTime'
import { providerContextMock } from '../editor/mockProviderContext'
import { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'

export function subscribeToContext(
  componentDataSignal: Signal<ComponentData>,
  component: Component,
  ctx: ComponentContext,
) {
  const contexts = component.contexts
  if (!contexts) {
    return
  }
  const entries = Object.entries(contexts)
  if (entries.length === 0) {
    return
  }
  entries.forEach(([providerName, context]) => {
    const providerKey = isDefined(ctx.package)
      ? `${ctx.package}/${providerName}`
      : providerName
    const provider = ctx.providers[providerKey] ?? ctx.providers[providerName]

    if (provider) {
      context.formulas.forEach((formulaName) => {
        const formulaDataSignal = provider.formulaDataSignals[formulaName]
        if (!formulaDataSignal) {
          // eslint-disable-next-line no-console
          console.warn(
            `Component error(${component.name}): Provider ${providerName} does not expose a formula named "${formulaName}". Available formulas are: ["${Object.keys(
              provider.formulaDataSignals,
            ).join('", "')}"]`,
          )
          return
        }

        const initialVal = formulaDataSignal.get()
        if (componentDataSignal.value.Contexts?.[providerName]) {
          componentDataSignal.value.Contexts[providerName][formulaName] =
            initialVal
        } else {
          componentDataSignal.value.Contexts = {
            ...componentDataSignal.value.Contexts,
            [providerName]: {
              ...componentDataSignal.value.Contexts?.[providerName],
              [formulaName]: initialVal,
            },
          }
        }

        const unsubscribe = formulaDataSignal.subscribe((value) => {
          const data = componentDataSignal.value
          const currentContexts = data.Contexts
          if (currentContexts?.[providerName]?.[formulaName] === value) {
            return
          }

          componentDataSignal.set(
            {
              ...data,
              Contexts: {
                ...currentContexts,
                [providerName]: {
                  ...currentContexts?.[providerName],
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
      })
    }

    // In preview and absence of a real provider, we fake providers with their testData values.
    // This is useful for testing components in isolation.
    else if (IS_PREVIEW && !provider && ctx.toddle._preview) {
      providerContextMock({
        componentDataSignal,
        component,
        ctx,
        providerName,
        context,
      })
    }
  })
}
