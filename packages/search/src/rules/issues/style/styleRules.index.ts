import { invalidStyleSyntaxRule } from './invalidStyleSyntaxRule'
import { noReferenceGlobalCSSVariableRule } from './noReferenceGlobalCSSVariable'
import { unknownClassnameRule } from './unknownClassnameRule'

export default [
  invalidStyleSyntaxRule,
  unknownClassnameRule,
  noReferenceGlobalCSSVariableRule,
]
