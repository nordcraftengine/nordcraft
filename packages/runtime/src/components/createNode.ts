/* eslint-disable no-console */
import type {
  ComponentData,
  NodeModel,
  SupportedNamespaces,
} from '@nordcraft/core/dist/component/component.types'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { toBoolean } from '@nordcraft/core/dist/utils/util'
import type { Signal } from '../signal/signal'
import { signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { getComponent } from '../utils/getComponent'
import { ensureEfficientOrdering, getNextSiblingElement } from '../utils/nodes'
import { createComponent } from './createComponent'
import { createElement } from './createElement'
import { createSlot } from './createSlot'
import { createText } from './createText'

export function createNode({
  id,
  dataSignal,
  path,
  ctx,
  namespace,
  parentElement,
  instance,
}: {
  id: string
  dataSignal: Signal<ComponentData>
  path: string
  ctx: ComponentContext
  namespace?: SupportedNamespaces
  parentElement: Element | ShadowRoot
  instance: Record<string, string>
}): ReadonlyArray<Element | Text> {
  const node = ctx.component.nodes?.[id]
  if (!node) {
    return []
  }
  const create = ({
    node,
    ...props
  }: NodeRenderer<NodeModel>): ReadonlyArray<Element | Text> => {
    switch (node.type) {
      case 'element':
        return [
          createElement({
            node,
            ...props,
          }),
        ]
      case 'component': {
        const isLocalComponent =
          getComponent(node.name, ctx.components) !== undefined
        return createComponent({
          node: { ...node, id }, // we need the node id for instance classes
          ...props,
          ctx: {
            ...ctx,
            package:
              node.package ?? (isLocalComponent ? undefined : ctx.package),
          },
          parentElement,
        })
      }
      case 'text':
        return [createText({ ...props, node })]
      case 'slot':
        return createSlot({ ...props, node })
    }
  }

  function conditional({
    node,
    dataSignal,
    id,
    path,
    ctx,
    namespace,
    parentElement,
    instance,
  }: NodeRenderer<NodeModel>): ReadonlyArray<Element | Text> {
    let firstRun = true
    let childDataSignal: Signal<ComponentData> | null = null
    const showSignal = dataSignal.map((data) =>
      toBoolean(
        applyFormula(node.condition, {
          data,
          component: ctx.component,
          formulaCache: ctx.formulaCache,
          root: ctx.root,
          package: ctx.package,
          toddle: ctx.toddle,
          env: ctx.env,
        }),
      ),
    )

    const elements: Array<Element | Text> = []
    const toggle = (show: boolean) => {
      if (show && elements.length === 0) {
        childDataSignal?.destroy()
        childDataSignal = dataSignal.map((data) => data)
        elements.push(
          ...create({
            node,
            dataSignal: childDataSignal,
            path,
            id,
            ctx,
            namespace,
            parentElement,
            instance,
          }),
        )

        // No reason to continue if we are on first run, as the render phase has not yet been reached
        if (firstRun) {
          return
        }

        if (!parentElement || ctx.root.contains(parentElement) === false) {
          console.error(
            `Conditional: Parent element does not exist for "${path}" This is likely due to the DOM being modified outside of Nordcraft.`,
          )
          return
        }

        if (parentElement.querySelector(`[data-id="${path}"]`)) {
          console.warn(
            `Conditional: Element with data-id="${path}" already exists. This is likely due to the DOM being modified outside of Nordcraft`,
          )
          return
        }

        const nextPathElement = getNextSiblingElement(path, parentElement)
        for (const element of elements) {
          parentElement.insertBefore(element, nextPathElement)
        }
      } else if (!show) {
        childDataSignal?.destroy()
        elements.forEach((elem) => elem.remove())
        elements.splice(0, elements.length)
      }
    }

    showSignal.subscribe(toggle, {
      destroy: () => {
        childDataSignal?.destroy()
      },
    })
    if (ctx.env.runtime === 'preview' && ctx.toddle._preview) {
      ctx.toddle._preview.showSignal.subscribe(
        ({ displayedNodes, testMode }) => {
          if (displayedNodes.includes(path) && !testMode) {
            // only override the default show if we are in design mode (not test mode)
            toggle(true)
          } else {
            toggle(showSignal.get())
          }
        },
      )
    }

    firstRun = false
    return elements
  }

  function repeat(): ReadonlyArray<Element | Text> {
    let firstRun = true
    let lifetimeSize = 0
    let repeatItems = new Map<
      string | number,
      {
        dataSignal: Signal<ComponentData>
        cleanup: () => void
        elements: ReadonlyArray<Element | Text>
      }
    >()
    const repeatSignal = dataSignal.map((data) => {
      const list = applyFormula(node?.repeat, {
        data,
        component: ctx.component,
        formulaCache: ctx.formulaCache,
        root: ctx.root,
        package: ctx.package,
        toddle: ctx.toddle,
        env: ctx.env,
      })
      if (typeof list !== 'object') {
        return []
      }
      return Object.entries(list ?? {})
    })

    repeatSignal.subscribe(
      (list) => {
        const data = dataSignal.get()
        const parentListItem = data.ListItem
        const parentListItemInfo = parentListItem
          ? { Parent: parentListItem }
          : {}
        // Pre-calculate all keys and data for the new list
        const seenKeys = new Set<string | number>()
        const itemsToRender = list.map(([Key, Item], i) => {
          const childData = {
            ...data,
            ListItem: {
              ...parentListItemInfo,
              Item,
              Index: Number(i),
              Key,
            },
          }
          let childKey = node?.repeatKey
            ? applyFormula(node.repeatKey, {
                data: childData,
                component: ctx.component,
                formulaCache: ctx.formulaCache,
                root: ctx.root,
                package: ctx.package,
                toddle: ctx.toddle,
                env: ctx.env,
              })
            : Key

          if (seenKeys.has(childKey)) {
            console.warn(
              `Duplicate key "${childKey}" found in repeat. Fallback to index as key. This will cause a re-render of the duplicated children on every change.`,
            )
            childKey = Key
          }
          seenKeys.add(childKey)

          return { Key, Item, i, childData, childKey }
        })

        // Cleanup removed items' before rendering new items to ensure clean state
        repeatItems.forEach((item, key) => {
          if (!seenKeys.has(key)) {
            item.cleanup()
            item.dataSignal.destroy()
            item.elements.forEach((e) => e.remove())
          }
        })

        const newRepeatItems = new Map<
          string | number,
          {
            dataSignal: Signal<ComponentData>
            cleanup: () => void
            elements: ReadonlyArray<Element | Text>
          }
        >()

        for (const { Key, Item, i, childData, childKey } of itemsToRender) {
          const existingItem = repeatItems.get(childKey)
          if (existingItem) {
            newRepeatItems.set(childKey, existingItem)
            existingItem.dataSignal.update((data) => {
              return {
                ...data,
                ListItem: {
                  ...parentListItemInfo,
                  Item,
                  Index: Number(i),
                  Key,
                },
              }
            })
          } else {
            const childDataSignal = signal<ComponentData>(childData)
            const cleanup = dataSignal.subscribe(
              (data) => {
                if (firstRun) {
                  return
                }

                childDataSignal.update(({ ListItem }) => {
                  return {
                    ...data,
                    ListItem,
                  }
                })
              },
              {
                destroy: () => childDataSignal.destroy(),
              },
            )

            const args = {
              node: node!,
              id,
              dataSignal: childDataSignal,
              // Note that we use the lifetimeSize to ensure that no two items can ever get the same path.
              // Consider a list [A, B, C]:
              // - Update list to [B]
              // - Update list to [A, C, B]
              // Now C and B would have the same path `(1)` if we only used the index or Key, as B would have kept its reference, but the others would be recreated.
              // With lifetimeSize, the keys would be A(3), B(1), C(4) - all unique.
              path: Key === '0' ? path : `${path}(${++lifetimeSize})`,
              ctx,
              namespace,
              parentElement,
              instance,
            }
            const elements = node!.condition ? conditional(args) : create(args)
            newRepeatItems.set(childKey, {
              dataSignal: childDataSignal,
              cleanup,
              elements,
            })
          }
        }
        repeatItems = newRepeatItems

        // No reason to continue if we are on first run, as the render-phase for the parent
        // has not yet been reached, or if there are no items to render
        if (firstRun || repeatItems.size === 0) {
          return
        }

        if (!parentElement || ctx.root.contains(parentElement) === false) {
          console.error(
            `Repeat: Parent element does not exist for ${path}. This is likely due to the DOM being modified outside of Nordcraft.`,
          )
          return
        }

        ensureEfficientOrdering(
          parentElement,
          Array.from(repeatItems.values()).flatMap((e) => e.elements),
          getNextSiblingElement(path, parentElement),
        )
      },
      {
        destroy: () =>
          Array.from(repeatItems.values()).forEach((e) => {
            e.cleanup()
            e.dataSignal.destroy()
            e.elements.forEach((e) => e.remove())
          }),
      },
    )

    // We utilize that the signal subscription runs synchronously above,
    // so we already have a populated repeatItems map to return initially.
    // Note: `repeatItems.values()` is okay here, as maps' iterator is ordered by insertion.
    firstRun = false
    return Array.from(repeatItems.values()).flatMap((e) => e.elements)
  }

  if (node.repeat) {
    return repeat()
  }
  if (node.condition) {
    return conditional({
      node,
      dataSignal,
      ctx,
      id,
      path,
      namespace,
      parentElement,
      instance,
    })
  }
  return create({
    node,
    dataSignal,
    ctx,
    id,
    path,
    namespace,
    parentElement,
    instance,
  })
}
export type NodeRenderer<NodeType> = {
  node: NodeType
  dataSignal: Signal<ComponentData>
  id: string
  path: string
  ctx: ComponentContext
  namespace?: SupportedNamespaces
  parentElement: Element | ShadowRoot
  instance: Record<string, string>
}
