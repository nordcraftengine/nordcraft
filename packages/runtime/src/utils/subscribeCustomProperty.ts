import type { StyleVariant } from '@nordcraft/core/dist/component/component.types'
import type { Signal } from '../signal/signal'

import { CUSTOM_PROPERTIES__STYLESHEET_ID } from '@nordcraft/core/dist/styling/theme.const'
import { CustomPropertyStyleSheet } from '../styles/CustomPropertyStyleSheet'

const CUSTOM_PROPERTIES_STYLESHEET = new CustomPropertyStyleSheet(
  (
    document.getElementById(CUSTOM_PROPERTIES__STYLESHEET_ID) as
      | HTMLStyleElement
      | undefined
  )?.sheet,
)

export function subscribeCustomProperty({
  selector,
  customPropertyName,
  signal,
  variant,
}: {
  selector: string
  customPropertyName: string
  signal: Signal<string>
  variant?: StyleVariant
}) {
  signal.subscribe(
    CUSTOM_PROPERTIES_STYLESHEET.registerProperty(
      selector,
      customPropertyName,
      variant,
    ),
    {
      destroy: () =>
        CUSTOM_PROPERTIES_STYLESHEET.unregisterProperty(
          selector,
          customPropertyName,
          variant,
        ),
    },
  )
}
