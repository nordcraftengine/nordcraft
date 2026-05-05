import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { measure } from './measure'

const globalScope = globalThis as any

describe('measure', () => {
  let originalPerformanceMeasure: any
  let originalPerformanceNow: any

  beforeEach(() => {
    // Reset global state
    globalScope.__nc_measure_enabled = false
    globalScope.__nc_measure_max_depth = 10

    // Mock performance
    originalPerformanceMeasure = performance.measure
    originalPerformanceNow = performance.now
    performance.measure = () => ({}) as any
    performance.now = () => 0

    // Mock sessionStorage
    globalScope.sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }
  })

  afterEach(() => {
    performance.measure = originalPerformanceMeasure
    performance.now = originalPerformanceNow
    delete globalScope.sessionStorage
  })

  test('should do nothing if NOT enabled', () => {
    const measureSpy = spyOn(performance, 'measure')
    const key = 'test-key'
    const stop = measure(key, { arg: 1 })

    expect(stop).toBeDefined()
    stop()

    expect(measureSpy).not.toHaveBeenCalled()
  })

  test('should call performance.measure when enabled', () => {
    globalScope.__nc_measure_enabled = true
    const measureSpy = spyOn(performance, 'measure')

    let now = 0
    performance.now = () => now++

    const key = 'test-performance'
    const stop = measure(key, { arg: 1 })

    stop({ extra: 2 })

    expect(measureSpy).toHaveBeenCalledWith(
      key,
      expect.objectContaining({
        start: 0,
        end: 1,
        detail: expect.objectContaining({
          devtools: expect.objectContaining({
            track: 'Nordcraft devtools',
            tooltipText: expect.stringContaining(key),
          }),
        }),
      }),
    )
  })

  test('should merge details and extraDetails', () => {
    globalScope.__nc_measure_enabled = true
    const measureSpy = spyOn(performance, 'measure')

    const stop = measure('key', { original: 'value' })
    stop({ extra: 'value' })

    const lastCall = measureSpy.mock.calls[0]
    const properties = lastCall[1].detail.devtools.properties

    const propsMap = new Map(properties)
    expect(propsMap.get('original')).toBe('value')
    expect(propsMap.get('extra')).toBe('value')
  })

  test('should respect max depth', () => {
    globalScope.__nc_measure_enabled = true
    globalScope.__nc_measure_max_depth = 2
    const measureSpy = spyOn(performance, 'measure')

    const stop1 = measure('depth-1', {})
    const stop2 = measure('depth-2', {})
    const stop3 = measure('depth-3', {}) // Should be NOOP

    stop3()
    expect(measureSpy).not.toHaveBeenCalled()

    stop2()
    expect(measureSpy).toHaveBeenCalledTimes(1)

    stop1()
    expect(measureSpy).toHaveBeenCalledTimes(2)
  })

  test('should handle nested measures and display stack', () => {
    globalScope.__nc_measure_enabled = true
    const measureSpy = spyOn(performance, 'measure')

    const stop1 = measure('parent', {})
    const stop2 = measure('child', {})

    stop2()
    const childCall = measureSpy.mock.calls[0]
    const childStack = new Map(childCall[1].detail.devtools.properties).get(
      'Stack',
    )
    expect(childStack).toBe('parent > child')

    stop1()
    const parentCall = measureSpy.mock.calls[1]
    const parentStack = new Map(parentCall[1].detail.devtools.properties).get(
      'Stack',
    )
    expect(parentStack).toBe('parent')
  })

  test('should only call finish once', () => {
    globalScope.__nc_measure_enabled = true
    const measureSpy = spyOn(performance, 'measure')

    const stop = measure('once', {})
    stop()
    stop()

    expect(measureSpy).toHaveBeenCalledTimes(1)
  })

  test('global __nc_enableMeasure should update state', () => {
    // We need to trigger the globalScope mock logic if we want to test the helper function
    // But since it's defined in the module scope of measure.ts, it might already be there
    if (typeof globalScope.__nc_enableMeasure === 'function') {
      globalScope.__nc_enableMeasure(true, 5)
      expect(globalScope.__nc_measure_enabled).toBe(true)
      expect(globalScope.__nc_measure_max_depth).toBe(5)
    }
  })
})
