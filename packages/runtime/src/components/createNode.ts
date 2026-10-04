/* eslint-disable no-console */
import '@nordcraft/core/dist/compileTime'
import type {
  ComponentData,
  ElementNodeModel,
  NodeModel,
  SlotNodeModel,
  SupportedNamespaces,
  TextNodeModel,
} from '@nordcraft/core/dist/component/component.types'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { toBoolean } from '@nordcraft/core/dist/utils/util'
import type { Signal } from '../signal/signal'
import { signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { getComponent } from '../utils/getComponent'
import { isStaticFormula } from '../utils/isStaticFormula'
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
  slotSuffix,
}: {
  id: string
  dataSignal: Signal<ComponentData>
  path: string
  ctx: ComponentContext
  namespace?: SupportedNamespaces
  parentElement: Element | ShadowRoot
  instance: Record<string, string>
  slotRepeatIndex?: number
  slotSuffix?: string
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
          getComponent(props.node.name, ctx.components, !IS_PREVIEW) !==
          undefined
        const childPackage =
          props.node.package ?? (isLocalComponent ? undefined : ctx.package)
        const childCtx =
          childPackage === ctx.package &&
          (!IS_PREVIEW || !ctx.reportFormulaEvaluation)
            ? ctx
            : {
                ...ctx,
                package: childPackage,
                // Skip sub-component formula evaluation for now as editor only needs the scope for the selected component
                // TODO: Letting the AI get the state of a deep component may be useful in the future, but we need a better way at precising scope for it to not overwhelm it.
                ...(IS_PREVIEW && ctx.reportFormulaEvaluation
                  ? { reportFormulaEvaluation: undefined }
                  : {}),
              }
        return createComponent({
          ...props,
          node: props.node,
          nodeId: id,
          ctx: childCtx,
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
    slotRepeatIndex,
    slotSuffix,
  }: NodeRenderer<NodeModel>): ReadonlyArray<Element | Text> {
    if (isStaticFormula(node.condition)) {
      if (!toBoolean(node.condition.value)) {
        return []
      }
      return create({
        node,
        dataSignal,
        path,
        id,
        ctx,
        namespace,
        parentElement,
        instance,
        slotRepeatIndex,
        slotSuffix,
      })
    }
    let firstRun = true
    let childDataSignal: Signal<ComponentData> | null = null
    const conditionPath =
      IS_PREVIEW && ctx.reportFormulaEvaluation
        ? ['nodes', id, 'condition']
        : undefined
    const showSignal = dataSignal.map((data) => {
      const show = toBoolean(
        applyFormula(node.condition, ctx, data, conditionPath),
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
            slotSuffix,
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
        const fragment = document.createDocumentFragment()
        for (const element of elements) {
          fragment.appendChild(element)
        }
        parentElement.insertBefore(fragment, nextPathElement)
      } else if (!show) {
        childDataSignal?.destroy()
        elements.forEach((elem) => elem.remove())
        elements.splice(0, elements.length)
      }
    }

    let unsubscribePreview: (() => void) | undefined
    showSignal.subscribe(toggle, {
      destroy: () => {
        unsubscribePreview?.()
        childDataSignal?.destroy()
        elements.forEach((elem) => elem.remove())
        elements.splice(0, elements.length)
      },
    })
    if (IS_PREVIEW) {
      unsubscribePreview = ctx.toddle._preview?.showSignal.subscribe(
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
    const listPath =
      IS_PREVIEW && ctx.reportFormulaEvaluation
        ? ['nodes', id, 'repeat']
        : undefined
    const repeatKeyPath =
      IS_PREVIEW && ctx.reportFormulaEvaluation
        ? ['nodes', id, 'repeatKey']
        : undefined
    const evaluateRepeatEntries = (
      data: ComponentData,
    ): Array<[string, unknown]> => {
      const list = applyFormula(node?.repeat, ctx, data, listPath)

      if (typeof list !== 'object' || list === null) {
        return []
      }
      // Fast path for arrays (the common repeat case): avoid the
      // intermediate string-key conversion of `Object.entries(array)`.
      if (Array.isArray(list)) {
        const entries = new Array<[string, unknown]>(list.length)
        for (let i = 0; i < list.length; i++) {
          entries[i] = [String(i), list[i]]
        }
        return entries
      }
      return Object.entries(list)
    }

    let initialElements: ReadonlyArray<Element | Text> = []
    const destroyRepeatItems = () =>
      Array.from(repeatItems.values()).forEach((e) => {
        e.cleanup()
        e.dataSignal.destroy()
        e.elements.forEach((e) => e.remove())
      })
    const updateRepeatList = (list: Array<[string, unknown]>) => {
      const data = dataSignal.get()
      const parentListItem = data.ListItem
      const parentListItemInfo = parentListItem
        ? { Parent: parentListItem }
        : {}
      const repeatKeyFormula = node?.repeatKey
      const seenKeys = new Set<string | number>()
      const childKeys: Array<string | number> = new Array(list.length)
      const childDataCache: Array<ComponentData | undefined> = repeatKeyFormula
        ? new Array(list.length)
        : []
      for (let n = 0; n < list.length; n++) {
        const entry = list[n]!
        const Key = entry[0]
        let childKey: string | number
        if (repeatKeyFormula) {
          const Item = entry[1]
          const keyData = {
            ...data,
            ListItem: {
              ...(parentListItem ? { Parent: parentListItem } : {}),
              Item,
              Index: n,
              Key,
            },
          }
          childDataCache[n] = keyData
          childKey = applyFormula(repeatKeyFormula, ctx, keyData, repeatKeyPath)
        } else {
          childKey = Key
        }

        if (seenKeys.has(childKey)) {
          console.warn(
            `Duplicate key "${childKey}" found in repeat. Fallback to index as key. This will cause a re-render of the duplicated children on every change.`,
          )
          childKey = Key
        }
        seenKeys.add(childKey)
        childKeys[n] = childKey
      }

      // Cleanup removed items before rendering new items to ensure clean state
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
      const orderedElements: Array<Element | Text> = []
      for (let n = 0; n < list.length; n++) {
        const entry = list[n]!
        const Key = entry[0]
        const Item = entry[1]
        const childKey = childKeys[n]!
        const existingItem = repeatItems.get(childKey)
        if (existingItem) {
          newRepeatItems.set(childKey, existingItem)
          existingItem.dataSignal.update(
            (data) => ({
              ...data,
              ListItem: {
                ...parentListItemInfo,
                Item,
                Index: n,
                Key,
              },
            }),
            // We can skip deep equality check as we know the ListItem object is always a fresh object with potentially new Index/Item.
            { force: true },
          )
          const existingElements = existingItem.elements
          for (let k = 0; k < existingElements.length; k++) {
            orderedElements.push(existingElements[k]!)
          }
        } else {
          const cachedChildData = childDataCache[n]
          let newChildData: ComponentData
          if (cachedChildData) {
            newChildData = cachedChildData
          } else {
            const built = {
              ...data,
              ListItem: {
                ...parentListItemInfo,
                Item,
                Index: n,
                Key,
              },
            }
            newChildData = built
          }
          const childDataSignal = signal<ComponentData>(newChildData)
          const cleanup = dataSignal.subscribe(
            (data) => {
              if (firstRun) {
                return
              }

              childDataSignal.update(
                ({ ListItem }) => {
                  return {
                    ...data,
                    ListItem,
                  }
                },
                { force: true },
              )
            },
            {
              destroy: () => childDataSignal.destroy(),
            },
          )

          const repeatIndex =
            Key === '0' && !defaultElement ? undefined : ++lifetimeSize
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
            path: repeatIndex ? `${path}(${repeatIndex})` : path,
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
          for (let k = 0; k < elements.length; k++) {
            orderedElements.push(elements[k]!)
          }
        }
      }

      repeatItems = newRepeatItems
      initialElements = orderedElements

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
        orderedElements,
        getNextSiblingElement(path, parentElement),
      )
    }

    if (isStaticFormula(node?.repeat)) {
      updateRepeatList(evaluateRepeatEntries(dataSignal.get()))
      dataSignal.subscriptions.push(destroyRepeatItems)
    } else {
      const repeatSignal = dataSignal.map(evaluateRepeatEntries)
      repeatSignal.subscribe(updateRepeatList, {
        destroy: destroyRepeatItems,
      })
    }

    // We utilize that the signal subscription runs synchronously above,
    // so we already have populated elements to return initially.
    firstRun = false
    return initialElements
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
      slotSuffix,
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
    slotSuffix,
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
  /**
   * Slots can be located inside repeated nodes, so we need to forward their last repeat index to ensure unique paths for their children.
   * Note that the repeat index is reset at slot and component boundaries
   */
  slotRepeatIndex?: number
  slotSuffix?: string
}
