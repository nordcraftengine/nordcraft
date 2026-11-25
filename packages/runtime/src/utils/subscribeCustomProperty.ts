import type { Signal } from '../signal/signal'

import type {
  ComponentData,
  CustomProperty,
  FormulaContext,
  Nullable,
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
import { formulaHasValue } from './formulaHasValue'
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
          HTMLStyleElement | undefined
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

export function bindCustomProperties(
  customProperties: Record<string, Nullable<CustomProperty>>,
  getSelector: () => string,
  {
    variant,
    dataSignal,
    formulaCtx,
    ctx,
    reportPrefix,
  }: {
    variant?: StyleVariant
    dataSignal: Signal<ComponentData>
    formulaCtx: FormulaContext
    ctx: ComponentContext
    reportPrefix?: (string | number)[]
  },
): boolean {
  const stylesheet = getStyleSheet(ctx.root)
  let selector: string | undefined
  for (const customPropertyName in customProperties) {
    const customProperty = customProperties[customPropertyName]
    if (!customProperty || !formulaHasValue(customProperty.formula)) {
      continue
    }
    selector ??= getSelector()
    const targetSelector = selector
    const { formula, unit } = customProperty
    const update = stylesheet.registerProperty(
      targetSelector,
      customPropertyName,
      variant,
    )
    const unregister = () => {
      stylesheet.unregisterProperty(targetSelector, customPropertyName, {
        mediaQuery: variant?.mediaQuery,
        startingStyle: variant?.startingStyle,
      })
    }
    if (isStaticFormula(formula)) {
      update(appendUnit(formula.value, unit))
      dataSignal.subscriptions.push(unregister)
      continue
    }
    const reportPath =
      IS_PREVIEW && reportPrefix
        ? [...reportPrefix, customPropertyName, 'formula']
        : undefined
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
  return selector !== undefined
}
