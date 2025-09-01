/* eslint-disable @typescript-eslint/no-unnecessary-condition */
let shouldMeasure = Boolean(globalThis.sessionStorage?.getItem('measure'))
let maxDepth = Number(globalThis.sessionStorage?.getItem('measure-max-depth'))

const STACK: string[] = []
let index = 0

export function measure<T>(
  key: string,
  details: Record<string, unknown>,
  fn: () => T,
): T {
  if (!shouldMeasure) {
    return fn()
  }

  const startIndex = ++index
  if (STACK.length >= maxDepth) {
    return fn()
  }

  STACK.push(key)
  const start = performance.now()
  const result = fn()
  performance.measure(key, {
    start,
    end: performance.now(),
    detail: {
      devtools: {
        dataType: 'track-entry',
        track: 'Nordcraft devtools',
        properties: [
          ...Object.entries(details).map(([k, v]) => [k, String(v)]),
          ['Measure stack depth', STACK.length],
          ['Measure index', startIndex],
          ['Sub-measures', index - startIndex],
        ],
        tooltipText: `${index}. ${key}`,
      },
    },
  })
  STACK.pop()
  return result
}

// TODO: Find a better way to toggle performance measurement. Potentially a URL query parameter or use console.timeStamp if it truly has no overhead.
;(globalThis as any).__measure = (enabled: boolean, _maxDepth = Infinity) => {
  shouldMeasure = enabled
  maxDepth = _maxDepth
  if (enabled) {
    sessionStorage.setItem('measure', String(enabled))
    sessionStorage.setItem('measure-max-depth', String(_maxDepth))
  } else {
    sessionStorage.removeItem('measure')
    sessionStorage.removeItem('measure-max-depth')
  }
}
