import { CUSTOM_PROPERTIES__STYLESHEET_ID } from '@nordcraft/core/dist/styling/theme.const'
import { CustomPropertyStyleSheet } from '../styles/CustomPropertyStyleSheet'

export const CUSTOM_PROPERTIES_STYLESHEET = new CustomPropertyStyleSheet(
  (
    document.getElementById(CUSTOM_PROPERTIES__STYLESHEET_ID) as
      | HTMLStyleElement
      | undefined
  )?.sheet,
)
