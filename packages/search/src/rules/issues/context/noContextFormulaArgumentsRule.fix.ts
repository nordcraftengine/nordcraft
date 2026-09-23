import { set } from '@nordcraft/core/dist/utils/collections'
import type { ComponentFormulaNode, FixFunction } from '../../../types'

export const removeContextFormulaArguments: FixFunction<
  ComponentFormulaNode,
  {
    formulaName: string
  }
> = ({ data: { path, files } }) => {
  const componentName = path[1] as string
  const formulaKey = path[3] as string
  if (!files.components[componentName]?.formulas?.[formulaKey]) {
    return
  }

  return set(files, [...path, 'arguments'], null)
}
