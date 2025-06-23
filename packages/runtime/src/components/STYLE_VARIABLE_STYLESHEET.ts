import { StylePropertyStyleSheet } from '../styles/StylePropertyStyleSheet'

export const STYLE_VARIABLE_STYLESHEET = new StylePropertyStyleSheet(
  (
    document.querySelector('#initial-style-variables') as
      | HTMLStyleElement
      | undefined
  )?.sheet,
)
