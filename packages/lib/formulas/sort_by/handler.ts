import type { FormulaHandler } from '@nordcraft/core/dist/types'

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
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
  return [...array].sort((a: any, b: any) => {
    const keyA = formula({ item: a })
    const keyB = formula({ item: b })
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
  })
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
