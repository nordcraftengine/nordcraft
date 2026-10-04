import type { Signal } from '../signal/signal'
import { signal } from '../signal/signal'

import type { ComponentData } from '@nordcraft/core/dist/component/component.types'
import { CUSTOM_PROPERTIES_STYLESHEET_ID } from '@nordcraft/core/dist/styling/themeAttributes.const'
import type { StyleVariant } from '@nordcraft/core/dist/styling/variantSelector'
import { CustomPropertyStyleSheet } from '../styles/CustomPropertyStyleSheet'

export const customPropertiesStylesheets = new WeakMap<
  Document | ShadowRoot,
  CustomPropertyStyleSheet
>()

export function subscribeCustomProperty({
  selector,
  customPropertyName,
  signal,
  variant,
  root,
}: {
  selector: string
  customPropertyName: string
  signal: Signal<string>
  variant?: StyleVariant
  root: Document | ShadowRoot
}) {
  let stylesheet = customPropertiesStylesheets.get(root)
  if (!stylesheet) {
    stylesheet = new CustomPropertyStyleSheet(
      root,
      (
        root.getElementById(CUSTOM_PROPERTIES_STYLESHEET_ID) as
          | HTMLStyleElement
          | undefined
      )?.sheet,
    )
    customPropertiesStylesheets.set(root, stylesheet)
  }

  signal.subscribe(
    stylesheet.registerProperty(selector, customPropertyName, variant),
    {
      destroy: () => {
        stylesheet?.unregisterProperty(selector, customPropertyName, {
          mediaQuery: variant?.mediaQuery,
          startingStyle: variant?.startingStyle,
        })
      },
    },
  )
}

/**
 * Static counterpart of {@link subscribeCustomProperty} for precomputed
 * (value-formula) values. Uses a detached signal instead of a derived one:
 * no parent subscription, so parent updates never recompute it — while the
 * initial set and the unregister-on-unmount wiring behave exactly the same.
 */
export function subscribeStaticCustomProperty({
  selector,
  customPropertyName,
  value,
  variant,
  root,
  dataSignal,
}: {
  selector: string
  customPropertyName: string
  value: string
  variant?: StyleVariant
  root: Document | ShadowRoot
  dataSignal: Signal<ComponentData>
}) {
  const staticSignal = signal(value)
  subscribeCustomProperty({
    selector,
    customPropertyName,
    signal: staticSignal,
    variant,
    root,
  })
  // The standalone signal has no parent subscription driving its teardown,
  // so destroy it explicitly with the owning scope.
  dataSignal.subscriptions.push(() => staticSignal.destroy())
}
