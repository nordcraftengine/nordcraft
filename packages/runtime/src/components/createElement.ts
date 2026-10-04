import '@nordcraft/core/dist/compileTime'
import type {
  ComponentData,
  ElementNodeModel,
  EventModel,
  NodeModel,
  SupportedNamespaces,
} from '@nordcraft/core/dist/component/component.types'
import {
  DATA_ATTR_COMPONENT,
  DATA_ATTR_ID,
  DATA_ATTR_NODE_ID,
} from '@nordcraft/core/dist/const'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import {
  getClassName,
  getPathClassName,
  toValidClassName,
} from '@nordcraft/core/dist/styling/className'
import { appendUnit } from '@nordcraft/core/dist/styling/customProperty'
import { getNodeSelector } from '@nordcraft/core/dist/utils/getNodeSelector'
import { isDefined, toBoolean } from '@nordcraft/core/dist/utils/util'
import { handleAction } from '../events/handleAction'
import type { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { formulaHasValue } from '../utils/formulaHasValue'
import { getDragData } from '../utils/getDragData'
import { getElementTagName } from '../utils/getElementTagName'
import { isStaticFormula } from '../utils/isStaticFormula'
import { setAttribute } from '../utils/setAttribute'
import {
  subscribeCustomProperty,
  subscribeStaticCustomProperty,
} from '../utils/subscribeCustomProperty'
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
    IS_PREVIEW && ctx.reportFormulaEvaluation
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

  if (
    IS_PREVIEW &&
    ctx.env?.runtime === 'preview' &&
    isDefined(ctx.component?.nodes)
  ) {
    let slotName: string | undefined | null
    let hasSlotElements = false

    for (const node of Object.values(ctx.component.nodes)) {
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
    }
  }
  if (IS_PREVIEW && ctx.isRootComponent) {
    elem.setAttribute('data-is-root-component', 'true')
  }
  if (IS_PREVIEW) {
    elem.setAttribute(DATA_ATTR_NODE_ID, id)
  }
  if (path) {
    elem.setAttribute(DATA_ATTR_ID, path)
  }
  if (IS_PREVIEW && ctx.isRootComponent === false && id !== 'root') {
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
        if (isStaticFormula(formula)) {
          if (toBoolean(formula.value)) {
            initialClasses.push(className)
          }
        } else {
          const classSignal = dataSignal.map((data) =>
            toBoolean(applyFormula(formula, formulaCtx, data)),
          )
          classSignal.subscribe((show) =>
            show
              ? elem.classList.add(className)
              : elem.classList.remove(className),
          )
        }
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
    const previewHandledAutofocus =
      IS_PREVIEW && attr === 'autofocus'
        ? (ctx.toddle._preview?.handleAutofocus?.({
            elem,
            attr,
            value,
            dataSignal,
            formulaCtx,
            id,
            ctx,
          }),
          true)
        : false
    if (previewHandledAutofocus) {
      continue
    }
    if (value.type === 'value') {
      setAttribute(elem, attr, value?.value)
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
  node['style-variables']?.forEach((styleVariable, i) => {
    const { name, formula, unit } = styleVariable
    if (isStaticFormula(formula)) {
      const staticValue: any = formula.value
      elem.style.setProperty(
        `--${name}`,
        unit ? staticValue + unit : staticValue,
      )
      return
    }
    const styleVarPath =
      IS_PREVIEW && ctx.reportFormulaEvaluation
        ? ['nodes', id, 'style-variables', i, 'formula']
        : undefined
    const styleSignal = dataSignal.map((data) => {
      const value = applyFormula(formula, formulaCtx, data, styleVarPath)
      if (IS_PREVIEW && styleVarPath) {
        ctx.reportFormulaEvaluation?.(styleVarPath, value, ctx)
      }
      return unit ? value + unit : value
    })

    styleSignal.subscribe((value) => elem.style.setProperty(`--${name}`, value))
  })

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
    if (isStaticFormula(formula)) {
      subscribeStaticCustomProperty({
        customPropertyName,
        selector:
          IS_CUSTOM_ELEMENT && ctx.isRootComponent && path === '0'
            ? `${nodeSelector}, :host`
            : nodeSelector,
        value: appendUnit(formula.value, unit),
        root: ctx.root,
        dataSignal,
      })
      continue
    }
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

  node.variants?.forEach((variant, variantIndex) => {
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
      const variantSelector = getNodeSelector(path, {
        variant,
      })
      if (isStaticFormula(formula)) {
        subscribeStaticCustomProperty({
          customPropertyName,
          selector: variantSelector,
          value: appendUnit(formula.value, unit),
          variant,
          root: ctx.root,
          dataSignal,
        })
        continue
      }
      subscribeCustomProperty({
        customPropertyName,
        selector: variantSelector,
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
  })

  if (path && hasDynamicCustomProperties) {
    initialClasses.push(getPathClassName(path))
  }

  // Index loop instead of `classList.add(...classes)`: avoids allocating
  // the spread arguments object on every element creation (Preact-style).
  for (let i = 0; i < initialClasses.length; i++) {
    elem.classList.add(initialClasses[i]!)
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
    ;(node.children ?? [])
      .map<NodeModel | undefined | null>(
        (child) => ctx.component.nodes?.[child],
      )
      .filter((node) => node?.type === 'text')
      .forEach((node) => {
        if (node.value.type === 'value') {
          textValues.push(String(node.value.value))
        } else {
          const textSignal = dataSignal.map((data) => {
            return String(applyFormula(node.value, formulaCtx, data))
          })
          textValues.push(textSignal)
        }
      })

    // if all values are string, we can directly set textContent
    if (textValues.every((value) => typeof value === 'string')) {
      elem.textContent = textValues.join('')
    }

    // for each signal, we subscribe and rewrite the entire textContent from all text nodes
    textValues
      .filter((value) => typeof value !== 'string')
      .forEach((valueSignal) => {
        valueSignal.subscribe(() => {
          elem.textContent = textValues
            .map((value) => (typeof value === 'string' ? value : value.get()))
            .join('')
        })
      })
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
    // Index loop over `appendChild` instead of `append(...childNodes)`:
    // same DOM result for Node items, without the spread allocation.
    for (let i = 0; i < childNodes.length; i++) {
      elem.appendChild(childNodes[i]!)
    }
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
    // Hoisted out of the per-action loop: event payload extraction is
    // idempotent and event-scoped, so running it once per event instead of
    // once per action is behavior-identical and cheaper.
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
    // NOTE: signal notifications used to be batched (coalesced) across the
    // actions of one event. That changed observable timing — a later action
    // (or a custom formula in a later SetVariable) could observe DOM/side
    // effects that the earlier action's cascade had not produced yet (e.g. a
    // custom action measuring an element resized by the first action).
    // Actions therefore run sequentially with the full cascade between them,
    // exactly as before batching existed.
    event?.actions?.forEach((action) => {
      void handleAction(action, { ...dataSignal.get(), Event: e }, ctx, e)
    })
    return false
  }
