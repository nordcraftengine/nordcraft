import type {
  ComponentData,
  ElementNodeModel,
  EventModel,
  SupportedNamespaces,
  TextNodeModel,
} from '@nordcraft/core'
import {
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
import { isStaticFormula } from '../utils/isStaticFormula'
import { setAttribute } from '../utils/setAttribute'
import { bindCustomProperty } from '../utils/subscribeCustomProperty'
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
      const slotNodes = Object.values(ctx.component.nodes).filter(
        (node) => node?.type === 'slot',
      )
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
  if (IS_PREVIEW && ctx.isRootComponent) {
    elem.setAttribute('data-is-root-component', 'true')
  }
  elem.setAttribute(DATA_ATTR_NODE_ID, id)
  if (path) {
    elem.setAttribute(DATA_ATTR_ID, path)
  }
  if (IS_PREVIEW && ctx.isRootComponent === false && id !== 'root') {
    elem.setAttribute(DATA_ATTR_COMPONENT, ctx.component.name)
  }
  const attrs = node.attrs
  if (attrs) {
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
        dataSignal.subscribeMap(
          (data) => {
            const val = applyFormula(value, formulaCtx, data, attrPath)
            if (IS_PREVIEW && attrPath) {
              ctx.reportFormulaEvaluation?.(attrPath, val, ctx)
            }
            return val
          },
          (val) => {
            setAttribute(elem, attr, val)
          },
        )
      }
    }
  }

  // class names are baked during preprocessing, except for in editor-preview where we generate them on the fly
  // Check the per-node cache first to avoid the `variants.some(...)` closure
  // + JSON.stringify on every repeat instance (200x per list).
  const cachedClass = classNameByNode.get(node)
  if (cachedClass !== undefined) {
    elem.classList.add(cachedClass)
  } else if (node.style || node.variants?.some((v) => v.style)) {
    const classHash = getClassName([node.style, node.variants])
    classNameByNode.set(node, classHash)
    elem.classList.add(classHash)
  }
  if (node.classes) {
    for (const className in node.classes) {
      const formula = node.classes[className].formula
      if (formula) {
        if (isStaticFormula(formula)) {
          if (toBoolean(formula.value)) {
            elem.classList.add(className)
          }
        } else {
          dataSignal.subscribeMap(
            (data) => toBoolean(applyFormula(formula, formulaCtx, data)),
            (show) =>
              show
                ? elem.classList.add(className)
                : elem.classList.remove(className),
          )
        }
      } else {
        elem.classList.add(className)
      }
    }
  }

  let hasDynamicCustomProperties = false
  if (instance && id === 'root') {
    for (const key in instance) {
      const value = instance[key]
      elem.classList.add(toValidClassName(`${key}:${value}`))
      // TODO: We should forward info on whether the instance has dynamic custom properties, but for now we assume that if the instance has any custom properties, they are dynamic.
      hasDynamicCustomProperties = true
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
    dataSignal.subscribeMap(
      (data) => {
        const value = applyFormula(formula, formulaCtx, data, styleVarPath)
        if (IS_PREVIEW && styleVarPath) {
          ctx.reportFormulaEvaluation?.(styleVarPath, value, ctx)
        }
        return unit ? value + unit : value
      },
      (value) => elem.style.setProperty(`--${name}`, value),
    )
  })

  const customProperties = node.customProperties
  if (customProperties) {
    let nodeSelector: string | undefined
    for (const customPropertyName in customProperties) {
      const customProperty =
        customProperties[customPropertyName as keyof typeof customProperties]!
      if (!formulaHasValue(customProperty.formula)) {
        continue
      }
      hasDynamicCustomProperties = true
      if (nodeSelector === undefined) {
        const baseSelector = getNodeSelector(path)
        nodeSelector =
          IS_CUSTOM_ELEMENT && ctx.isRootComponent && path === '0'
            ? `${baseSelector}, :host`
            : baseSelector
      }
      bindCustomProperty({
        customPropertyName,
        selector: nodeSelector,
        customProperty,
        dataSignal,
        formulaCtx,
        ctx,
        reportPath:
          IS_PREVIEW && ctx.reportFormulaEvaluation
            ? ['nodes', id, 'customProperties', customPropertyName, 'formula']
            : undefined,
      })
    }
  }

  node.variants?.forEach((variant, variantIndex) => {
    const variantCustomProperties = variant.customProperties
    if (!variantCustomProperties) {
      return
    }
    let variantSelector: string | undefined
    for (const customPropertyName in variantCustomProperties) {
      const customProperty =
        variantCustomProperties[
          customPropertyName as keyof typeof variantCustomProperties
        ]!
      if (!formulaHasValue(customProperty.formula)) {
        continue
      }
      hasDynamicCustomProperties = true
      variantSelector ??= getNodeSelector(path, { variant })
      bindCustomProperty({
        customPropertyName,
        selector: variantSelector,
        variant,
        customProperty,
        dataSignal,
        formulaCtx,
        ctx,
        reportPath:
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
            : undefined,
      })
    }
  })

  if (path && hasDynamicCustomProperties) {
    elem.classList.add(getPathClassName(path))
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
    const textNodes = (node.children ?? [])
      .map((child) => ctx.component.nodes?.[child])
      .filter((n): n is TextNodeModel => n?.type === 'text')
    if (textNodes.every((n) => isStaticFormula(n.value))) {
      elem.textContent = textNodes
        .map((n) => String((n.value as any).value))
        .join('')
    } else {
      dataSignal.subscribeMap(
        (data) =>
          textNodes
            .map((n) =>
              isStaticFormula(n.value)
                ? String(n.value.value)
                : String(applyFormula(n.value, formulaCtx, data)),
            )
            .join(''),
        (text) => {
          elem.textContent = text
        },
      )
    }
  } else {
    const children = node.children
    if (children) {
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
          elem.appendChild(nodes[j]!)
        }
      }
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
    const actions = event?.actions
    if (actions) {
      for (let i = 0; i < actions.length; i++) {
        void handleAction(
          actions[i]!,
          { ...dataSignal.get(), Event: e },
          ctx,
          e,
        )
      }
    }
    return false
  }
