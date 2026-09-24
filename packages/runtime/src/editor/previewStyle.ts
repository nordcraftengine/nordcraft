import type {
  Component,
  ComponentData,
} from '@nordcraft/core/dist/component/component.types'
import {
  applyFormula,
  type FormulaContext,
  type ToddleEnv,
} from '@nordcraft/core/dist/formula/formula'
import type { FormulaEvaluationReporter } from '@nordcraft/core/dist/formula/formulaTypes'
import { appendUnit } from '@nordcraft/core/dist/styling/customProperty'
import type { Theme } from '@nordcraft/core/dist/styling/theme'
import type { StyleVariant } from '@nordcraft/core/dist/styling/variantSelector'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { lookupNodeAndAncestors } from './dom'
import { resizeCanvas } from './resizeCanvas'
import {
  convertViewportUnitsToEmulatedViewportUnits,
  styleToCss,
} from './style'
import { getThemeCssBlocks } from './theme'

export const clearSelectedStyleVariant = (
  styleVariantSelection: { nodeId: string; styleVariantIndex: number } | null,
) => {
  if (styleVariantSelection) {
    const styleElem = document.head.querySelector(
      `[data-hash="${styleVariantSelection.nodeId}"]`,
    )
    if (styleElem) {
      document.head.removeChild(styleElem)
    }
  }
}

export const applyPreviewStyle = (options: {
  data: {
    styles: Record<string, string> | null
    theme?: {
      key: string
      value: Theme
    }
  }
  selectedNodeId: string | null
  component: Component | null
  styleVariantSelection: { nodeId: string; styleVariantIndex: number } | null
  resizeCanvasOptions: {
    viewport?: { height: number | null }
    enabled?: boolean
  }
  syncOverlayRects: () => void
}) => {
  const { styles: previewStyleStyles, theme } = options.data
  // Update or create a new style tag and set the given styles with important priority
  let styleElement = document.head.querySelector(
    '[data-id="selected-node-styles"]',
  )

  // Cleanup when null or empty styles are sent
  if (
    !previewStyleStyles ||
    (!theme && Object.keys(previewStyleStyles).length === 0)
  ) {
    styleElement?.remove()
    resizeCanvas(options.resizeCanvasOptions)
    options.syncOverlayRects()
    return
  }

  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.setAttribute('data-id', 'selected-node-styles')
    document.head.appendChild(styleElement)
  }

  // If style variant targets a pseudo-element, apply styles to it instead
  let pseudoElement = ''
  if (options.component && options.styleVariantSelection) {
    const nodeLookup = lookupNodeAndAncestors(
      options.component,
      options.styleVariantSelection.nodeId,
    )
    if (
      (nodeLookup?.node.type === 'element' ||
        nodeLookup?.node.type === 'component') &&
      nodeLookup.node.variants?.[
        options.styleVariantSelection.styleVariantIndex
      ]?.pseudoElement
    ) {
      pseudoElement = `::${nodeLookup.node.variants[options.styleVariantSelection.styleVariantIndex].pseudoElement}`
    }
  }

  // If theme property preview, then override happens at root level and with reasonable specificity.
  // Otherwise, force (!important) the style directly on the element.
  if (theme) {
    theme.value.propertyDefinitions = Object.fromEntries(
      Object.entries(theme.value.propertyDefinitions ?? {})
        .filter(([key]) => previewStyleStyles[key])
        .map(([key, val]) => [
          key,
          {
            ...val,
            values: {
              ...val.values,
              [theme.key]: previewStyleStyles[key],
            },
          },
        ]),
    )
    const newCss = getThemeCssBlocks(theme)
    if (styleElement.textContent !== newCss) {
      styleElement.textContent = newCss
    }
  } else {
    const previewStyles = Object.entries(previewStyleStyles)
      .map(
        ([key, value]) =>
          `${key}: ${convertViewportUnitsToEmulatedViewportUnits(value)} !important;`,
      )
      .join('\n')
    const newCss = `[data-id="${options.selectedNodeId}"]${pseudoElement}, [data-id="${options.selectedNodeId}"] ~ [data-id^="${options.selectedNodeId}("]${pseudoElement} {
    ${previewStyles}
    transition: none !important;
  }`
    if (styleElement.textContent !== newCss) {
      styleElement.textContent = newCss
    }
  }
  resizeCanvas(options.resizeCanvasOptions)
  options.syncOverlayRects()
}

export const updateSelectedStyleVariant = (options: {
  variantIndex: number | null
  selectedNodeId: string | null
  component: Component | null
  dataSignal: Signal<ComponentData>
  ctx: ComponentContext | null
  env: ToddleEnv
  getCurrentComponent: () => Component | null
  reportFormulaEvaluation?: FormulaEvaluationReporter
  currentSelection: { nodeId: string; styleVariantIndex: number } | null
}): { nodeId: string; styleVariantIndex: number } | null => {
  clearSelectedStyleVariant(options.currentSelection)
  if (
    options.selectedNodeId !== null &&
    typeof options.variantIndex === 'number'
  ) {
    const styleVariantSelection = {
      nodeId: options.selectedNodeId,
      styleVariantIndex: options.variantIndex,
    }
    const nodeLookup = lookupNodeAndAncestors(
      options.component,
      options.selectedNodeId,
    )
    if (
      nodeLookup &&
      styleVariantSelection.nodeId === options.selectedNodeId &&
      (nodeLookup.node.type === 'element' ||
        nodeLookup.node.type === 'component')
    ) {
      const selectedStyleVariant =
        nodeLookup.node.variants?.[styleVariantSelection.styleVariantIndex] ??
        ({ style: {} } as StyleVariant)
      // Add a style element specific to the selected element which
      // is only applied when the preview is in design mode
      const styleVariantCustomProperties = Object.fromEntries(
        Object.entries(
          (selectedStyleVariant as StyleVariant).customProperties ?? {},
        )
          .map(([customPropertyName, customProperty]) => [
            customPropertyName,
            appendUnit(
              applyFormula(
                customProperty.formula,
                {
                  data: options.dataSignal.get(),
                  component: options.getCurrentComponent(),
                  root: options.ctx?.root,
                  formulaCache: {},
                  package: options.ctx?.package,
                  toddle: window.toddle,
                  env: options.env,
                  // TODO: Ensure we have the node id here
                  jsonPath: [
                    'nodes',
                    '<random id>',
                    'variants',
                    styleVariantSelection.styleVariantIndex,
                    customPropertyName,
                  ],
                  reportFormulaEvaluation: options.reportFormulaEvaluation,
                } as FormulaContext,
                [],
              ),
              customProperty.unit,
            ),
          ])
          .filter(([, value]) => isDefined(value)),
      )

      const styleElem = document.createElement('style')
      const pseudoElement = selectedStyleVariant.pseudoElement
        ? `::${selectedStyleVariant.pseudoElement}`
        : ''
      styleElem.setAttribute('data-hash', options.selectedNodeId)
      styleElem.appendChild(
        document.createTextNode(`
                        body[data-mode="design"] [data-id="${options.selectedNodeId}"]${pseudoElement} {
                          ${styleToCss({
                            ...(!pseudoElement && nodeLookup.node.style),
                            ...selectedStyleVariant.style,
                            ...styleVariantCustomProperties,
                          })}
                        }
                      `),
      )
      const existingStyleElement = document.head.querySelector(
        `[data-hash="${options.selectedNodeId}"]`,
      )
      if (existingStyleElement) {
        document.head.removeChild(existingStyleElement)
      }
      document.head.appendChild(styleElem)
      return styleVariantSelection
    }
  }
  return null
}
