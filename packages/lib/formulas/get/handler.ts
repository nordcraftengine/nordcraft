import type { FormulaHandler } from '@nordcraft/core'

const handler: FormulaHandler<unknown> = ([collection, key]) => {
  if (typeof collection === 'string') {
    return collection[Number(key)]
  }
  const resolve = (collection: any, path: unknown[]): unknown => {
    if (path.length === 0) {
      return collection
    }
    const [head, ...rest] = path
    return resolve(collection?.[String(head)], rest)
  }
  return resolve(collection, Array.isArray(key) ? key : [key])
}

export default handler
