import type { FormulaHandler } from '@nordcraft/core'

type SortKey = string | number | boolean

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
  if (array.length <= 1) {
    return [...array]
  }
  const ascendingModifier = ascending ? 1 : -1
  const evaluateKey = formula as (args: {
    item: unknown
  }) => SortKey | SortKey[]
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
  const keyed = array.map((item) => [item, evaluateKey({ item })] as const)
  keyed.sort(([, keyA], [, keyB]) => {
    if (Array.isArray(keyA) && Array.isArray(keyB)) {
      for (let i = 0; i < keyA.length; i++) {
        if (keyA[i] === keyB[i]) {
          continue
        }
        return (keyA[i]! > keyB[i]! ? 1 : -1) * ascendingModifier
      }
      return 0
    }
    if (keyA === keyB) {
      return 0
    }
    return ((keyA as SortKey) > (keyB as SortKey) ? 1 : -1) * ascendingModifier
  })
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
