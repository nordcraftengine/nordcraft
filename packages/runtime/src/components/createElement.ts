import type {
  ComponentData,
  ElementNodeModel,
  EventModel,
  NodeModel,
  SupportedNamespaces,
} from '@nordcraft/core'
import {
  appendUnit,
  applyFormula,
  DATA_ATTR_COMPONENT,
  DATA_ATTR_ID,
  DATA_ATTR_NODE_ID,
  getClassName,
  getNodeSelector,
  getPathClassName,
  isDefined,
  toBoolean,
  toValidClassName,
} from '@nordcraft/core'
import '@nordcraft/core/compileTime'
import { handlePreviewAutofocus } from '../editor/previewAutofocus'
import { handleAction } from '../events/handleAction'
import type { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { formulaHasValue } from '../utils/formulaHasValue'
import { getDragData } from '../utils/getDragData'
import { getElementTagName } from '../utils/getElementTagName'
import { setAttribute } from '../utils/setAttribute'
import { subscribeCustomProperty } from '../utils/subscribeCustomProperty'
import type { NodeRenderer } from './createNode'
import { createNode } from './createNode'

// Cache class names by node definition object. Repeat items share the same
// node reference, so this avoids re-stringifying/hashing identical style
// objects hundreds of times per list render. WeakMap entries are collected
// when cloned page components are discarded.
const classNameByNode = new WeakMap<object, string>()

export function createElement({
  node,
  dataSignal,
  id,
  path,
  ctx,
  namespace,
  instance,
  slotRepeatIndex,
  slotSuffix,
}: NodeRenderer<ElementNodeModel>): Element {
  const tag = getElementTagName(node, ctx, id)
  switch (tag) {
    case 'svg': {
      namespace = 'http://www.w3.org/2000/svg'
      break
    }
    case 'math': {
      namespace = 'http://www.w3.org/1998/Math/MathML'
      break
    }
  }

  // Explicitly setting a namespace has precedence over inferring it from the tag
  if (node.attrs?.['xmlns']?.type === 'value') {
    namespace = String(node.attrs['xmlns'].value) as SupportedNamespaces
  }

  const elem = namespace
    ? (document.createElementNS(namespace, tag) as SVGElement | MathMLElement)
    : document.createElement(tag)
  const initialClasses: string[] = []

  const formulaCtx =
    IS_PREVIEW && (ctx.reportFormulaEvaluation || ctx.jsonPath)
      ? {
          component: ctx.component,
          formulaCache: ctx.formulaCache,
          root: ctx.root,
          package: ctx.package,
          toddle: ctx.toddle,
          env: ctx.env,
          reportFormulaEvaluation: ctx.reportFormulaEvaluation,
        }
      : ctx

  // This is editor only logic and we should move out of the runtime bundle when possible
  if (
    IS_PREVIEW &&
    ctx.env?.runtime === 'preview' &&
    isDefined(ctx.component?.nodes)
  ) {
    let slotName: string | undefined | null
    let hasSlotElements = false

    for (const nodeKey in ctx.component.nodes) {
      const node = ctx.component.nodes[nodeKey]
      if (node?.type !== 'slot') continue

      hasSlotElements = true

      if (node.children?.includes(id)) {
        slotName = node?.name ?? 'default'
      }

      if (slotName) break
    }

    if (isDefined(slotName)) {
      elem.setAttribute('data-node-slot-name', slotName)
    }

    if (hasSlotElements && id === 'root') {
      elem.setAttribute('data-has-slots-elements', 'true')
      const slotNodes: (NodeModel | undefined | null)[] = []
      for (const nodeKey in ctx.component.nodes) {
        const node = ctx.component.nodes[nodeKey]
        if (node?.type === 'slot') {
          slotNodes.push(node)
        }
      }
      if (slotNodes.length === 1) {
        const onlySlot = slotNodes[0]
        elem.setAttribute(
          'data-single-slot-name',
          (onlySlot as { name?: string | null })?.name ?? 'default',
        )
      } else if (slotNodes.length > 1) {
        // Drop target when no slot shows placeholder content: the default
        // slot, or the first slot when there is no default slot.
        const names = slotNodes.map(
          (node) => (node as { name?: string | null })?.name ?? 'default',
        )
        elem.setAttribute(
          'data-fallback-slot-name',
          names.includes('default') ? 'default' : names[0],
        )
      }
    }
  }
  if (ctx.isRootComponent) {
    elem.setAttribute('data-is-root-component', 'true')
  }

  elem.setAttribute(DATA_ATTR_NODE_ID, id)
  if (path) {
    elem.setAttribute(DATA_ATTR_ID, path)
  }

  if (ctx.isRootComponent === false && id !== 'root') {
    elem.setAttribute(DATA_ATTR_COMPONENT, ctx.component.name)
  }
  // class names are baked during preprocessing, except for in editor-preview where we generate them on the fly
  // Check the per-node cache first to avoid the `variants.some(...)` closure
  // + JSON.stringify on every repeat instance (200x per list).
  const cachedClass = classNameByNode.get(node)
  if (cachedClass !== undefined) {
    initialClasses.push(cachedClass)
  } else if (node.style || node.variants?.some((v) => v.style)) {
    const classHash = getClassName([node.style, node.variants])
    classNameByNode.set(node, classHash)
    initialClasses.push(classHash)
  }
  if (node.classes) {
    for (const className in node.classes) {
      const formula = node.classes[className].formula
      if (formula) {
        const classSignal = dataSignal.map((data) =>
          toBoolean(applyFormula(formula, formulaCtx, data)),
        )
        classSignal.subscribe((show) =>
          show
            ? elem.classList.add(className)
            : elem.classList.remove(className),
        )
      } else {
        initialClasses.push(className)
      }
    }
  }

  let hasDynamicCustomProperties = false
  if (instance && id === 'root') {
    for (const key in instance) {
      const value = instance[key]
      initialClasses.push(toValidClassName(`${key}:${value}`))
      // TODO: We should forward info on whether the instance has dynamic custom properties, but for now we assume that if the instance has any custom properties, they are dynamic.
      hasDynamicCustomProperties = true
    }
  }

  const attrs = node.attrs ?? {}
  for (const attr in attrs) {
    const value = attrs[attr]
    if (!isDefined(value)) {
      continue
    }
    if (IS_PREVIEW && attr === 'autofocus' && ctx.toddle._preview) {
      handlePreviewAutofocus({
        elem,
        attr,
        value,
        dataSignal,
        id,
        ctx,
      })
      continue
    }
    if (value.type === 'value') {
      setAttribute(elem, attr, value.value)
    } else {
      const attrPath =
        IS_PREVIEW && ctx.reportFormulaEvaluation
          ? ['nodes', id, 'attrs', attr]
          : undefined
      const o = dataSignal.map((data) => {
        const val = applyFormula(value, formulaCtx, data, attrPath)
        if (IS_PREVIEW && attrPath) {
          ctx.reportFormulaEvaluation?.(attrPath, val, ctx)
        }
        return val
      })
      o.subscribe((val) => {
        setAttribute(elem, attr, val)
      })
    }
  }
  if (node['style-variables']) {
    for (let i = 0; i < node['style-variables'].length; i++) {
      const styleVariable = node['style-variables'][i]!
      const { name, formula, unit } = styleVariable
      const styleVarPath =
        IS_PREVIEW && ctx.reportFormulaEvaluation
          ? ['nodes', id, 'style-variables', i, 'formula']
          : undefined
      const signal = dataSignal.map((data) => {
        const value = applyFormula(formula, formulaCtx, data, styleVarPath)
        if (IS_PREVIEW && styleVarPath) {
          ctx.reportFormulaEvaluation?.(styleVarPath, value, ctx)
        }
        return unit ? value + unit : value
      })

      signal.subscribe((value) => elem.style.setProperty(`--${name}`, value))
    }
  }

  const customProperties = node.customProperties ?? {}
  for (const customPropertyName in customProperties) {
    const { formula, unit } =
      customProperties[customPropertyName as keyof typeof customProperties]!
    if (!formulaHasValue(formula)) {
      continue
    }
    hasDynamicCustomProperties = true
    const cpPath =
      IS_PREVIEW && ctx.reportFormulaEvaluation
        ? ['nodes', id, 'customProperties', customPropertyName, 'formula']
        : undefined
    const nodeSelector = getNodeSelector(path)
    subscribeCustomProperty({
      customPropertyName,
      selector:
        IS_CUSTOM_ELEMENT && ctx.isRootComponent && path === '0'
          ? `${nodeSelector}, :host`
          : nodeSelector,
      signal: dataSignal.map((data) => {
        const val = applyFormula(formula, formulaCtx, data, cpPath)
        if (IS_PREVIEW && cpPath) {
          ctx.reportFormulaEvaluation?.(cpPath, val, ctx)
        }
        return appendUnit(val, unit)
      }),
      root: ctx.root,
    })
  }

  if (node.variants) {
    for (
      let variantIndex = 0;
      variantIndex < node.variants.length;
      variantIndex++
    ) {
      const variant = node.variants[variantIndex]!
      const variantCustomProperties = variant.customProperties ?? {}
      for (const customPropertyName in variantCustomProperties) {
        const { formula, unit } =
          variantCustomProperties[
            customPropertyName as keyof typeof variantCustomProperties
          ]!
        if (!formulaHasValue(formula)) {
          continue
        }
        hasDynamicCustomProperties = true
        const variantCpPath =
          IS_PREVIEW && ctx.reportFormulaEvaluation
            ? [
                'nodes',
                id,
                'variants',
                variantIndex,
                'customProperties',
                customPropertyName,
                'formula',
              ]
            : undefined
        subscribeCustomProperty({
          customPropertyName,
          selector: getNodeSelector(path, {
            variant,
          }),
          variant,
          signal: dataSignal.map((data) => {
            const val = applyFormula(formula, formulaCtx, data, variantCpPath)
            if (IS_PREVIEW && variantCpPath) {
              ctx.reportFormulaEvaluation?.(variantCpPath, val, ctx)
            }
            return appendUnit(val, unit)
          }),
          root: ctx.root,
        })
      }
    }
  }

  if (path && hasDynamicCustomProperties) {
    initialClasses.push(getPathClassName(path))
  }

  if (initialClasses.length > 0) {
    elem.classList.add(...initialClasses)
  }

  for (const key in node.events) {
    const event = node.events[key]
    if (!event) {
      continue
    }

    elem.addEventListener(
      event.trigger,
      getEventHandler({ event, dataSignal, ctx }),
      { signal: ctx.abortSignal },
    )
  }

  // for script, style & SVG<text> tags we only render text child.
  // this can be removed once we fix the editor to handle raw text nodes without wrapping <span>
  const nodeTag = node.tag.toLocaleLowerCase()
  if (nodeTag === 'script' || nodeTag === 'style') {
    const textValues: Array<Signal<string> | string> = []
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        const child = ctx.component.nodes?.[node.children[i]]
        if (child?.type === 'text') {
          if (child.value.type === 'value') {
            textValues.push(String(child.value.value))
          } else {
            const textSignal = dataSignal.map((data) => {
              return String(applyFormula(child.value, formulaCtx, data))
            })
            textValues.push(textSignal)
          }
        }
      }
    }

    // if all values are string, we can directly set textContent
    if (textValues.every((value) => typeof value === 'string')) {
      elem.textContent = textValues.join('')
    }

    // for each signal, we subscribe and rewrite the entire textContent from all text nodes
    for (let i = 0; i < textValues.length; i++) {
      const valueSignal = textValues[i]!
      if (typeof valueSignal !== 'string') {
        valueSignal.subscribe(() => {
          elem.textContent = textValues
            .map((value) => (typeof value === 'string' ? value : value.get()))
            .join('')
        })
      }
    }
  } else {
    const childNodes: (Element | Text)[] = []
    const children = node.children ?? []
    for (let i = 0; i < children.length; i++) {
      const child = children[i]!
      const nodes = createNode({
        parentElement: elem,
        id: child,
        path: path + '.' + i,
        dataSignal,
        ctx:
          IS_PREVIEW && ctx.reportFormulaEvaluation
            ? { ...ctx, jsonPath: ['nodes', child] }
            : ctx,
        namespace,
        instance,
        slotRepeatIndex,
        slotSuffix,
      })
      for (let j = 0; j < nodes.length; j++) {
        childNodes.push(nodes[j]!)
      }
    }
    elem.append(...childNodes)
  }
  dataSignal.subscriptions.push(() => {
    // TODO: Clean up event listeners, but after destruction of child signals (Maybe we need a "afterDestroy" hook on signals?)
    elem.parentNode?.removeChild(elem)
  })

  return elem
}

const getEventHandler =
  ({
    event,
    dataSignal,
    ctx,
  }: {
    event: EventModel
    dataSignal: Signal<ComponentData>
    ctx: ComponentContext
  }) =>
  (e: Event) => {
    if (event?.actions) {
      const actions = event.actions
      const len = actions.length
      for (let i = 0; i < len; i++) {
        const action = actions[i]!
        if (e instanceof DragEvent) {
          ;(e as any).data = getDragData(e)
        }
        if (e instanceof ClipboardEvent) {
          try {
            ;(e as any).data = Array.from(e.clipboardData?.items ?? []).reduce<
              Record<string, any>
            >((dragData, item) => {
              try {
                dragData[item.type] = JSON.parse(
                  e.clipboardData?.getData(item.type) as any,
                )
              } catch {
                dragData[item.type] = e.clipboardData?.getData(item.type)
              }
              return dragData
            }, {})
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Could not get paste data', e)
          }
        }
        void handleAction(action, { ...dataSignal.get(), Event: e }, ctx, e)
      }
    }
    return false
  }
