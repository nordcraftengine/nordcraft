import type { ComponentData } from '../component/component.types'
import type { PathOperation } from './formula'

export const applyPathFormula = (
  formula: PathOperation,
  data: ComponentData | undefined,
) => {
  let input: any = data
  for (const key of formula.path) {
    if (input && typeof input === 'object') {
      input = input[key]
    } else {
      return null
    }
  }

  return input
}
