import type { ComponentData } from '../component/component.types'
import type { PathOperation } from './formula'

export const applyPathFormula = (
  formula: PathOperation,
  data: ComponentData,
  args?: any,
) => {
  let input: any = data
  for (let i = 0; i < formula.path.length; i++) {
    const key = formula.path[i]!
    if (i === 0 && key === 'Args') {
      input = args
    } else if (input && typeof input === 'object') {
      input = (input as any)[key]
    } else {
      return null
    }
  }

  return input
}
