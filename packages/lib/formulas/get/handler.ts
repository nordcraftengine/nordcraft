import type { FormulaHandler } from '@nordcraft/core/dist/types'

const handler: FormulaHandler<unknown> = ([collection, key]) => {
  if (typeof collection === 'string') {
    return collection[Number(key)]
  }

  if (Array.isArray(key)) {
    let current: any = collection
    for (let i = 0; i < key.length; i++) {
      if (current === null || current === undefined) {
        return undefined
      }
      current = current[String(key[i])]
    }
    return current
  }

  return (collection as any)?.[String(key)]
}

export default handler
