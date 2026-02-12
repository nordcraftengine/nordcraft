import { createStaticSizeConstraintRule } from './createStaticSizeConstraintRule'
import { noReferenceNodeRule } from './noReferenceNodeRule'
import { requireExtensionRule } from './requireExtensionRule'
import { unknownCookieRule } from './unknownCookieRule'

export default [
  noReferenceNodeRule,
  requireExtensionRule,
  unknownCookieRule,
  // 100 KB is a large SVG
  createStaticSizeConstraintRule('svg', 100 * 1024),
  // 50 KB is a large img element (with potential base64 encoded image)
  createStaticSizeConstraintRule('img', 50 * 1024),
]
