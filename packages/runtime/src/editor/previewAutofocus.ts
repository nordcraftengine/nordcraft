import type { ComponentData } from '@nordcraft/core/dist/component/component.types'
import type {
  BaseFormulaContext,
  Formula,
} from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import type { Nullable } from '@nordcraft/core/dist/types'
import type { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { setAttribute } from '../utils/setAttribute'

/**
 * Preview-only autofocus handling: in design mode the `autofocus` attribute
 * must stay off (otherwise the canvas steals focus), while in test mode it
 * behaves like the production runtime.
 *
 * This module is preview-only: it is imported solely by the preview entry
 * (`editor-preview.main.ts`) and exposed to shared runtime code via
 * `toddle._preview.handleAutofocus` injection, so production bundles (`page`,
 * `custom-element`) don't include it.
 */
export function handlePreviewAutofocus({
  elem,
  attr,
  value,
  dataSignal,
  formulaCtx,
  id,
  ctx,
}: {
  elem: HTMLElement | SVGElement | MathMLElement
  attr: string
  value: Nullable<Formula>
  dataSignal: Signal<ComponentData>
  formulaCtx: BaseFormulaContext
  id: string
  ctx: ComponentContext
}) {
  const showSignal = ctx.toddle._preview?.showSignal
  if (!showSignal) {
    return
  }
  let o: Signal<any> | undefined
  const setupAttribute = () => {
    if (!value || value.type === 'value') {
      setAttribute(elem, attr, value?.value)
    } else {
      const attrPath = ctx.reportFormulaEvaluation
        ? ['nodes', id, 'attrs', attr]
        : undefined
      o = dataSignal.map((data) => {
        const val = applyFormula(value, formulaCtx, data, attrPath)
        if (attrPath) {
          ctx.reportFormulaEvaluation?.(attrPath, val, ctx)
        }
        return val
      })
      o.subscribe((val) => {
        setAttribute(elem, attr, val)
      })
    }
  }
  const setup = setupAttribute
  showSignal.subscribe(({ testMode }) => {
    if (testMode) {
      setup()
    } else {
      o?.destroy()
      elem.removeAttribute(attr)
    }
  })
}
