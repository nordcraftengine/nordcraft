import { CUSTOM_PROPERTIES__STYLESHEET_ID } from '@nordcraft/core/dist/styling/theme.const'
import { StylePropertyStyleSheet } from '../styles/StylePropertyStyleSheet'

export const STYLE_VARIABLE_STYLESHEET = new StylePropertyStyleSheet(
  (
    document.getElementById(CUSTOM_PROPERTIES__STYLESHEET_ID) as
      | HTMLStyleElement
      | undefined
  )?.sheet,
)
