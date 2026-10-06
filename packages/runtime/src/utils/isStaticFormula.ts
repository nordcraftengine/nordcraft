import '@nordcraft/core/dist/compileTime'
import type { Formula } from '@nordcraft/core/dist/formula/formula'
import { isDefined } from '@nordcraft/core/dist/utils/util'

/**
 * Very simple check to determine if a formula is static (i.e., of type 'value').
 *
 * This is not to be extended to handle complex static detection, instead a compiler
 * step will at compile time reduce complex formulas to static value formulas.
 */
export const isStaticFormula = (
  formula: unknown,
): formula is Extract<Formula, { type: 'value' }> =>
  !IS_PREVIEW && isDefined(formula) && (formula as Formula).type === 'value'
