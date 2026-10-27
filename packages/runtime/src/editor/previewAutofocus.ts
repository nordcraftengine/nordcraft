import type { ComponentData, Formula } from '@nordcraft/core'
import { applyFormula } from '@nordcraft/core'
import type { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { setAttribute } from '../utils/setAttribute'

/**
 * Preview-only autofocus handling: in design mode the `autofocus` attribute
 * must stay off (otherwise the canvas steals focus), while in test mode it
 * behaves like the production runtime.
 */
export function handlePreviewAutofocus({
  elem,
  attr,
  value,
  dataSignal,
  id,
  ctx,
}: {
  elem: HTMLElement | SVGElement | MathMLElement
  attr: string
  value: Formula
  dataSignal: Signal<ComponentData>
  id: string
  ctx: ComponentContext
}) {
  const showSignal = ctx.toddle._preview?.showSignal
  if (!showSignal) {
    return
  }
  let unsubscribe: (() => void) | undefined
  const setupAttribute = () => {
    if (value.type === 'value') {
      setAttribute(elem, attr, value.value)
    } else {
      const attrPath = ctx.reportFormulaEvaluation
        ? ['nodes', id, 'attrs', attr]
        : undefined
      const formulaCtx = ctx.jsonPath ? { ...ctx, jsonPath: undefined } : ctx
      unsubscribe = dataSignal.subscribeMap(
        (data) => {
          const val = applyFormula(value, formulaCtx, data, attrPath)
          if (attrPath) {
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
  const setup = setupAttribute
  showSignal.subscribe(({ testMode }) => {
    if (testMode) {
      setup()
    } else {
      unsubscribe?.()
      elem.removeAttribute(attr)
    }
  })
}
