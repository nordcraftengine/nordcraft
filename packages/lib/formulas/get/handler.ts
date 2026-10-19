import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<unknown> = (args) => {
  const collection = args[0]
  const key = args[1]
  if (typeof collection === 'string') {
    return collection[Number(key)]
  }
  if (!Array.isArray(key)) {
    if (collection != null) {
      return (collection as Record<string | number, unknown>)[
        key as string | number
      ]
    }
    return undefined
  }
  const len = key.length
  if (len === 1) {
    if (collection != null) {
      return (collection as Record<string | number, unknown>)[
        key[0] as string | number
      ]
    }
    return undefined
  }
  if (len === 2) {
    if (collection != null) {
      const first = (collection as Record<string | number, unknown>)[
        key[0] as string | number
      ]
      if (first != null) {
        return (first as Record<string | number, unknown>)[
          key[1] as string | number
        ]
      }
    }
    return undefined
  }
  if (len === 0) {
    return collection
  }
  let current: any = collection
  for (let i = 0; i < len; i++) {
    if (current == null) {
      return undefined
    }
    current = current[key[i] as string | number]
  }
  return current
}

export default handler
