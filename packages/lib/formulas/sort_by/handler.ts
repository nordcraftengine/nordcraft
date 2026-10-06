import type { FormulaHandler } from '@nordcraft/core/dist/types'

const compareSortKeys = (
  keyA: any,
  keyB: any,
  ascendingModifier: 1 | -1,
): number => {
  if (Array.isArray(keyA) && Array.isArray(keyB)) {
    for (const i in keyA) {
      if (keyA[i] === keyB[i]) {
        continue
      }
      return (keyA[i] > keyB[i] ? 1 : -1) * ascendingModifier
    }
    return 0
  }

  if (keyA === keyB) {
    return 0
  }
  return (keyA > keyB ? 1 : -1) * ascendingModifier
}

const handler: FormulaHandler<Array<unknown>> = ([
  array,
  formula,
  ascending,
]) => {
  if (!Array.isArray(array)) {
    return null
  }
  if (typeof formula !== 'function') {
    return null
  }
  if (typeof ascending !== 'boolean') {
    return null
  }
  const ascendingModifier = ascending ? 1 : -1
  const keyed = array.map((item) => [item, formula({ item })] as const)
  keyed.sort((a, b) => compareSortKeys(a[1], b[1], ascendingModifier))
  return keyed.map(([item]) => item)
}

export default handler

export const getArgumentInputData = (
  [items]: unknown[],
  argIndex: number,
  input: any,
) => {
  if (argIndex === 1 && Array.isArray(items)) {
    return { ...input, Args: { item: items[0] } }
  }

  return input
}
