import type { StyleVariant } from '../component/component.types'
import { getPathClassName } from '../styling/className'
import { getNodeSelector } from './getNodeSelector'

describe('getNodeSelector', () => {
  test('should return a selector to a specific node when given a path', () => {
    const path = '0.1.2'
    const selector = getNodeSelector(path)
    expect(selector).toBe(`.${getPathClassName(path)}`)
  })

  test('should return a selector to a specific node from a component instance', () => {
    const path = '0.1.2'
    const componentName = 'test-component'
    const nodeId = 'test-node'
    const selector = getNodeSelector(path, { componentName, nodeId })
    expect(selector).toBe(
      `.${getPathClassName(path)}.test-component\\:test-node`,
    )
  })

  test('should return a selector to a specific node variant when given a path and variant', () => {
    const path = '0.1.2'
    const variant: StyleVariant = {
      hover: true,
      style: {},
      breakpoint: 'medium',
    }
    const selector = getNodeSelector(path, { variant })
    expect(selector).toBe(`.${getPathClassName(path)}:hover`)
  })

  test('should return a selector to a specific node variant from a component instance', () => {
    const path = '0.1.2'
    const componentName = 'test-component'
    const nodeId = 'test-node'
    const variant: StyleVariant = {
      className: 'test-class',
      active: true,
      style: {},
      breakpoint: 'medium',
    }
    const selector = getNodeSelector(path, { componentName, nodeId, variant })
    expect(selector).toBe(
      `.${getPathClassName(path)}.test-component\\:test-node.test-class:active`,
    )
  })

  test('should escape unescaped slashes in the path', () => {
    const path = '0.1/2'
    const selector = getNodeSelector(path)
    expect(selector).toBe(`.${getPathClassName(path)}`)
  })

  test('should not escape already escaped slashes in the path', () => {
    const path = '0.1\\/2'
    const selector = getNodeSelector(path)
    expect(selector).toBe(`.${getPathClassName(path)}`)
  })

  test('should prefix selector with an underscore if it starts with a number', () => {
    const path = '0.1\\/2'
    const selector = getNodeSelector(path, {
      componentName: '404',
      nodeId: 'test-node',
    })
    expect(selector).toBe(`.${getPathClassName(path)}._404\\:test-node`)
  })
})
