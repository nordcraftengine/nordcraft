import type {
  Formula,
  PathOperation,
} from '@nordcraft/core/dist/formula/formula'

export const isPathFormula = (formula: Formula): formula is PathOperation => {
  return formula.type === 'path'
}
