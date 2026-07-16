import type {
  ComponentData,
  ElementNodeModel,
  EventModel,
  NodeModel,
  SupportedNamespaces,
} from '@nordcraft/core/dist/component/component.types'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import {
  getClassName,
  getPathClassName,
  toValidClassName,
} from '@nordcraft/core/dist/styling/className'
import { appendUnit } from '@nordcraft/core/dist/styling/customProperty'
import { getNodeSelector } from '@nordcraft/core/dist/utils/getNodeSelector'
import { pathToString } from '@nordcraft/core/dist/utils/path'
import { isDefined, toBoolean } from '@nordcraft/core/dist/utils/util'
import { PATH } from '../constants'
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

export function createElement({
  node,
  dataSignal,
  id,
  path,
  ctx,
  namespace,
  instance,
  slotRepeatIndex,
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

  const formulaCtx = {
    component: ctx.component,
    formulaCache: ctx.formulaCache,
    root: ctx.root,
    package: ctx.package,
    toddle: ctx.toddle,
    env: ctx.env,
    reportFormulaEvaluation: ctx.reportFormulaEvaluation,
  }

  // [data-node-id] is required for reset-style targeting. Remove if we can get rid of/change reset-style.
  elem.setAttribute('data-node-id', id)
  if (path) {
    elem[PATH] = path
    if (ctx.env.runtime === 'preview') {
      elem.setAttribute('data-id', pathToString(path))
    }
  }
  if (
    ctx.isRootComponent === false &&
    id !== 'root' &&
    ctx.env.runtime === 'preview'
  ) {
    elem.setAttribute('data-component', ctx.component.name)
  }
  // class names are baked during preprocessing, except for in editor-preview where we generate them on the fly
  if (node.style || node.variants?.some((v) => v.style)) {
    const classHash = getClassName([node.style, node.variants])
    elem.classList.add(classHash)
  }
  if (node.classes) {
    Object.entries(node.classes)?.forEach(([className, { formula }]) => {
      if (formula) {
        const classSignal = dataSignal.map((data) =>
          toBoolean(
            applyFormula(formula, {
              ...formulaCtx,
              data,
            }),
          ),
        )
        classSignal.subscribe((show) =>
          show
            ? elem.classList.add(className)
            : elem.classList.remove(className),
        )
      } else {
        elem.classList.add(className)
      }
    })
  }

  let hasDynamicCustomProperties = false
  if (instance && id === 'root') {
    Object.entries(instance).forEach(([key, value]) => {
      elem.classList.add(toValidClassName(`${key}:${value}`))
      // TODO: We should forward info on whether the instance has dynamic custom properties, but for now we assume that if the instance has any custom properties, they are dynamic.
      hasDynamicCustomProperties = true
    })
  }

  Object.entries(node.attrs ?? {}).forEach(([attr, value]) => {
    if (!isDefined(value)) {
      return
    }
    let o: Signal<any> | undefined
    const setupAttribute = () => {
      if (value.type === 'value') {
        setAttribute(elem, attr, value?.value)
      } else {
        const attrPath = ['nodes', id, 'attrs', attr]
        o = dataSignal.map((data) => {
          const val = applyFormula(
            value,
            {
              ...formulaCtx,
              data,
            },
            attrPath,
          )
          ctx.reportFormulaEvaluation?.(attrPath, val, ctx)
          return val
        })
        o.subscribe((val) => {
          setAttribute(elem, attr, val)
        })
      }
    }
    if (
      attr === 'autofocus' &&
      ctx.env.runtime === 'preview' &&
      ctx.toddle._preview
    ) {
      ctx.toddle._preview.showSignal.subscribe(({ testMode }) => {
        if (testMode) {
          setupAttribute()
        } else {
          o?.destroy()
          elem.removeAttribute(attr)
        }
      })
    } else {
      setupAttribute()
    }
  })
  node['style-variables']?.forEach((styleVariable, i) => {
    const { name, formula, unit } = styleVariable
    const styleVarPath = ['nodes', id, 'style-variables', i, 'formula']
    const signal = dataSignal.map((data) => {
      const value = applyFormula(
        formula,
        {
          ...formulaCtx,
          data,
        },
        styleVarPath,
      )
      ctx.reportFormulaEvaluation?.(styleVarPath, value, ctx)
      return unit ? value + unit : value
    })

    signal.subscribe((value) => elem.style.setProperty(`--${name}`, value))
  })

  Object.entries(node.customProperties ?? {})
    .filter(([_, { formula }]) => formulaHasValue(formula))
    .forEach(([customPropertyName, { formula, unit }]) => {
      hasDynamicCustomProperties = true
      const cpPath = [
        'nodes',
        id,
        'customProperties',
        customPropertyName,
        'formula',
      ]
      subscribeCustomProperty({
        customPropertyName,
        selector:
          ctx.env.runtime === 'custom-element' &&
          ctx.isRootComponent &&
          path.length === 1 &&
          path[0].index === 0
            ? `${getNodeSelector(path)}, :host`
            : getNodeSelector(path),
        signal: dataSignal.map((data) => {
          const val = applyFormula(
            formula,
            {
              ...formulaCtx,
              data,
            },
            cpPath,
          )
          ctx.reportFormulaEvaluation?.(cpPath, val, ctx)
          return appendUnit(val, unit)
        }),
        root: ctx.root,
      })
    })

  node.variants?.forEach((variant, variantIndex) => {
    Object.entries(variant.customProperties ?? {})
      .filter(([_, { formula }]) => formulaHasValue(formula))
      .forEach(([customPropertyName, { formula, unit }]) => {
        hasDynamicCustomProperties = true
        const variantCpPath = [
          'nodes',
          id,
          'variants',
          variantIndex,
          'customProperties',
          customPropertyName,
          'formula',
        ]
        subscribeCustomProperty({
          customPropertyName,
          selector: getNodeSelector(path, {
            variant,
          }),
          variant,
          signal: dataSignal.map((data) => {
            const val = applyFormula(
              formula,
              {
                ...formulaCtx,
                data,
              },
              variantCpPath,
            )
            ctx.reportFormulaEvaluation?.(variantCpPath, val, ctx)
            return appendUnit(val, unit)
          }),
          root: ctx.root,
        })
      })
  })

  if (path && hasDynamicCustomProperties) {
    elem.classList.add(getPathClassName(path))
  }

  const eventHandlers: [string, (e: Event) => boolean][] = []
  Object.values(node.events ?? {}).forEach((event) => {
    if (!event) {
      return
    }

    eventHandlers.push([
      event.trigger,
      getEventHandler({ event, dataSignal, ctx }),
    ])
  })

  eventHandlers.forEach(([eventName, handler]) => {
    elem.addEventListener(eventName, handler, { signal: ctx.abortSignal })
  })

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
            return String(
              applyFormula(node.value, {
                ...formulaCtx,
                data,
              }),
            )
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
    ;(node.children ?? []).forEach((child, i) => {
      childNodes.push(
        ...createNode({
          parentElement: elem,
          id: child,
          path: [...path, { index: i }],
          dataSignal,
          ctx: { ...ctx, jsonPath: ['nodes', child] },
          namespace,
          instance,
          slotRepeatIndex,
        }),
      )
    })
    elem.append(...childNodes)
  }
  dataSignal.subscribe(() => {}, {
    destroy: () => {
      // TODO: Clean up event listeners, but after destruction of child signals (Maybe we need a "afterDestroy" hook on signals?)
      elem.parentNode?.removeChild(elem)
    },
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
    event?.actions?.forEach((action) => {
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
    })
    return false
  }
