import type {
  ComponentData,
  SupportedNamespaces,
  TextNodeModel,
} from '@nordcraft/core/dist/component/component.types'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'

export type RenderTextProps = {
  node: TextNodeModel
  dataSignal: Signal<ComponentData>
  id: string
  path: string
  namespace?: SupportedNamespaces
  ctx: ComponentContext
}

/**
 * Create a text node
 *
 * Note: We wrap the text in a <span> to make it easier to select/highlight the text node in the preview.
 * We should find a better way to do this without wrapping the node, and instead use `createTextNode`.
 */
export function createText({
  node,
  id,
  path,
  dataSignal,
  namespace,
  ctx,
}: RenderTextProps): HTMLSpanElement | Text {
  // Span element is not valid outside of the default namespace
  if (namespace && namespace !== 'http://www.w3.org/1999/xhtml') {
    return createTextNS({ node, dataSignal, ctx })
  }

  const { value } = node
  const elem = document.createElement('span')

  if (isDefined(ctx.component?.nodes)) {
    const isDefaultSlot =
      Object.values(ctx.component.nodes).filter(
        (n) => n?.type === 'slot' && n.children?.includes(id),
      ).length > 0

    if (isDefaultSlot) {
      elem.setAttribute('data-node-default-slot', 'true')
    }

    // This probably needs to be removed, since the text can't have any child elements
    const hasSlotElements =
      Object.values(ctx.component.nodes).filter((n) => n?.type === 'slot')
        .length > 0

    if (hasSlotElements) {
      elem.setAttribute('data-has-slots-elements', 'true')
    }
  }
  if (ctx.isRootComponent) {
    elem.setAttribute('data-is-root-component', 'true')
  }

  elem.setAttribute('data-node-id', id)
  if (typeof id === 'string') {
    elem.setAttribute('data-id', path)
  }
  if (ctx.isRootComponent === false) {
    elem.setAttribute('data-component', ctx.component.name)
  }
  elem.setAttribute('data-node-type', 'text')
  if (value.type !== 'value') {
    const sig = dataSignal.map((data) =>
      String(
        applyFormula(
          value,
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
          ['value'],
        ),
      ),
    )
    sig.subscribe((value) => {
      elem.innerText = value
    })
  } else {
    ctx.reportFormulaEvaluation?.(
      [...(ctx.jsonPath ?? []), 'value'],
      value.value,
      ctx,
    )
    elem.innerText = String(value.value)
  }
  return elem
}

/**
 * This function is technically more performant than `createText` because it doesn't create a wrapping <span> element.
 * We would like to use this everywhere eventually, but we need to handle raw text selection in the editor (possibly by utilizing text ranges).
 */
export function createTextNS({
  node,
  dataSignal,
  ctx,
}: Pick<RenderTextProps, 'node' | 'dataSignal' | 'ctx'>): Text {
  const { value } = node
  const textNode = document.createTextNode('')
  if (value.type !== 'value') {
    const sig = dataSignal.map((data) =>
      String(
        applyFormula(
          value,
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
          ['value'],
        ),
      ),
    )
    sig.subscribe((value) => {
      textNode.nodeValue = value
    })
  } else {
    textNode.nodeValue = String(value.value)
  }

  return textNode
}
