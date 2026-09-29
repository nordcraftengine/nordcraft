import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  DATA_ATTR_REPEAT_SELECTED,
  DATA_ATTR_SELECTED,
  SELECTOR_REPEAT_SELECTED,
  SELECTOR_SELECTED,
} from './const'
import { markSelectedElement } from './markSelectedElement'

describe('markSelectedElement', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="App">
        <div data-id="node-1">First</div>
        <div data-id="node-2">Second</div>
        <div data-id="node-2(0)">Second repeat 0</div>
        <div data-id="node-2(1)">Second repeat 1</div>
      </div>
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  test('marks element as selected and marks repeated elements', () => {
    const node2 = document.querySelector('[data-id="node-2"]')
    markSelectedElement(node2)

    expect(node2?.getAttribute(DATA_ATTR_SELECTED)).toBe('true')
    expect(
      document
        .querySelector('[data-id="node-2(0)"]')
        ?.getAttribute(DATA_ATTR_REPEAT_SELECTED),
    ).toBe('true')
    expect(
      document
        .querySelector('[data-id="node-2(1)"]')
        ?.getAttribute(DATA_ATTR_REPEAT_SELECTED),
    ).toBe('true')
  })

  test('clears previous selection when selecting a new element', () => {
    const node2 = document.querySelector('[data-id="node-2"]')
    const node1 = document.querySelector('[data-id="node-1"]')

    markSelectedElement(node2)
    expect(node2?.getAttribute(DATA_ATTR_SELECTED)).toBe('true')

    markSelectedElement(node1)
    expect(node2?.hasAttribute(DATA_ATTR_SELECTED)).toBe(false)
    expect(
      document
        .querySelector('[data-id="node-2(0)"]')
        ?.hasAttribute(DATA_ATTR_REPEAT_SELECTED),
    ).toBe(false)
    expect(node1?.getAttribute(DATA_ATTR_SELECTED)).toBe('true')
  })

  test('clears data-selected and data-repeat-selected when node is null', () => {
    const node2 = document.querySelector('[data-id="node-2"]')

    markSelectedElement(node2)
    expect(node2?.getAttribute(DATA_ATTR_SELECTED)).toBe('true')
    expect(
      document
        .querySelector('[data-id="node-2(0)"]')
        ?.getAttribute(DATA_ATTR_REPEAT_SELECTED),
    ).toBe('true')

    markSelectedElement(null)

    expect(node2?.hasAttribute(DATA_ATTR_SELECTED)).toBe(false)
    expect(document.querySelector(SELECTOR_SELECTED)).toBeNull()
    expect(
      document
        .querySelector('[data-id="node-2(0)"]')
        ?.hasAttribute(DATA_ATTR_REPEAT_SELECTED),
    ).toBe(false)
    expect(document.querySelector(SELECTOR_REPEAT_SELECTED)).toBeNull()
  })
})
