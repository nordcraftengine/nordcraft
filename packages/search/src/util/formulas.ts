import type { Formula, PathOperation } from '@nordcraft/core'

export const isPathFormula = (formula: Formula): formula is PathOperation => {
  return formula.type === 'path'
}
