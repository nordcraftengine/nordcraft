import { invalidStyleSyntaxRule } from './invalidStyleSyntaxRule'
import { legacyStyleVariableRule } from './legacyStyleVariableRule'
import { legacyThemeRule } from './legacyThemeRule'
import { noReferenceAnimationRule } from './noReferenceAnimationRule'
import { noReferenceGlobalCSSVariableRule } from './noReferenceGlobalCSSVariable'
import { unknownClassnameRule } from './unknownClassnameRule'
import { unknownCSSVariableRule } from './unknownCSSVariable'

export default [
  noReferenceAnimationRule,
  invalidStyleSyntaxRule,
  legacyStyleVariableRule,
  legacyThemeRule,
  unknownClassnameRule,
  unknownCSSVariableRule,
  noReferenceGlobalCSSVariableRule,
]
