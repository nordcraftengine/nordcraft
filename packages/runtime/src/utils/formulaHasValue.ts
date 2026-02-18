import type { Formula } from '@nordcraft/core/dist/formula/formula'
import { isDefined } from '@nordcraft/core/dist/src/utils/util'

export const formulaHasValue = (formula: Formula | undefined) =>
  isDefined(formula) && !(formula.type === 'value' && !isDefined(formula.value))
