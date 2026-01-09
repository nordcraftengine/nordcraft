import { invalidStyleSyntaxRule } from './invalidStyleSyntaxRule'
import { noReferenceGlobalCSSVariableRule } from './noReferenceGlobalCSSVariable'
import { unknownClassnameRule } from './unknownClassnameRule'
import { unknownCSSVariableRule } from './unknownCSSVariable'

export default [
  invalidStyleSyntaxRule,
  unknownClassnameRule,
  unknownCSSVariableRule,
  noReferenceGlobalCSSVariableRule,
]
