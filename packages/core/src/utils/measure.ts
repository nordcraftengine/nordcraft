const MAX_STACK_SIZE = 10
let stackIndex = 0
const stack: {
  key: string
  details: Record<string, unknown>
  start: number
}[] = []
export const measure = (key: string, details: Record<string, unknown>) => {
  if (sessionStorage.getItem('__nc_measure') !== 'true') {
    return () => {}
  }

  const selfIndex = stackIndex++
  if (stack.length >= MAX_STACK_SIZE) {
    return () => {}
  }

  const stackEntry = {
    key,
    details,
    start: performance.now(),
  }
  stack.push(stackEntry)
  return (extraDetails?: Record<string, unknown>) => {
    performance.measure(stackEntry.key, {
      start: stackEntry.start,
      end: performance.now(),
      detail: {
        devtools: {
          dataType: 'track-entry',
          track: 'Nordcraft devtools',
          properties: [
            ...Object.entries({ ...details, ...extraDetails }).map(([k, v]) => [
              k,
              String(v),
            ]),
            ['Stack depth', stack.length],
            ['Measure index', selfIndex],
            ['Sub-measures', stackIndex - selfIndex],
          ],
          tooltipText: `${selfIndex}. ${key}`,
        },
      },
    })
    stack.pop()
  }
}
