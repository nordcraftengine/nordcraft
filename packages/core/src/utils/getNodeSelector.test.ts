import type { StyleVariant } from '../component/component.types'
import { getNodeSelector } from './getNodeSelector'

describe('getNodeSelector', () => {
  test('should return a selector to a specific node when given a path', () => {
    const path = '0.1.2'
    const selector = getNodeSelector(path)
    expect(selector).toBe('[data-id="0.1.2"]')
  })

  test('should return a selector to a specific node from a component instance', () => {
    const path = '0.1.2'
    const componentName = 'test-component'
    const nodeId = 'test-node'
    const selector = getNodeSelector(path, { componentName, nodeId })
    expect(selector).toBe('[data-id="0.1.2"].test-component\\:test-node')
  })

  test('should return a selector to a specific node variant when given a path and variant', () => {
    const path = '0.1.2'
    const variant: StyleVariant = {
      hover: true,
      style: {},
      breakpoint: 'medium',
    }
    const selector = getNodeSelector(path, { variant })
    expect(selector).toBe('[data-id="0.1.2"]:hover')
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
      '[data-id="0.1.2"].test-component\\:test-node.test-class:active',
    )
  })
})
