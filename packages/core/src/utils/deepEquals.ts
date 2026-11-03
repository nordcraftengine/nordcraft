const objectKeys = Object.keys
const hasOwnProperty = Object.prototype.hasOwnProperty
const objectValueOf = Object.prototype.valueOf
const objectToString = Object.prototype.toString

/**
 * Compares two values deeply.
 *
 * The implementation is intentionally optimised for the data shapes used by
 * Nordcraft signals (plain objects, arrays and JSON-like values) while still
 * handling the built-in types that can occur in page data.
 *
 * Semantics match `fast-deep-equal` for primitives, `NaN`, plain objects,
 * arrays, dates, regular expressions and boxed primitives. `Map` and `Set`
 * are compared by value and `Error` instances by name and message.
 *
 * Objects such as `Headers`, `FormData` and `ArrayBuffer` have no enumerable
 * own properties, so they compare equal regardless of content — the same
 * behaviour as `fast-deep-equal`.
 */
export function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }

  if (a === null || b === null) {
    return false
  }

  if (typeof a !== 'object' || typeof b !== 'object') {
    // `===` already failed, so the only remaining equal case is NaN.
    return a !== a && b !== b
  }

  const constructor = (a as object).constructor
  if (constructor !== (b as object).constructor) {
    return false
  }

  // Plain objects and arrays account for the vast majority of comparisons, so
  // they are checked before the less common built-ins.
  if (constructor === Object) {
    return areObjectsEqual(
      a as Record<string, unknown>,
      b as Record<string, unknown>,
    )
  }
  if (constructor === Array) {
    return areArraysEqual(a as unknown[], b as unknown[])
  }
  if (constructor === Map || constructor === Set) {
    return areUnorderedEqual(
      a as Map<unknown, unknown> | Set<unknown>,
      b as Map<unknown, unknown> | Set<unknown>,
    )
  }
  if (a instanceof Error) {
    return a.name === (b as Error).name && a.message === (b as Error).message
  }

  // Dates, boxed primitives, URLs, regular expressions and typed arrays all
  // expose a meaningful `valueOf`/`toString` representation.
  const valueOf = (a as { valueOf?: unknown }).valueOf
  if (typeof valueOf === 'function' && valueOf !== objectValueOf) {
    return (
      (a as { valueOf(): unknown }).valueOf() ===
      (b as { valueOf(): unknown }).valueOf()
    )
  }
  const toString = (a as { toString?: unknown }).toString
  if (typeof toString === 'function' && toString !== objectToString) {
    return (
      (a as { toString(): string }).toString() ===
      (b as { toString(): string }).toString()
    )
  }

  return areObjectsEqual(
    a as Record<string, unknown>,
    b as Record<string, unknown>,
  )
}

function areObjectsEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  const keysA = objectKeys(a)
  const keysB = objectKeys(b)
  const length = keysA.length
  if (length !== keysB.length) {
    return false
  }
  for (let i = length - 1; i >= 0; i--) {
    const key = keysA[i] as string
    if (
      (key !== keysB[i] && !hasOwnProperty.call(b, key)) ||
      !deepEquals(a[key], b[key])
    ) {
      return false
    }
  }
  return true
}

function areArraysEqual(a: unknown[], b: unknown[]): boolean {
  const length = a.length
  if (length !== b.length) {
    return false
  }
  for (let i = 0; i < length; i++) {
    if (!deepEquals(a[i], b[i])) {
      return false
    }
  }
  return true
}

/**
 * Compares `Map` and `Set` values without relying on insertion order. `Map`
 * iteration yields `[key, value]` pairs, which are compared as arrays.
 */
function areUnorderedEqual(
  a: Map<unknown, unknown> | Set<unknown>,
  b: Map<unknown, unknown> | Set<unknown>,
): boolean {
  const size = a.size
  if (size !== b.size) {
    return false
  }
  if (size === 0) {
    return true
  }

  // Each value in `a` needs to find an unused, deeply-equal counterpart in `b`.
  const matched = new Uint8Array(size)
  for (const aValue of a) {
    let bIndex = 0
    let found = false
    for (const bValue of b) {
      if (matched[bIndex] === 0 && deepEquals(aValue, bValue)) {
        matched[bIndex] = 1
        found = true
        break
      }
      bIndex++
    }
    if (!found) {
      return false
    }
  }
  return true
}
