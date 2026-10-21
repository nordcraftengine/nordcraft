import type {
  Component,
  ComponentData,
  RouteParameters,
} from '@nordcraft/core/dist/component/component.types'
import type {
  FormulaContext,
  ToddleEnv,
} from '@nordcraft/core/dist/formula/formula'
import type { FormulaEvaluationReporter } from '@nordcraft/core/dist/formula/formulaTypes'
import type { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import {
  getAttributeTestValues,
  getRouteParams,
  getRouteQuery,
  getVariableInitialValues,
} from './componentData'

export interface PreviewStateOverrides {
  attributes?: ComponentData['Attributes'] | null
  variables?: ComponentData['Variables']
  path?: RouteParameters['path'] | null
  query?: RouteParameters['query'] | null
}

export const applyPreviewState = (options: {
  overrides: PreviewStateOverrides | null
  component: Component | null
  dataSignal: Signal<ComponentData>
  ctx: ComponentContext | null
  env: ToddleEnv
  reportFormulaEvaluation?: FormulaEvaluationReporter
  syncOverlayRects?: () => void
}) => {
  const {
    overrides,
    component,
    dataSignal,
    ctx,
    env,
    reportFormulaEvaluation,
    syncOverlayRects,
  } = options
  if (!component) {
    return
  }

  const { Contexts } = dataSignal.get()

  if (component.route) {
    const baseParams = getRouteParams(component.route)
    const baseQuery = getRouteQuery(component.route)
    const params = {
      ...baseParams,
      ...((overrides?.path as Record<string, string> | undefined) ?? {}),
    }
    const query = {
      ...baseQuery,
      ...((overrides?.query as Record<string, string> | undefined) ?? {}),
    }
    const urlParams = { ...query, ...params }

    window.toddle?.locationSignal?.update((location) => ({
      ...location,
      params,
      query,
    }))

    const formulaContext: FormulaContext = {
      component,
      root: document,
      package: ctx?.package,
      toddle: window.toddle,
      env,
      jsonPath: ctx?.jsonPath ?? [],
      reportFormulaEvaluation,
    }

    const baseVariables = getVariableInitialValues(
      component.variables,
      formulaContext,
      {
        Attributes: urlParams,
        Contexts,
      } as ComponentData,
    )
    const variables = {
      ...baseVariables,
      ...(overrides?.variables ?? {}),
    }

    dataSignal.update((data) => ({
      ...data,
      'URL parameters': urlParams,
      Attributes: urlParams,
      Variables: variables,
      Location: data.Location
        ? {
            ...data.Location,
            params,
            query,
          }
        : data.Location,
    }))
  } else {
    const baseAttributes = getAttributeTestValues(component.attributes)
    const attributes = {
      ...baseAttributes,
      ...(overrides?.attributes ?? {}),
    }

    const formulaContext: FormulaContext = {
      component,
      root: document,
      package: ctx?.package,
      toddle: window.toddle,
      env,
      jsonPath: ctx?.jsonPath ?? [],
      reportFormulaEvaluation,
    }

    const baseVariables = getVariableInitialValues(
      component.variables,
      formulaContext,
      {
        Attributes: attributes,
        Contexts,
      } as ComponentData,
    )
    const variables = {
      ...baseVariables,
      ...(overrides?.variables ?? {}),
    }

    dataSignal.update((data) => ({
      ...data,
      Attributes: attributes,
      Variables: variables,
    }))
  }

  syncOverlayRects?.()
}
