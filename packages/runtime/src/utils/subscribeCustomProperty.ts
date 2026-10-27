import type { Signal } from '../signal/signal'

import type {
  ComponentData,
  CustomProperty,
  FormulaContext,
  StyleVariant,
} from '@nordcraft/core'
import {
  appendUnit,
  applyFormula,
  CUSTOM_PROPERTIES_STYLESHEET_ID,
} from '@nordcraft/core'
import '@nordcraft/core/compileTime'
import { CustomPropertyStyleSheet } from '../styles/CustomPropertyStyleSheet'
import type { ComponentContext } from '../types'
import { isStaticFormula } from './isStaticFormula'

export const customPropertiesStylesheets = new WeakMap<
  Document | ShadowRoot,
  CustomPropertyStyleSheet
>()

function getStyleSheet(root: Document | ShadowRoot) {
  let stylesheet = customPropertiesStylesheets.get(root)
  if (!stylesheet) {
    stylesheet = new CustomPropertyStyleSheet(
      root,
      (
        root.getElementById(CUSTOM_PROPERTIES_STYLESHEET_ID) as
          | HTMLStyleElement
          | undefined
      )?.sheet,
    )
    customPropertiesStylesheets.set(root, stylesheet)
  }
  return stylesheet
}

export function subscribeCustomProperty({
  selector,
  customPropertyName,
  signal,
  variant,
  root,
}: {
  selector: string
  customPropertyName: string
  signal: Signal<string>
  variant?: StyleVariant
  root: Document | ShadowRoot
}) {
  const stylesheet = getStyleSheet(root)
  signal.subscribe(
    stylesheet.registerProperty(selector, customPropertyName, variant),
    {
      destroy: () => {
        stylesheet.unregisterProperty(selector, customPropertyName, {
          mediaQuery: variant?.mediaQuery,
          startingStyle: variant?.startingStyle,
        })
      },
    },
  )
}

export function bindCustomProperty({
  selector,
  customPropertyName,
  customProperty: { formula, unit },
  variant,
  dataSignal,
  formulaCtx,
  ctx,
  reportPath,
}: {
  selector: string
  customPropertyName: string
  customProperty: CustomProperty
  variant?: StyleVariant
  dataSignal: Signal<ComponentData>
  formulaCtx: FormulaContext
  ctx: ComponentContext
  reportPath?: (string | number)[]
}) {
  const stylesheet = getStyleSheet(ctx.root)
  const update = stylesheet.registerProperty(
    selector,
    customPropertyName,
    variant,
  )
  const unregister = () => {
    stylesheet.unregisterProperty(selector, customPropertyName, {
      mediaQuery: variant?.mediaQuery,
      startingStyle: variant?.startingStyle,
    })
  }
  if (isStaticFormula(formula)) {
    update(appendUnit(formula.value, unit))
    dataSignal.subscriptions.push(unregister)
    return
  }
  dataSignal.subscribeMap(
    (data) => {
      const val = applyFormula(formula, formulaCtx, data, reportPath)
      if (IS_PREVIEW && reportPath) {
        ctx.reportFormulaEvaluation?.(reportPath, val, ctx)
      }
      return appendUnit(val, unit)
    },
    update,
    { destroy: unregister },
  )
}
