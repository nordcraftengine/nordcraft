import type { ComponentData } from '../component/component.types'
import type { PathOperation } from './formula'

export const applyPathFormula = (
  formula: PathOperation,
  data: ComponentData | undefined,
) => {
  let input: any = data
  const path = formula.path
  for (let i = 0, len = path.length; i < len; i++) {
    if (input !== null && typeof input === 'object') {
      input = input[path[i] as string]
    } else {
      return null
    }
  }

  return input
}
