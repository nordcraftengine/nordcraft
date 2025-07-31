import type { StyleVariant } from '@nordcraft/core/dist/component/component.types'
import type { Signal } from '../signal/signal'

import { CUSTOM_PROPERTIES_STYLESHEET_ID } from '@nordcraft/core/dist/styling/theme.const'
import { CustomPropertyStyleSheet } from '../styles/CustomPropertyStyleSheet'

let customPropertiesStylesheet: CustomPropertyStyleSheet | undefined

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
  customPropertiesStylesheet =
    customPropertiesStylesheet ??
    new CustomPropertyStyleSheet(
      root,
      (
        root.getElementById(CUSTOM_PROPERTIES_STYLESHEET_ID) as
          | HTMLStyleElement
          | undefined
      )?.sheet,
    )

  signal.subscribe(
    customPropertiesStylesheet.registerProperty(
      selector,
      customPropertyName,
      variant,
    ),
    {
      destroy: () =>
        customPropertiesStylesheet?.unregisterProperty(
          selector,
          customPropertyName,
          variant,
        ),
    },
  )
}
