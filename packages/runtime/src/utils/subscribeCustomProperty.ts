import type { Signal } from '../signal/signal'

import { CUSTOM_PROPERTIES_STYLESHEET_ID } from '@nordcraft/core/dist/styling/theme.const'
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
