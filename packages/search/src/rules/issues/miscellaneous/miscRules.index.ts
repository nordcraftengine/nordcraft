import { createStaticSizeConstraintRule } from './createStaticSizeConstraintRule'
import { noReferenceNodeRule } from './noReferenceNodeRule'
import { requireExtensionRule } from './requireExtensionRule'
import { unknownCookieRule } from './unknownCookieRule'

export default [
  noReferenceNodeRule,
  requireExtensionRule,
  unknownCookieRule,
  createStaticSizeConstraintRule('svg', 100 * 1024), // 100 KB is a large SVG
]
