/* eslint-disable no-console */
import type {
  ComponentData,
  ComponentNodeModel,
  ElementNodeModel,
  NodeModel,
  SlotNodeModel,
  SupportedNamespaces,
  TextNodeModel,
} from '@nordcraft/core'
import { applyFormula, isObject, repeatPath, toBoolean } from '@nordcraft/core'
import '@nordcraft/core/compileTime'
import type { Signal } from '../signal/signal'
import { FORCE_UPDATE, signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { getComponent } from '../utils/getComponent'
import { isStaticFormula } from '../utils/isStaticFormula'
import { ensureEfficientOrdering, getNextSiblingElement } from '../utils/nodes'
import { createComponent } from './createComponent'
import { createElement } from './createElement'
import { createSlot } from './createSlot'
import { createText } from './createText'
import type { HydrationState } from './hydration'

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
  hydration,
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
  hydration?: HydrationState
}): ReadonlyArray<Element | Text> {
  const node = ctx.component.nodes?.[id]
  if (!node) {
    return []
  }
  const props: NodeRenderer<NodeModel> = {
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
    hydration,
  }
  if (node.repeat) {
    return repeat(props)
  }
  if (node.condition) {
    return conditional(props)
  }
  return renderNode(props)
}

function renderNode(
  props: NodeRenderer<NodeModel>,
): ReadonlyArray<Element | Text> {
  switch (props.node.type) {
    case 'element':
      return [createElement(props as NodeRenderer<ElementNodeModel>)]
    case 'component': {
      const ctx = props.ctx
      const isLocalComponent =
        getComponent(props.node.name, ctx.components, !IS_PREVIEW) !== undefined
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
        ...(props as NodeRenderer<ComponentNodeModel>),
        ctx: childCtx,
      })
    }
    case 'text':
      return [createText(props as NodeRenderer<TextNodeModel>)]
    case 'slot':
      return createSlot(props as NodeRenderer<SlotNodeModel>)
  }
}

function conditional(
  props: NodeRenderer<NodeModel>,
): ReadonlyArray<Element | Text> {
  const { node, dataSignal, id, path, ctx, parentElement } = props
  if (isStaticFormula(node.condition)) {
    if (!toBoolean(node.condition.value)) {
      return []
    }
    return renderNode(props)
  }
  let firstRun = true
  let childDataSignal: Signal<ComponentData> | null = null
  const conditionPath =
    IS_PREVIEW && ctx.reportFormulaEvaluation
      ? ['nodes', id, 'condition']
      : undefined
  const conditionCtx =
    IS_PREVIEW && ctx.jsonPath ? { ...ctx, jsonPath: undefined } : ctx

  const elements: Array<Element | Text> = []
  const toggle = (show: boolean) => {
    if (show && elements.length === 0) {
      childDataSignal?.destroy()
      childDataSignal = dataSignal.fork()
      elements.push(
        ...renderNode({
          ...props,
          dataSignal: childDataSignal,
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
      for (const elem of elements) {
        elem.remove()
      }
      elements.length = 0
    }
  }

  let unsubscribePreview: (() => void) | undefined
  let currentShow!: boolean
  dataSignal.subscribeMap(
    (data: ComponentData) =>
      toBoolean(
        applyFormula(node.condition, conditionCtx, data, conditionPath),
      ),
    (show) => {
      currentShow = show
      toggle(show)
    },
    {
      destroy: () => {
        unsubscribePreview?.()
        childDataSignal?.destroy()
        for (const elem of elements) {
          elem.remove()
        }
        elements.length = 0
      },
    },
  )
  if (IS_PREVIEW) {
    unsubscribePreview = ctx.toddle._preview?.showSignal.subscribe(
      ({ displayedNodes, testMode }) => {
        if (displayedNodes.includes(path) && !testMode) {
          // only override the default show if we are in design mode (not test mode)
          toggle(true)
        } else {
          toggle(currentShow)
        }
      },
    )
  }

  firstRun = false
  return elements
}

function repeat(props: NodeRenderer<NodeModel>): ReadonlyArray<Element | Text> {
  const {
    node,
    dataSignal,
    id,
    path,
    ctx,
    namespace,
    parentElement,
    instance,
    slotSuffix,
    hydration,
  } = props
  let firstRun = true
  // Only one default element is allowed, but if it is removed, we allow a new to be assigned. The default element is mostly used for the editor.
  let defaultElement: string | number | null = null
  let lifetimeSize = 0
  let repeatItems = new Map<
    string | number,
    {
      dataSignal: Signal<ComponentData>
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
  const repeatFormulaCtx =
    IS_PREVIEW && ctx.jsonPath ? { ...ctx, jsonPath: undefined } : ctx

  let initialElements: ReadonlyArray<Element | Text> = []
  const destroyRepeatItems = () => {
    for (const e of repeatItems.values()) {
      e.dataSignal.destroy()
      for (let k = 0; k < e.elements.length; k++) {
        e.elements[k]!.remove()
      }
    }
    repeatItems.clear()
  }
  const updateRepeatList = (
    values: ReadonlyArray<unknown>,
    keys: ReadonlyArray<string> | null,
  ) => {
    const data = dataSignal.get()
    const parentListItem = data.ListItem
    const len = values.length
    const seenKeys = new Set<string | number>()
    const childDatas: ComponentData[] = new Array(len)
    const childKeys: Array<string | number> = new Array(len)
    for (let n = 0; n < len; n++) {
      const Key = keys ? keys[n]! : String(n)
      const Item = values[n]
      const ListItem = parentListItem
        ? { Parent: parentListItem, Item, Index: n, Key }
        : { Item, Index: n, Key }
      const childData = { ...data, ListItem }
      childDatas[n] = childData
      let childKey = node?.repeatKey
        ? applyFormula(
            node.repeatKey,
            repeatFormulaCtx,
            childData,
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
      childKeys[n] = childKey
    }

    // Cleanup removed items before rendering new items to ensure clean state
    for (const [key, item] of repeatItems) {
      if (!seenKeys.has(key)) {
        item.dataSignal.destroy()
        for (const e of item.elements) {
          e.remove()
        }
        if (defaultElement === key) {
          defaultElement = null
        }
      }
    }

    const newRepeatItems = new Map<
      string | number,
      {
        dataSignal: Signal<ComponentData>
        elements: ReadonlyArray<Element | Text>
      }
    >()
    const orderedElements: Array<Element | Text> = []
    for (let n = 0; n < len; n++) {
      const childKey = childKeys[n]!
      const childData = childDatas[n]!
      const existingItem = repeatItems.get(childKey)
      if (existingItem) {
        newRepeatItems.set(childKey, existingItem)
        existingItem.dataSignal.set(
          childData,
          // We can skip deep equality check as we know the ListItem object is always a fresh object with potentially new Index/Item.
          FORCE_UPDATE,
        )
        for (let k = 0; k < existingItem.elements.length; k++) {
          orderedElements.push(existingItem.elements[k]!)
        }
      } else {
        const childDataSignal = signal<ComponentData>(childData)
        const repeatIndex =
          n === 0 && !defaultElement ? undefined : ++lifetimeSize
        const args = {
          node: node!,
          id,
          dataSignal: childDataSignal,
          path: repeatPath(path, repeatIndex),
          ctx,
          namespace,
          parentElement,
          instance,
          slotRepeatIndex: repeatIndex,
          slotSuffix,
          hydration,
        }
        if (n === 0 && !defaultElement) {
          defaultElement = childKey
        }
        const elements = node!.condition ? conditional(args) : renderNode(args)
        newRepeatItems.set(childKey, {
          dataSignal: childDataSignal,
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

    ensureEfficientOrdering(
      parentElement,
      orderedElements,
      getNextSiblingElement(path, parentElement, true),
    )
  }

  const repeatFormula = node?.repeat
  const staticRepeat = isStaticFormula(repeatFormula)
  if (staticRepeat) {
    const val = repeatFormula.value
    if (Array.isArray(val)) {
      updateRepeatList(val, null)
    } else if (isObject(val)) {
      updateRepeatList(Object.values(val), Object.keys(val))
    } else {
      updateRepeatList([], null)
    }
  }
  let prevList: unknown = undefined
  let prevValues: ReadonlyArray<unknown> | null = null
  let prevKeys: ReadonlyArray<string> | null = null
  dataSignal.subscribe(
    (data) => {
      if (!staticRepeat) {
        const list = applyFormula(
          node?.repeat,
          repeatFormulaCtx,
          data,
          listPath,
        )
        if (prevValues === null || list !== prevList) {
          prevList = list
          let values: ReadonlyArray<unknown>
          let keys: ReadonlyArray<string> | null = null
          if (Array.isArray(list)) {
            values = list
          } else if (isObject(list)) {
            keys = Object.keys(list)
            values = Object.values(list)
          } else {
            values = []
          }
          if (
            prevValues === null ||
            (keys === null) !== (prevKeys === null) ||
            values.length !== prevValues.length ||
            keys?.some((k, i) => k !== prevKeys![i]) ||
            values.some((v, i) => v !== prevValues![i])
          ) {
            prevValues = values
            prevKeys = keys
            updateRepeatList(values, keys)
            return
          }
        }
      } else if (firstRun) {
        return
      }
      for (const item of repeatItems.values()) {
        item.dataSignal.set(
          {
            ...data,
            ListItem: item.dataSignal.value.ListItem,
          },
          FORCE_UPDATE,
        )
      }
    },
    { destroy: destroyRepeatItems },
  )

  // We utilize that the signal subscription runs synchronously above,
  // so we already have populated elements to return initially.
  firstRun = false
  return initialElements
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
  hydration?: HydrationState
}
