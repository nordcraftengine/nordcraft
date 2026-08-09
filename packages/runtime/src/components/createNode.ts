/* eslint-disable no-console */
import type {
  ComponentData,
  ElementNodeModel,
  NodeModel,
  SlotNodeModel,
  SupportedNamespaces,
  TextNodeModel,
} from '@nordcraft/core/dist/component/component.types'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { pathToString } from '@nordcraft/core/dist/utils/path'
import { toBoolean } from '@nordcraft/core/dist/utils/util'
import type { Signal } from '../signal/signal'
import { signal } from '../signal/signal'
import type { ComponentContext, Path } from '../types'
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
  slotRepeatIndex,
}: {
  id: string
  dataSignal: Signal<ComponentData>
  path: Path
  ctx: ComponentContext
  namespace?: SupportedNamespaces
  parentElement: Element | ShadowRoot
  instance: Record<string, string>
  slotRepeatIndex?: number
}): ReadonlyArray<Element | Text> {
  const node = ctx.component.nodes?.[id]
  if (!node) {
    return []
  }
  const create = (
    props: NodeRenderer<NodeModel>,
  ): ReadonlyArray<Element | Text> => {
    switch (props.node.type) {
      case 'element':
        return [createElement(props as NodeRenderer<ElementNodeModel>)]
      case 'component': {
        const isLocalComponent =
          getComponent(
            props.node.name,
            ctx.components,
            ctx.env.runtime !== 'preview',
          ) !== undefined
        return createComponent({
          ...props,
          node: { ...props.node, id }, // we need the node id for instance classes
          ctx: {
            ...ctx,
            package:
              props.node.package ??
              (isLocalComponent ? undefined : ctx.package),
            // Skip sub-component formula evaluation for now as editor only needs the scope for the selected component
            // TODO: Letting the AI get the state of a deep component may be useful in the future, but we need a better way at precising scope for it to not overwhelm it.
            reportFormulaEvaluation: undefined,
          },
          parentElement,
        })
      }
      case 'text':
        return [createText(props as NodeRenderer<TextNodeModel>)]
      case 'slot':
        return createSlot(props as NodeRenderer<SlotNodeModel>)
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
    const showSignal = dataSignal.map((data) => {
      const conditionPath = ['nodes', id, 'condition']
      const show = toBoolean(
        applyFormula(
          node.condition,
          {
            data,
            component: ctx.component,
            formulaCache: ctx.formulaCache,
            root: ctx.root,
            package: ctx.package,
            toddle: ctx.toddle,
            env: ctx.env,
            jsonPath: ctx.jsonPath,
            reportFormulaEvaluation: ctx.reportFormulaEvaluation,
          },
          conditionPath,
        ),
      )

      return show
    })

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
            slotRepeatIndex,
          }),
        )

        // No reason to continue if we are on first run, as the render phase has not yet been reached
        if (firstRun) {
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
          if (displayedNodes.includes(pathToString(path)) && !testMode) {
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
    // Only one default element is allowed, but if it is removed, we allow a new to be assigned. The default element is mostly used for the editor.
    let defaultElement: string | number | null = null
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
      const listPath = ['nodes', id, 'repeat']
      const list = applyFormula(
        node?.repeat,
        {
          data,
          component: ctx.component,
          formulaCache: ctx.formulaCache,
          root: ctx.root,
          package: ctx.package,
          toddle: ctx.toddle,
          env: ctx.env,
        },
        listPath,
      )

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
          const repeatKeyPath = ['nodes', id, 'repeatKey']
          let childKey = node?.repeatKey
            ? applyFormula(
                node.repeatKey,
                {
                  data: childData,
                  component: ctx.component,
                  formulaCache: ctx.formulaCache,
                  root: ctx.root,
                  package: ctx.package,
                  toddle: ctx.toddle,
                  env: ctx.env,
                },
                repeatKeyPath,
              )
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
            if (defaultElement === key) {
              defaultElement = null
            }
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

            const repeatIndex =
              Key === '0' && !defaultElement ? undefined : ++lifetimeSize

            let itemPath = path
            if (repeatIndex) {
              itemPath = [...path]
              itemPath[itemPath.length - 1] = {
                ...itemPath[itemPath.length - 1],
                repeatIndex,
              }
            }

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
              path: itemPath,
              ctx,
              namespace,
              parentElement,
              instance,
              slotRepeatIndex: repeatIndex,
            }
            if (Key === '0' && !defaultElement) {
              defaultElement = childKey
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
            `Repeat: Parent element does not exist for ${pathToString(
              path,
            )}. This is likely due to the DOM being modified outside of Nordcraft.`,
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
      slotRepeatIndex,
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
    slotRepeatIndex,
  })
}

export type NodeRenderer<NodeType> = {
  node: NodeType
  dataSignal: Signal<ComponentData>
  id: string
  path: Path
  ctx: ComponentContext
  namespace?: SupportedNamespaces
  parentElement: Element | ShadowRoot
  instance: Record<string, string>
  /**
   * Slots can be located inside repeated nodes, so we need to forward their last repeat index to ensure unique paths for their children.
   * Note that the repeat index is reset at slot and component boundaries
   */
  slotRepeatIndex?: number
}
