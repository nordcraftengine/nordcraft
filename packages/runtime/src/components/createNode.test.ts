import type { ComponentData } from '@nordcraft/core/dist/component/component.types'
import { describe, expect, test } from 'bun:test'
import '../../happydom'
import { signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { customPropertiesStylesheet } from '../utils/subscribeCustomProperty'
import { createNode } from './createNode'

describe('createNode()', () => {
  test('it can render basic nodes', () => {
    const parentElement = document.createElement('div')
    const nodes = createNode({
      ctx: {
        isRootComponent: false,
        component: {
          name: 'My Component',
          nodes: {
            'test-node-id': {
              type: 'element',
              tag: 'div',
              children: ['test-node-id.0', 'test-node-id.1'],
              attrs: {},
              events: {},
            },
            'test-node-id.0': {
              type: 'text',
              value: { type: 'value', value: 'Item 1' },
            },
            'test-node-id.1': {
              type: 'text',
              value: { type: 'value', value: 'Item 2' },
            },
          },
        },
      } as Partial<ComponentContext> as any,
      namespace: 'http://www.w3.org/1999/xhtml',
      dataSignal: signal<ComponentData>({
        Attributes: {},
        Variables: {},
      }),
      path: 'test-node',
      id: 'test-node-id',
      parentElement,
      instance: {},
    })
    expect(nodes.length).toBe(1)
    expect((nodes[0] as Element).outerHTML).toMatchInlineSnapshot(
      `"<div data-node-id="test-node-id" data-id="test-node" data-component="My Component" class="cYXIdv"><span data-node-id="test-node-id.0" data-id="test-node.0" data-component="My Component" data-node-type="text">Item 1</span><span data-node-id="test-node-id.1" data-id="test-node.1" data-component="My Component" data-node-type="text">Item 2</span></div>"`,
    )
  })

  test('repeat nodes should keep the same node references when items are shuffled/added/removed', () => {
    // In this test, we update the signal to change the order of the content in the repeat.
    // We use repeatKey, so the nodes should simply be moved in the DOM instead of recreated.
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
    const item1 = { id: 'i1', name: 'Item 1' }
    const item2 = { id: 'i2', name: 'Item 2' }
    const item3 = { id: 'i3', name: 'Item 3' }

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {
        items: [item1, item2, item3],
      },
    })

    const ctx: ComponentContext = {
      isRootComponent: false,
      component: {
        name: 'My Component',
        nodes: {
          'repeat-node-id': {
            type: 'element',
            tag: 'div',
            repeat: { type: 'path', path: ['Variables', 'items'] },
            repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
            children: ['text-node-id'],
            attrs: {},
            events: {},
            customProperties: {
              '--color': {
                syntax: {
                  type: 'primitive',
                  name: 'color',
                },
                formula: {
                  type: 'value',
                  value: 'red',
                },
              },
            },
          },
          'text-node-id': {
            type: 'text',
            value: { type: 'path', path: ['ListItem', 'Item', 'name'] },
          },
        },
      },
      root: document,
      env: { runtime: 'page' },
      formulaCache: {},
      toddle: {
        getCustomFormula: () => undefined,
      },
    } as any as ComponentContext

    const nodes = createNode({
      ctx,
      namespace: 'http://www.w3.org/1999/xhtml',
      dataSignal,
      path: '0.0.0',
      id: 'repeat-node-id',
      parentElement,
      instance: {},
    })

    // Custom properties stylesheet should be created and have the custom property from the node
    const sheet = customPropertiesStylesheet?.getStyleSheet()
    expect(sheet).toBeTruthy()
    expect(sheet?.cssRules.length).toBe(3)
    expect(sheet?.cssRules[0].cssText).toBe(
      '[data-id="0.0.0"] { --color: red; }',
    )

    parentElement.append(...nodes)

    expect(parentElement.children.length).toBe(3)
    const element1 = parentElement.children[0]
    const element2 = parentElement.children[1]
    const element3 = parentElement.children[2]

    expect(element1.textContent).toBe('Item 1')
    expect(element1.getAttribute('data-id')).toBe('0.0.0')
    expect(element2.textContent).toBe('Item 2')
    expect(element2.getAttribute('data-id')).toBe('0.0.0(1)')
    expect(element3.textContent).toBe('Item 3')
    expect(element3.getAttribute('data-id')).toBe('0.0.0(2)')

    // Shuffle the items: [3, 1, 2]
    dataSignal.update((data) => {
      return {
        ...data,
        Variables: {
          ...data.Variables,
          items: [item3, item1, item2],
        },
      }
    })

    // After update, elements should be shuffled but the same objects
    expect(parentElement.children.length).toBe(3)

    // Check text content first
    expect(parentElement.children[0].textContent).toBe('Item 3')
    expect(parentElement.children[1].textContent).toBe('Item 1')
    expect(parentElement.children[2].textContent).toBe('Item 2')

    // Check identities (do not use test-toBe for DOM nodes is annoying to compare and we are only interested in the reference match)
    expect(parentElement.children[0] === element3).toBeTruthy()
    expect(parentElement.children[0].getAttribute('data-id')).toBe(`0.0.0(2)`)
    expect(parentElement.children[1] === element1).toBeTruthy()
    expect(parentElement.children[1].getAttribute('data-id')).toBe(`0.0.0`)
    expect(parentElement.children[2] === element2).toBeTruthy()
    expect(parentElement.children[2].getAttribute('data-id')).toBe(`0.0.0(1)`)

    // Remove last item in the list
    dataSignal.update((data) => {
      return {
        ...data,
        Variables: {
          ...data.Variables,
          items: [item3, item1],
        },
      }
    })

    expect(parentElement.children.length).toBe(2)
    expect(parentElement.children[0] === element3).toBeTruthy()
    expect(parentElement.children[0].getAttribute('data-id')).toBe(`0.0.0(2)`)
    expect(parentElement.children[1] === element1).toBeTruthy()
    expect(parentElement.children[1].getAttribute('data-id')).toBe(`0.0.0`)

    // Make sure element 2 is removed from the DOM
    expect(element2.parentElement === null).toBeTruthy()

    // Should have cleaned the unused custom property from the stylesheet
    expect(sheet?.cssRules.length).toBe(2)

    // The rules should be correct for the remaining elements
    expect(sheet?.cssRules[0].cssText).toBe(
      '[data-id="0.0.0"] { --color: red; }',
    )
    expect(sheet?.cssRules[1].cssText).toBe(
      '[data-id="0.0.0(2)"] { --color: red; }',
    )

    // Add the same item multiple times
    dataSignal.update((data) => {
      return {
        ...data,
        Variables: {
          ...data.Variables,
          items: [item3, item1, item3, item3],
        },
      }
    })

    // Should have 4 elements and each should have a different data-id, as a duplicate repeatKey should undo any reuse optimizations
    expect(parentElement.children.length).toBe(4)
    // Expect all data-ids to be unique
    const dataIds = new Set<string>()
    for (const child of parentElement.children) {
      const dataId = child.getAttribute('data-id')
      expect(dataId).toBeTruthy()
      expect(
        dataIds.has(dataId!),
        `Duplicate data-id found: ${dataId}, all ids: ${[...parentElement.children].map((c) => c.getAttribute('data-id'))}`,
      ).toBeFalsy()
      dataIds.add(dataId!)
    }
  })

  test('conditional nodes should remove and recreate elements on toggle', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)
    const dataSignal = signal<ComponentData>({
      Attributes: { show: true },
    })

    const ctx = {
      isRootComponent: false,
      component: {
        name: 'My Component',
        nodes: {
          'conditional-node': {
            type: 'element',
            tag: 'div',
            condition: { type: 'path', path: ['Attributes', 'show'] },
            children: ['child-node'],
            attrs: {},
            events: {},
          },
          'child-node': {
            type: 'text',
            value: { type: 'value', value: 'Hello' },
          },
        },
      },
      root: document,
      env: { runtime: 'page' },
      formulaCache: {},
      toddle: {
        getCustomFormula: () => undefined,
      },
    } as any as ComponentContext

    const nodes = createNode({
      ctx,
      namespace: 'http://www.w3.org/1999/xhtml',
      dataSignal,
      path: 'cond',
      id: 'conditional-node',
      parentElement,
      instance: {},
    })

    parentElement.append(...nodes)
    expect(parentElement.children.length).toBe(1)
    const firstElement = parentElement.children[0]
    expect(firstElement.textContent).toBe('Hello')

    // Toggle off
    dataSignal.update((data) => ({
      ...data,
      Attributes: { ...data.Attributes, show: false },
    }))
    expect(parentElement.children.length).toBe(0)
    expect(firstElement.parentElement).toBeNull()

    // Toggle on again
    dataSignal.update((data) => ({
      ...data,
      Attributes: { ...data.Attributes, show: true },
    }))
    expect(parentElement.children.length).toBe(1)
    const secondElement = parentElement.children[0]
    expect(secondElement.textContent).toBe('Hello')
    // Identity should be different because conditional nodes recreate on toggle
    expect(secondElement === firstElement).toBeFalsy()
  })

  test('nested repeats should maintain node references for unchanged items', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)

    const itemA = {
      id: 'A',
      subItems: [
        { id: '1', val: 'A1' },
        { id: '2', val: 'A2' },
      ],
    }
    const itemB = {
      id: 'B',
      subItems: [
        { id: '3', val: 'B3' },
        { id: '4', val: 'B4' },
      ],
    }

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {
        items: [itemA, itemB],
      },
    })

    const ctx = {
      isRootComponent: false,
      component: {
        name: 'My Component',
        nodes: {
          'outer-repeat': {
            type: 'element',
            tag: 'div',
            repeat: { type: 'path', path: ['Variables', 'items'] },
            repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
            children: ['inner-repeat'],
            attrs: {
              class: { type: 'path', path: ['ListItem', 'Item', 'id'] },
            },
            events: {},
          },
          'inner-repeat': {
            type: 'element',
            tag: 'span',
            repeat: { type: 'path', path: ['ListItem', 'Item', 'subItems'] },
            repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
            children: ['text-node'],
            attrs: {},
            events: {},
          },
          'text-node': {
            type: 'text',
            value: { type: 'path', path: ['ListItem', 'Item', 'val'] },
          },
        },
      },
      root: document,
      env: { runtime: 'page' },
      formulaCache: {},
      toddle: {
        getCustomFormula: () => undefined,
      },
    } as any as ComponentContext

    const nodes = createNode({
      ctx,
      namespace: 'http://www.w3.org/1999/xhtml',
      dataSignal,
      path: 'nested',
      id: 'outer-repeat',
      parentElement,
      instance: {},
    })

    parentElement.append(...nodes)

    const outerA = parentElement.querySelector('.A')!
    const outerB = parentElement.querySelector('.B')!
    const innerA1 = outerA.children[0]
    const innerB3 = outerB.children[0]

    expect(innerA1.textContent).toBe('A1')
    expect(innerB3.textContent).toBe('B3')

    // Shuffle outer items
    dataSignal.update((data) => ({
      ...data,
      Variables: {
        ...data.Variables,
        items: [itemB, itemA],
      },
    }))

    expect(parentElement.children[0] === outerB).toBeTruthy()
    expect(parentElement.children[1] === outerA).toBeTruthy()

    // Inner items should still be the same objects
    expect(outerB.children[0] === innerB3).toBeTruthy()
    expect(outerA.children[0] === innerA1).toBeTruthy()

    // Update subItems of B
    const newItemB = {
      ...itemB,
      subItems: [
        { id: '4', val: 'B4' },
        { id: '3', val: 'B3' },
      ],
    }
    dataSignal.update((data) => ({
      ...data,
      Variables: {
        ...data.Variables,
        items: [newItemB, itemA],
      },
    }))

    // Outer B should still be same reference?
    // Wait, createNode reuses by key. newItemB has same ID 'B'.
    expect(parentElement.children[0] === outerB).toBeTruthy()

    // Inner sequence of B should have changed, but inner elements preserved
    expect(outerB.children[0].textContent).toBe('B4')
    expect(outerB.children[1].textContent).toBe('B3')
    expect(outerB.children[1] === innerB3).toBeTruthy()
  })

  test('repeat nodes should handle prepending items efficiently', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)

    const item2 = { id: '2' }
    const item3 = { id: '3' }

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: { items: [item2, item3] },
    })

    const ctx = {
      isRootComponent: false,
      component: {
        name: 'My Component',
        nodes: {
          repeat: {
            type: 'element',
            tag: 'div',
            repeat: { type: 'path', path: ['Variables', 'items'] },
            repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
            children: ['text'],
            attrs: {},
            events: {},
          },
          text: {
            type: 'text',
            value: { type: 'path', path: ['ListItem', 'Item', 'id'] },
          },
        },
      },
      root: document,
      env: { runtime: 'page' },
      formulaCache: {},
      toddle: { getCustomFormula: () => undefined },
    } as any as ComponentContext

    const nodes = createNode({
      ctx,
      namespace: 'http://www.w3.org/1999/xhtml',
      dataSignal,
      path: 'prepend',
      id: 'repeat',
      parentElement,
      instance: {},
    })
    parentElement.append(...nodes)

    const el2 = parentElement.children[0]
    const el3 = parentElement.children[1]

    // Prepend item 1
    const item1 = { id: '1' }
    dataSignal.update((data) => ({
      ...data,
      Variables: { ...data.Variables, items: [item1, item2, item3] },
    }))

    expect(parentElement.children.length).toBe(3)
    expect(parentElement.children[0].textContent).toBe('1')
    expect(parentElement.children[1] === el2).toBeTruthy()
    expect(parentElement.children[2] === el3).toBeTruthy()
  })

  test('repeat nodes with duplicate keys should still render all items but without reuse optimizations', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)

    const item1 = { id: 'i1', name: 'Item 1' }
    const item2 = { id: 'i2', name: 'Item 2' }
    const item3 = { id: 'i3', name: 'Item 3' }

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {
        items: [],
      },
    })

    const ctx = {
      isRootComponent: false,
      component: {
        name: 'My Component',
        nodes: {
          repeat: {
            type: 'element',
            tag: 'div',
            repeat: { type: 'path', path: ['Variables', 'items'] },
            repeatKey: { type: 'path', path: ['ListItem', 'Item', 'id'] },
            children: ['text'],
            attrs: {},
            events: {},
          },
          text: {
            type: 'text',
            value: { type: 'path', path: ['ListItem', 'Item', 'name'] },
          },
        },
      },
      root: document,
      env: { runtime: 'page' },
      formulaCache: {},
      toddle: { getCustomFormula: () => undefined },
    } as any as ComponentContext

    const nodes = createNode({
      ctx,
      namespace: 'http://www.w3.org/1999/xhtml',
      dataSignal,
      id: 'repeat',
      path: '0',
      instance: {},
      parentElement,
    })
    parentElement.append(...nodes)

    // Update with duplicate keys
    dataSignal.update((data) => ({
      ...data,
      Variables: { ...data.Variables, items: [item1] },
    }))

    expect(parentElement.children.length).toBe(1)
    expect(parentElement.children[0].textContent).toBe('Item 1')

    // Update with all items, including duplicate key
    dataSignal.update((data) => ({
      ...data,
      Variables: { ...data.Variables, items: [item1, item2] },
    }))

    dataSignal.update((data) => ({
      ...data,
      Variables: { ...data.Variables, items: [item1, item2, item3] },
    }))

    expect(parentElement.children.length).toBe(3)
    expect(parentElement.children[0].textContent).toBe('Item 1')
    expect(parentElement.children[1].textContent).toBe('Item 2')
    expect(parentElement.children[2].textContent).toBe('Item 3')

    expect(parentElement.children[0].getAttribute('data-id')).toBe('0')
    expect(parentElement.children[1].getAttribute('data-id')).toBe('0(1)')
    expect(parentElement.children[2].getAttribute('data-id')).toBe('0(2)')
  })
})
