import { invalidStyleSyntaxRule } from './invalidStyleSyntaxRule'
import { legacyStyleVariableRule } from './legacyStyleVariableRule'
import { legacyThemeRule } from './legacyThemeRule'
import { noReferenceGlobalCSSVariableRule } from './noReferenceGlobalCSSVariable'
import { unknownClassnameRule } from './unknownClassnameRule'
import { unknownCSSVariableRule } from './unknownCSSVariable'

export default [
  invalidStyleSyntaxRule,
  legacyStyleVariableRule,
  legacyThemeRule,
  unknownClassnameRule,
  unknownCSSVariableRule,
  noReferenceGlobalCSSVariableRule,
]
