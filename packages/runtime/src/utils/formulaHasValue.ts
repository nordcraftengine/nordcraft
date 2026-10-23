import type { Formula } from '@nordcraft/core'
import { isDefined } from '@nordcraft/core'

export const formulaHasValue = (
  formula: Formula | undefined,
): formula is Formula =>
  isDefined(formula) && !(formula.type === 'value' && !isDefined(formula.value))
