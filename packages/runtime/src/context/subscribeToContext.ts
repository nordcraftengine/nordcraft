import '@nordcraft/core/dist/compileTime'
import type {
  Component,
  ComponentData,
} from '@nordcraft/core/dist/component/component.types'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'

export function subscribeToContext(
  componentDataSignal: Signal<ComponentData>,
  component: Component,
  ctx: ComponentContext,
) {
  Object.entries(component.contexts ?? {}).forEach(
    ([providerName, context]) => {
      const providerKey = [ctx.package, providerName]
        .filter(isDefined)
        .join('/')
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

          const unsubscribe = formulaDataSignal.subscribe((value) => {
            const currentContexts = componentDataSignal.value.Contexts
            if (currentContexts?.[providerName]?.[formulaName] === value) {
              return
            }

            componentDataSignal.update(
              (data) => ({
                ...data,
                Contexts: {
                  ...data.Contexts,
                  [providerName]: {
                    ...data.Contexts?.[providerName],
                    [formulaName]: value,
                  },
                },
              }),
              // We know that the value has changed as we are just forwarding it,
              // so we can safely force the update and skip any subsequent checks for equality
              { force: true },
            )
          })
          componentDataSignal.subscriptions.push(unsubscribe)
        })
      }

      // In preview and absence of a real provider, we fake providers with their testData values.
      // This is useful for testing components in isolation.
      // The implementation is injected via `toddle._preview` to avoid bundling it in all runtime bundles.
      else if (IS_PREVIEW && !provider) {
        ctx.toddle._preview?.providerContextMock?.({
          componentDataSignal,
          component,
          ctx,
          providerName,
          context,
        })
      }
    },
  )
}
