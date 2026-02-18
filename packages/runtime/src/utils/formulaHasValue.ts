import type { Formula } from '@nordcraft/core/dist/formula/formula'
import { isDefined } from '@nordcraft/core/dist/utils/util'

export const formulaHasValue = (
  formula: Formula | undefined,
): formula is Formula =>
  isDefined(formula) && !(formula.type === 'value' && !isDefined(formula.value))
