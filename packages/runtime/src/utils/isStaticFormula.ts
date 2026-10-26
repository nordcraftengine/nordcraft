import type { Formula } from '@nordcraft/core'
import { isDefined } from '@nordcraft/core'
import '@nordcraft/core/compileTime'

/**
 * Very simple check to determine if a formula is static (i.e., of type 'value').
 *
 * This is not to be extended to handle complex static detection, instead a compiler
 * step will at compile time reduce complex formulas to static value formulas.
 */
export function isStaticFormula(
  formula: unknown,
): formula is Extract<Formula, { type: 'value' }> {
  return (
    !IS_PREVIEW && isDefined(formula) && (formula as Formula).type === 'value'
  )
}
