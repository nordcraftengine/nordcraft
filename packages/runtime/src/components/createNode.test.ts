/* eslint-disable no-console */
import type { ComponentData } from '@nordcraft/core/dist/component/component.types'
import type { ToddleEnv } from '@nordcraft/core/dist/formula/formula'
import { describe, expect, test } from 'bun:test'
import '../happydom'
import { signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { customPropertiesStylesheets } from '../utils/subscribeCustomProperty'
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
      `"<div data-node-id="test-node-id" data-id="test-node" data-component="My Component"><span data-node-id="test-node-id.0" data-id="test-node.0" data-component="My Component" data-node-type="text">Item 1</span><span data-node-id="test-node-id.1" data-id="test-node.1" data-component="My Component" data-node-type="text">Item 2</span></div>"`,
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
      formulaCache: {},
      env: { runtime: 'page' } as ToddleEnv,
    } as Partial<ComponentContext> as ComponentContext

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
    const sheet = customPropertiesStylesheets.get(document)?.getStyleSheet()
    expect(sheet).toBeTruthy()
    expect(sheet?.cssRules.length).toBe(3)
    expect(sheet?.cssRules[0].cssText).toBe('.pGfTH { --color: red; }')

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
    expect(sheet?.cssRules[0].cssText).toBe('.pGfTH { --color: red; }')
    expect(sheet?.cssRules[1].cssText).toBe('.YomHY { --color: red; }')

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

    // Custom properties stylesheet should be cleaned up after all nodes are removed
    dataSignal.destroy()
    expect(sheet?.cssRules.length).toBe(0)
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

  test('it should have correct order of custom properties overrides if a component root has deep instance styling', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)

    const outermostColor = 'red'
    const middleColor = 'blue'
    const innermostColor = 'green'

    const ctx: ComponentContext = {
      isRootComponent: false,
      component: {
        name: 'My_Component',
        nodes: {
          root: {
            type: 'component',
            attrs: {},
            events: {},
            children: [],
            name: 'first_wrapper',
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
        },
      },
      root: document,
      formulaCache: {},
      env: { runtime: 'preview' } as ToddleEnv,
      stores: {
        theme: signal(null),
      },
      components: [
        {
          name: 'first_wrapper',
          nodes: {
            root: {
              type: 'component',
              attrs: {},
              events: {},
              children: [],
              name: 'second_wrapper',
              customProperties: {
                '--color': {
                  syntax: {
                    type: 'primitive',
                    name: 'color',
                  },
                  formula: {
                    type: 'value',
                    value: 'blue',
                  },
                },
              },
            },
          },
        },
        {
          name: 'second_wrapper',
          nodes: {
            root: {
              type: 'element',
              tag: 'div',
              children: ['text-node'],
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
                    value: 'green',
                  },
                },
              },
            },
            'text-node': {
              type: 'text',
              value: { type: 'value', value: 'Hello' },
            },
          },
        },
      ],
    } as Partial<ComponentContext> as ComponentContext

    createNode({
      ctx,
      namespace: 'http://www.w3.org/1999/xhtml',
      dataSignal: signal<ComponentData>({
        Attributes: {},
        Variables: {},
      }),
      path: '0',
      id: 'root',
      parentElement,
      instance: {},
    })

    const sheet = customPropertiesStylesheets.get(ctx.root)?.getStyleSheet()
    // Test that the order makes sense
    expect(Array.from(sheet?.cssRules ?? []).map((r) => r.cssText)).toEqual([
      `.bnID { --color: ${innermostColor}; }`,
      `.bnID.first_wrapper\\:root { --color: ${middleColor}; }`,
      `.bnID.My_Component\\:root { --color: ${outermostColor}; }`,
    ])
  })

  test('it should add repeat index even if a new item is added at the beginning of a list, if that list have other items with repeat index', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {
        items: [{ id: '1' }, { id: '2' }],
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
      id: 'repeat',
      instance: {},
      parentElement,
      path: '0',
    })
    parentElement.append(...nodes)

    expect(parentElement.children[0].getAttribute('data-id')).toBe('0')
    expect(parentElement.children[1].getAttribute('data-id')).toBe('0(1)')

    // Prepend new item
    dataSignal.update((data) => ({
      ...data,
      Variables: {
        ...data.Variables,
        items: [{ id: '3' }, { id: '1' }, { id: '2' }],
      },
    }))

    // First check that we have no duplicate data-ids
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

    expect(parentElement.children[0].getAttribute('data-id')).toBe('0(2)')
    expect(parentElement.children[1].getAttribute('data-id')).toBe('0')
    expect(parentElement.children[2].getAttribute('data-id')).toBe('0(1)')
  })

  test('it should give slots unique ids even if they are repeated multiple times in the same component', () => {
    // In this test, we have a div with a single default slot, but the div is repeated with a range node 3 times. We want to ensure that the slot gets a unique path
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {
        items: [1, 2, 3],
      },
    })

    const ctx = {
      isRootComponent: false,
      component: {
        name: 'My Component',
        nodes: {
          'repeat-node': {
            type: 'element',
            tag: 'div',
            repeat: { type: 'path', path: ['Variables', 'items'] },
            children: ['child-comp-1', 'child-comp-2'],
            attrs: {},
            events: {},
          },
          'child-comp-1': {
            type: 'component',
            name: 'Child',
            children: ['slotted-span-1', 'slotted-span-2'],
            attrs: {},
            events: {},
          },
          'child-comp-2': {
            type: 'component',
            name: 'Child',
            children: ['slotted-span-1', 'slotted-span-2'],
            attrs: {},
            events: {},
          },
          'slotted-span-1': {
            type: 'element',
            tag: 'span',
            attrs: { class: { type: 'value', value: 'span-1' } },
            events: {},
            children: [],
          },
          'slotted-span-2': {
            type: 'element',
            tag: 'span',
            attrs: { class: { type: 'value', value: 'span-2' } },
            events: {},
            children: [],
          },
        },
      },
      root: document,
      stores: {
        theme: signal('light'),
      },
      env: { runtime: 'page' },
      formulaCache: {},
      toddle: { getCustomFormula: () => undefined },
      children: {},
      providers: {},
      components: [
        {
          name: 'Child',
          nodes: {
            root: {
              type: 'element',
              tag: 'div',
              children: ['repeated-slot-1', 'repeated-slot-2'],
              attrs: {},
              events: {},
            },
            'repeated-slot-1': {
              type: 'slot',
              name: 'default',
              repeat: { type: 'path', path: ['Variables', 'items'] },
              children: [],
              attrs: {},
              events: {},
            },
            'repeated-slot-2': {
              type: 'slot',
              name: 'default',
              repeat: { type: 'path', path: ['Variables', 'items'] },
              children: [],
              attrs: {},
              events: {},
            },
          },
          variables: {
            items: { initialValue: { type: 'value', value: [1, 2, 3] } },
          },
        },
      ],
    } as any as ComponentContext

    const nodes = createNode({
      ctx,
      namespace: 'http://www.w3.org/1999/xhtml',
      dataSignal,
      path: '0',
      id: 'repeat-node',
      parentElement,
      instance: {},
    })
    parentElement.append(...nodes)

    // Elements should have unique data-ids
    const dataIds = new Set<string>()
    const elements = parentElement.querySelectorAll('span')
    for (const el of elements) {
      const dataId = el.getAttribute('data-id')
      expect(dataId).toBeTruthy()
      expect(
        dataIds.has(dataId!),
        `Duplicate data-id found: ${dataId}, all ids: ${Array.from(dataIds).join(', ')}`,
      ).toBeFalsy()
      dataIds.add(dataId!)
    }
  })

  test('it should give slots unique ids even when slots do not have an explicit name="default"', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })

    const ctx = {
      isRootComponent: false,
      component: {
        name: 'My Component',
        nodes: {
          root: {
            type: 'component',
            name: 'ChildWithTwoSlots',
            children: ['slotted-span'],
            attrs: {},
            events: {},
          },
          'slotted-span': {
            type: 'element',
            tag: 'span',
            attrs: {},
            events: {},
            children: [],
          },
        },
      },
      root: document,
      stores: {
        theme: signal('light'),
      },
      env: { runtime: 'preview' },
      formulaCache: {},
      toddle: { getCustomFormula: () => undefined },
      children: {},
      providers: {},
      components: [
        {
          name: 'ChildWithTwoSlots',
          nodes: {
            root: {
              type: 'element',
              tag: 'div',
              children: ['slot-1', 'slot-2'],
              attrs: {},
              events: {},
            },
            'slot-1': {
              type: 'slot',
              children: [],
              attrs: {},
              events: {},
            },
            'slot-2': {
              type: 'slot',
              children: [],
              attrs: {},
              events: {},
            },
          },
          variables: {},
        },
      ],
    } as any as ComponentContext

    const nodes = createNode({
      ctx,
      namespace: 'http://www.w3.org/1999/xhtml',
      dataSignal,
      path: '0',
      id: 'root',
      parentElement,
      instance: {},
    })
    parentElement.append(...nodes)

    const dataIds = new Set<string>()
    const elements = parentElement.querySelectorAll('span')
    expect(elements.length).toBe(2)
    for (const el of elements) {
      const dataId = el.getAttribute('data-id')
      expect(dataId).toBeTruthy()
      expect(
        dataIds.has(dataId!),
        `Duplicate data-id found: ${dataId}, all ids: ${Array.from(dataIds).join(', ')}`,
      ).toBeFalsy()
      dataIds.add(dataId!)
    }
  })

  test('it should give unique ids when forwarding a slot through another component with multiple slots', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
    })

    const ctx = {
      isRootComponent: false,
      component: {
        name: 'My Component',
        nodes: {
          root: {
            type: 'component',
            name: 'WrapperComp',
            children: ['slotted-span'],
            attrs: {},
            events: {},
          },
          'slotted-span': {
            type: 'element',
            tag: 'span',
            attrs: {},
            events: {},
            children: [],
          },
        },
      },
      root: document,
      stores: {
        theme: signal('light'),
      },
      env: { runtime: 'preview' },
      formulaCache: {},
      toddle: { getCustomFormula: () => undefined },
      children: {},
      providers: {},
      components: [
        {
          name: 'WrapperComp',
          nodes: {
            root: {
              type: 'component',
              name: 'LayoutWithTwoSlots',
              children: ['forwarded-slot'],
              attrs: {},
              events: {},
            },
            'forwarded-slot': {
              type: 'slot',
              name: 'default',
              children: [],
              attrs: {},
              events: {},
            },
          },
          variables: {},
        },
        {
          name: 'LayoutWithTwoSlots',
          nodes: {
            root: {
              type: 'element',
              tag: 'div',
              children: ['slot-1', 'slot-2'],
              attrs: {},
              events: {},
            },
            'slot-1': {
              type: 'slot',
              name: 'default',
              children: [],
              attrs: {},
              events: {},
            },
            'slot-2': {
              type: 'slot',
              name: 'default',
              children: [],
              attrs: {},
              events: {},
            },
          },
          variables: {},
        },
      ],
    } as any as ComponentContext

    const nodes = createNode({
      ctx,
      namespace: 'http://www.w3.org/1999/xhtml',
      dataSignal,
      path: '0',
      id: 'root',
      parentElement,
      instance: {},
    })
    parentElement.append(...nodes)

    const dataIds = new Set<string>()
    const elements = parentElement.querySelectorAll('span')
    expect(elements.length).toBe(2)
    for (const el of elements) {
      const dataId = el.getAttribute('data-id')
      expect(dataId).toBeTruthy()
      expect(
        dataIds.has(dataId!),
        `Duplicate data-id found: ${dataId}, all ids: ${Array.from(dataIds).join(', ')}`,
      ).toBeFalsy()
      dataIds.add(dataId!)
    }
  })

  test('conditional nodes inside slots in slots do not trigger duplicate element warning or missing parent error on toggle', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {
        show: true,
      },
    })

    const warnLogs: string[] = []
    const errorLogs: string[] = []
    const origWarn = console.warn
    const origError = console.error
    console.warn = (...args: any[]) => {
      warnLogs.push(args.join(' '))
      origWarn(...args)
    }
    console.error = (...args: any[]) => {
      errorLogs.push(args.join(' '))
      origError(...args)
    }

    try {
      const ctx = {
        isRootComponent: false,
        component: {
          name: 'My Component',
          nodes: {
            root: {
              type: 'component',
              name: 'WrapperWithSlot',
              children: ['conditional-div'],
              attrs: {},
              events: {},
            },
            'conditional-div': {
              type: 'element',
              tag: 'div',
              condition: { type: 'path', path: ['Variables', 'show'] },
              children: ['nested-conditional-span'],
              attrs: {},
              events: {},
            },
            'nested-conditional-span': {
              type: 'element',
              tag: 'span',
              condition: { type: 'path', path: ['Variables', 'show'] },
              children: [],
              attrs: {},
              events: {},
            },
          },
        },
        root: document,
        stores: {
          theme: signal('light'),
        },
        env: { runtime: 'preview' },
        formulaCache: {},
        toddle: { getCustomFormula: () => undefined },
        children: {},
        providers: {},
        components: [
          {
            name: 'WrapperWithSlot',
            nodes: {
              root: {
                type: 'component',
                name: 'LayoutWithTwoDefaultSlots',
                children: ['forwarded-slot'],
                attrs: {},
                events: {},
              },
              'forwarded-slot': {
                type: 'slot',
                children: [],
                attrs: {},
                events: {},
              },
            },
            variables: {},
          },
          {
            name: 'LayoutWithTwoDefaultSlots',
            nodes: {
              root: {
                type: 'element',
                tag: 'div',
                children: ['slot-a', 'slot-b'],
                attrs: {},
                events: {},
              },
              'slot-a': {
                type: 'slot',
                children: [],
                attrs: {},
                events: {},
              },
              'slot-b': {
                type: 'slot',
                children: [],
                attrs: {},
                events: {},
              },
            },
            variables: {},
          },
        ],
      } as any as ComponentContext

      const nodes = createNode({
        ctx,
        namespace: 'http://www.w3.org/1999/xhtml',
        dataSignal,
        path: '0',
        id: 'root',
        parentElement,
        instance: {},
      })
      parentElement.append(...nodes)

      // Both slots render the conditional div
      const divs = parentElement.querySelectorAll(
        '[data-node-id="conditional-div"]',
      )
      expect(divs.length).toBe(2)
      expect(divs[0].getAttribute('data-id')).not.toBe(
        divs[1].getAttribute('data-id'),
      )

      // Toggle condition to false and back to true
      dataSignal.update((data) => ({
        ...data,
        Variables: { show: false },
      }))

      dataSignal.update((data) => ({
        ...data,
        Variables: { show: true },
      }))

      // Should not log "already exists" warning or "Parent element does not exist" error
      const alreadyExistsWarnings = warnLogs.filter((log) =>
        log.includes('already exists'),
      )
      const parentNotExistErrors = errorLogs.filter((log) =>
        log.includes('Parent element does not exist'),
      )

      expect(alreadyExistsWarnings).toHaveLength(0)
      expect(parentNotExistErrors).toHaveLength(0)
    } finally {
      console.warn = origWarn
      console.error = origError
    }
  })

  test('reproduce user warning with fragment root slots and nested providers', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {
        searchValue: null,
      },
    })

    const warnLogs: string[] = []
    const errorLogs: string[] = []
    const origWarn = console.warn
    const origError = console.error
    console.warn = (...args: any[]) => {
      warnLogs.push(args.join(' '))
      origWarn(...args)
    }
    console.error = (...args: any[]) => {
      errorLogs.push(args.join(' '))
      origError(...args)
    }

    try {
      // Structure 1: quick-actions-popover
      // "root": slot "FRAGMENT", children: ["slot-child", "quick-actions-comp"]
      const quickActionsPopover = {
        name: 'quick-actions-popover',
        nodes: {
          root: {
            name: 'FRAGMENT',
            type: 'slot',
            children: ['slot-child', 'quick-actions-comp'],
          },
          'slot-child': {
            type: 'slot',
            children: [],
          },
          'quick-actions-comp': {
            name: 'quick-actions',
            type: 'component',
            children: [],
            condition: {
              type: 'function',
              name: '@toddle/notEqual',
              arguments: [
                {
                  name: 'First',
                  formula: { type: 'path', path: ['Attributes', 'search'] },
                },
                {
                  name: 'Second',
                  formula: { type: 'value', value: null },
                },
              ],
            },
          },
        },
        variables: {},
      }

      // Structure 2: branch-actions-provider
      // "root": slot "FRAGMENT", children: ["cArm5e3nCxl8IGIyNZUbM", "I2IfLdvxy24aPIzeTRPm1"]
      const branchActionsProvider = {
        name: 'branch-actions-provider',
        nodes: {
          root: {
            name: 'FRAGMENT',
            type: 'slot',
            children: ['slot-child-2', 'delete-branch-dialog'],
          },
          'slot-child-2': {
            type: 'slot',
            children: [],
          },
          'delete-branch-dialog': {
            name: 'delete-branch-dialog',
            type: 'component',
            children: [],
            attrs: {},
            events: {},
          },
        },
        variables: {},
      }

      // Structure 3: file-search-provider
      const fileSearchProvider = {
        name: 'file-search-provider',
        nodes: {
          root: {
            name: 'file-actions-provider',
            type: 'component',
            attrs: {
              search: {
                type: 'path',
                path: ['Attributes', 'search'],
              },
            },
            children: ['inner-branch-actions'],
          },
          'inner-branch-actions': {
            name: 'branch-actions-provider',
            type: 'component',
            attrs: {
              search: {
                type: 'path',
                path: ['Attributes', 'search'],
              },
            },
            children: ['inner-quick-actions-popover'],
          },
          'inner-quick-actions-popover': {
            name: 'quick-actions-popover',
            type: 'component',
            attrs: {
              search: {
                type: 'path',
                path: ['Variables', 'searchValue'],
              },
            },
            children: ['provider-slot'],
          },
          'provider-slot': {
            type: 'slot',
            children: [],
          },
        },
        variables: {},
      }

      const fileActionsProvider = {
        name: 'file-actions-provider',
        nodes: {
          root: {
            name: 'FRAGMENT',
            type: 'slot',
            children: ['fap-slot'],
          },
          'fap-slot': {
            type: 'slot',
            children: [],
          },
        },
        variables: {},
      }

      const deleteBranchDialog = {
        name: 'delete-branch-dialog',
        nodes: {
          root: {
            type: 'element',
            tag: 'dialog',
            children: [],
            attrs: {},
            events: {},
          },
        },
        variables: {},
      }

      const quickActions = {
        name: 'quick-actions',
        nodes: {
          root: {
            type: 'element',
            tag: 'div',
            children: ['qa-inner-conditional'],
            attrs: {},
            events: {},
          },
          'qa-inner-conditional': {
            type: 'element',
            tag: 'span',
            condition: { type: 'value', value: true },
            children: [],
            attrs: {},
            events: {},
          },
        },
        variables: {},
      }

      // Page wraps file-search-provider which wraps another file-search-provider
      const ctx = {
        isRootComponent: false,
        component: {
          name: 'My Component',
          nodes: {
            root: {
              type: 'component',
              name: 'file-search-provider',
              attrs: {
                search: {
                  type: 'path',
                  path: ['Variables', 'searchValue'],
                },
              },
              children: ['inner-provider'],
            },
            'inner-provider': {
              type: 'component',
              name: 'file-search-provider',
              attrs: {
                search: {
                  type: 'path',
                  path: ['Variables', 'searchValue'],
                },
              },
              children: ['page-content'],
            },
            'page-content': {
              type: 'element',
              tag: 'main',
              children: [],
              attrs: {},
              events: {},
            },
          },
        },
        root: document,
        stores: {
          theme: signal('light'),
        },
        env: { runtime: 'preview' },
        formulaCache: {},
        toddle: {
          isEqual: (a: any, b: any) => a === b,
          getCustomFormula: () => undefined,
          getFormula: (name: string) => {
            if (name === '@toddle/notEqual') {
              return ([a, b]: [any, any]) => a !== b
            }
            return undefined
          },
          _preview: {
            showSignal: signal({ displayedNodes: [], testMode: false }),
          },
        },
        children: {},
        providers: {},
        components: [
          fileSearchProvider,
          fileActionsProvider,
          branchActionsProvider,
          quickActionsPopover,
          deleteBranchDialog,
          quickActions,
        ],
      } as any as ComponentContext

      const nodes = createNode({
        ctx,
        namespace: 'http://www.w3.org/1999/xhtml',
        dataSignal,
        path: '0',
        id: 'root',
        parentElement,
        instance: {},
      })
      parentElement.append(...nodes)

      // Now toggle search value to trigger quick-actions condition
      dataSignal.update((data) => ({
        ...data,
        Variables: { searchValue: 'test' },
      }))

      dataSignal.update((data) => ({
        ...data,
        Variables: { searchValue: null },
      }))

      dataSignal.update((data) => ({
        ...data,
        Variables: { searchValue: 'test' },
      }))

      const seenIds = new Set<string>()
      for (const el of parentElement.querySelectorAll('[data-id]')) {
        const id = el.getAttribute('data-id')!
        expect(
          seenIds.has(id),
          `Duplicate data-id found: ${id}, all ids: ${Array.from(seenIds).join(', ')}`,
        ).toBeFalsy()
        seenIds.add(id)
      }

      const alreadyExistsWarnings = warnLogs.filter((log) =>
        log.includes('already exists'),
      )
      const parentNotExistErrors = errorLogs.filter((log) =>
        log.includes('Parent element does not exist'),
      )

      expect(alreadyExistsWarnings).toHaveLength(0)
      expect(parentNotExistErrors).toHaveLength(0)
    } finally {
      console.warn = origWarn
      console.error = origError
    }
  })

  test('unmounting a conditional node removes its elements from the DOM and does not leave stale elements', () => {
    const parentElement = document.createElement('div')
    document.body.appendChild(parentElement)

    const dataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: { show: true },
    })

    const ctx = {
      isRootComponent: false,
      component: {
        name: 'TestComp',
        nodes: {
          root: {
            type: 'element',
            tag: 'div',
            condition: { type: 'path', path: ['Variables', 'show'] },
            children: [],
            attrs: {},
            events: {},
          },
        },
      },
      root: document,
      stores: { theme: signal('light') },
      env: { runtime: 'page' },
      formulaCache: {},
      toddle: { getCustomFormula: () => undefined },
      children: {},
      providers: {},
      components: [],
    } as any as ComponentContext

    const nodes = createNode({
      ctx,
      namespace: 'http://www.w3.org/1999/xhtml',
      dataSignal,
      path: '0',
      id: 'root',
      parentElement,
      instance: {},
    })
    parentElement.append(...nodes)

    expect(parentElement.querySelector('[data-id="0"]')).toBeTruthy()

    // Destroy the dataSignal (e.g. unmounting component/slot)
    dataSignal.destroy()

    // Elements should be removed from parentElement on destroy
    expect(parentElement.querySelector('[data-id="0"]')).toBeNull()
  })
})
