import { describe, expect, it } from 'bun:test'
import '../happydom'
import {
  ensureEfficientOrdering,
  getNextSiblingElement,
  stripNodeIdRepeatIndices,
} from './nodes'

describe('getNextSiblingElement', () => {
  it('should return null if there are no children', () => {
    const parent = document.createElement('div')
    expect(getNextSiblingElement('0.1', parent)).toBeNull()
  })

  it('should return the next sibling based on index', () => {
    const parent = document.createElement('div')
    const child1 = document.createElement('div')
    child1.setAttribute('data-id', '0.1')
    const child2 = document.createElement('div')
    child2.setAttribute('data-id', '0.2')
    parent.appendChild(child1)
    parent.appendChild(child2)

    expect(getNextSiblingElement('0.0', parent)).toBe(child1)
    expect(getNextSiblingElement('0.1', parent)).toBe(child2)
    expect(getNextSiblingElement('0.2', parent)).toBeNull()
  })

  it('should return the next sibling based on repeat index', () => {
    const parent = document.createElement('div')
    const child1 = document.createElement('div')
    child1.setAttribute('data-id', '0.1(0)')
    const child2 = document.createElement('div')
    child2.setAttribute('data-id', '0.1(1)')
    parent.appendChild(child1)
    parent.appendChild(child2)

    expect(getNextSiblingElement('0.1(0)', parent)).toBe(child2)
    expect(getNextSiblingElement('0.1(1)', parent)).toBeNull()
  })

  it('should skip children with lower indices', () => {
    const parent = document.createElement('div')
    const child1 = document.createElement('div')
    child1.setAttribute('data-id', '0.1')
    const child2 = document.createElement('div')
    child2.setAttribute('data-id', '0.3')
    parent.appendChild(child1)
    parent.appendChild(child2)

    expect(getNextSiblingElement('0.2', parent)).toBe(child2)
  })

  it('should work with complex paths', () => {
    const parent = document.createElement('div')
    const child = document.createElement('div')
    child.setAttribute('data-id', '1.2.3(5)')
    parent.appendChild(child)

    expect(getNextSiblingElement('1.2.3(4)', parent)).toBe(child)
    expect(getNextSiblingElement('1.2.3(5)', parent)).toBeNull()
    expect(getNextSiblingElement('1.2.2', parent)).toBe(child)
  })
})

describe('ensureEfficientOrdering and getNextSiblingElement together', () => {
  it('should insert a new item in the correct position among existing items', () => {
    const parent = document.createElement('div')

    // Initial state: [node-1, node-3]
    const node1 = document.createElement('div')
    node1.setAttribute('data-id', '0.1')
    const node3 = document.createElement('div')
    node3.setAttribute('data-id', '0.3')

    parent.appendChild(node1)
    parent.appendChild(node3)

    // We want to insert node-2 (data-id: 0.2)
    const node2 = document.createElement('div')
    node2.setAttribute('data-id', '0.2')

    // Find where node2 should go
    const nextSibling = getNextSiblingElement('0.2', parent)
    expect(nextSibling).toBe(node3)

    // Use ensureEfficientOrdering to place it using nextSibling as the anchor
    ensureEfficientOrdering(parent, [node1, node2], nextSibling)

    expect(parent.childNodes[0]).toBe(node1)
    expect(parent.childNodes[1]).toBe(node2)
    expect(parent.childNodes[2]).toBe(node3)
  })

  it('should handle repeat indices correctly when inserting', () => {
    const parent = document.createElement('div')

    const node1_0 = document.createElement('div')
    node1_0.setAttribute('data-id', '0.1(0)')
    const node1_2 = document.createElement('div')
    node1_2.setAttribute('data-id', '0.1(2)')

    parent.appendChild(node1_0)
    parent.appendChild(node1_2)

    const node1_1 = document.createElement('div')
    node1_1.setAttribute('data-id', '0.1(1)')

    const nextSibling = getNextSiblingElement('0.1(1)', parent)
    expect(nextSibling).toBe(node1_2)

    // Use ensureEfficientOrdering to place it using nextSibling as the anchor
    ensureEfficientOrdering(parent, [node1_0, node1_1], nextSibling)

    expect(parent.childNodes[0]).toBe(node1_0)
    expect(parent.childNodes[1]).toBe(node1_1)
    expect(parent.childNodes[2]).toBe(node1_2)
  })
})

describe('ensureEfficientOrdering', () => {
  it('should append items to an empty parent', () => {
    const parent = document.createElement('div')
    const item1 = document.createElement('span')
    const item2 = document.createElement('span')

    ensureEfficientOrdering(parent, [item1, item2])

    expect(parent.childNodes.length).toBe(2)
    expect(parent.childNodes[0]).toBe(item1)
    expect(parent.childNodes[1]).toBe(item2)
  })

  it('should insert items at the correct position without moving existing balanced items', () => {
    const parent = document.createElement('div')
    const existing1 = document.createElement('div')
    const existing2 = document.createElement('div')
    parent.appendChild(existing1)
    parent.appendChild(existing2)

    const newItem = document.createElement('span')

    // Insert newItem before existing2
    ensureEfficientOrdering(parent, [existing1, newItem, existing2])

    expect(parent.childNodes.length).toBe(3)
    expect(parent.childNodes[0]).toBe(existing1)
    expect(parent.childNodes[1]).toBe(newItem)
    expect(parent.childNodes[2]).toBe(existing2)
  })

  it('should reorder items if they are not in the correct order', () => {
    const parent = document.createElement('div')
    const item1 = document.createElement('div')
    const item2 = document.createElement('div')
    parent.appendChild(item2)
    parent.appendChild(item1)

    // Desired order is item1, item2
    ensureEfficientOrdering(parent, [item1, item2])

    expect(parent.childNodes.length).toBe(2)
    expect(parent.childNodes[0]).toBe(item1)
    expect(parent.childNodes[1]).toBe(item2)
  })

  it('should handle a mix of Elements and Text nodes', () => {
    const parent = document.createElement('div')
    const item1 = document.createElement('span')
    const item2 = document.createTextNode('text node')

    ensureEfficientOrdering(parent, [item1, item2])

    expect(parent.childNodes.length).toBe(2)
    expect(parent.childNodes[0]).toBe(item1)
    expect(parent.childNodes[1]).toBe(item2)
  })

  it('should insert before a specified nextElement', () => {
    const parent = document.createElement('div')
    const spacer = document.createElement('div')
    parent.appendChild(spacer)

    const item1 = document.createElement('span')
    const item2 = document.createElement('span')

    ensureEfficientOrdering(parent, [item1, item2], spacer)

    expect(parent.childNodes.length).toBe(3)
    expect(parent.childNodes[0]).toBe(item1)
    expect(parent.childNodes[1]).toBe(item2)
    expect(parent.childNodes[2]).toBe(spacer)
  })

  it('should handle moving an item from the end to the beginning', () => {
    const parent = document.createElement('div')
    const item1 = document.createElement('div')
    const item2 = document.createElement('div')
    const item3 = document.createElement('div')
    parent.appendChild(item1)
    parent.appendChild(item2)
    parent.appendChild(item3)

    // Move item3 to the front
    ensureEfficientOrdering(parent, [item3, item1, item2])

    expect(parent.childNodes[0]).toBe(item3)
    expect(parent.childNodes[1]).toBe(item1)
    expect(parent.childNodes[2]).toBe(item2)
  })
})

describe('stripNodeIdRepeatIndices', () => {
  it('should return null if nodeId is null', () => {
    expect(stripNodeIdRepeatIndices(null)).toBeNull()
  })

  it('should return null if nodeId is undefined', () => {
    // @ts-expect-error testing undefined input
    expect(stripNodeIdRepeatIndices(undefined)).toBeNull()
  })

  it('should return the same string if there are no repeat indices', () => {
    expect(stripNodeIdRepeatIndices('1.2.3')).toBe('1.2.3')
  })

  it('should strip repeat indices from a single part', () => {
    expect(stripNodeIdRepeatIndices('1(0)')).toBe('1')
  })

  it('should strip repeat indices from multiple parts', () => {
    expect(stripNodeIdRepeatIndices('1.2(3).4(5)')).toBe('1.2.4')
  })

  it('should handle mixed parts with and without repeat indices', () => {
    expect(stripNodeIdRepeatIndices('1.2(3).4.5(6)')).toBe('1.2.4.5')
  })

  it('should handle parts with multiple parentheses', () => {
    expect(stripNodeIdRepeatIndices('1(0(1)).2(3)')).toBe('1.2')
  })

  it('should handle nodeId with only repeat indices', () => {
    expect(stripNodeIdRepeatIndices('(0)')).toBe('')
  })
})
