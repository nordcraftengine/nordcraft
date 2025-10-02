import type { StyleVariant } from '@nordcraft/core/dist/component/component.types'
import type { Signal } from '../signal/signal'

import { CUSTOM_PROPERTIES_STYLESHEET_ID } from '@nordcraft/core/dist/styling/theme.const'
import type { Runtime } from '@nordcraft/core/dist/types'
import { CustomPropertyStyleSheet } from '../styles/CustomPropertyStyleSheet'

let customPropertiesStylesheet: CustomPropertyStyleSheet | undefined

export function subscribeCustomProperty({
  selector,
  customPropertyName,
  signal,
  variant,
  root,
  runtime,
}: {
  selector: string
  customPropertyName: string
  signal: Signal<string>
  variant?: StyleVariant
  root: Document | ShadowRoot
  runtime: Runtime
}) {
  customPropertiesStylesheet ??= new CustomPropertyStyleSheet(
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
      destroy: () => {
        customPropertiesStylesheet?.unregisterProperty(
          selector,
          customPropertyName,
          {
            deepClean: runtime === 'preview',
            mediaQuery: variant?.mediaQuery,
            startingStyle: variant?.startingStyle,
          },
        )
      },
    },
  )
}
