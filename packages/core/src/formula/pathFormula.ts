import type { FormulaContext, PathOperation } from './formula'

export const applyPathFormula = (
  formula: PathOperation,
  data: FormulaContext['data'],
) => {
  const path = formula.path
  const len = path.length
  // Unrolled fast paths for the overwhelmingly common 1- and 2-segment
  // lookups (e.g. `Variables.count`, `Attributes.x`). This is proven to
  // be faster than generic loops for common cases.
  if (len === 1) {
    if (data !== null && typeof data === 'object') {
      return (data as unknown as Record<string | number, unknown>)[
        path[0] as string
      ]
    }
    return null
  }
  if (len === 2) {
    if (data === null || typeof data !== 'object') {
      return null
    }
    const first = (data as unknown as Record<string | number, unknown>)[
      path[0] as string
    ]
    if (first !== null && typeof first === 'object') {
      return (first as Record<string | number, unknown>)[path[1] as string]
    }
    return null
  }
  let input: any = data
  for (let i = 0; i < len; i++) {
    if (input !== null && typeof input === 'object') {
      input = input[path[i] as string]
    } else {
      return null
    }
  }

  return input
}
