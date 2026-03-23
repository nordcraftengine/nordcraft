const globalScope: any = typeof globalThis !== 'undefined' ? globalThis : window
globalScope.__nc_measure_max_depth = 10
globalScope.__nc_measure_enabled =
  typeof sessionStorage !== 'undefined' &&
  sessionStorage.getItem('__nc_measure') === 'true'

globalScope.__nc_enableMeasure = (enabled = true, maxDepth = 10) => {
  if (enabled) {
    sessionStorage.setItem('__nc_measure', 'true')
  } else {
    sessionStorage.removeItem('__nc_measure')
  }
  globalScope.__nc_measure_enabled = enabled
  globalScope.__nc_measure_max_depth = maxDepth
}

let measureCount = 0
const STACK: string[] = []
const NOOP = () => {}

export const measure = (key: string, details: Record<string, unknown>) => {
  if (!globalScope.__nc_measure_enabled) {
    return NOOP
  }

  const selfIndex = measureCount++
  if (STACK.length >= globalScope.__nc_measure_max_depth) {
    return NOOP
  }

  const start = performance.now()
  STACK.push(key)

  return (extraDetails?: Record<string, unknown>) => {
    const end = performance.now()
    const mergedDetails = extraDetails
      ? { ...details, ...extraDetails }
      : details

    performance.measure(key, {
      start,
      end,
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Nordcraft devtools',
          properties: [
            ...Object.entries(mergedDetails).map(([k, v]) => [k, String(v)]),
            ['Stack', STACK.join(' > ')],
            ['Measure index', selfIndex],
            ['Sub-measures', measureCount - selfIndex],
          ],
          tooltipText: `${selfIndex}. ${key}`,
        },
      },
    })
    STACK.pop()
  }
}
