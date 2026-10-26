import type {
  Component,
  ComponentData,
  FormulaContext,
  FormulaEvaluationReporter,
  TestScenario,
  ToddleEnv,
} from '@nordcraft/core'
import type { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import {
  getAttributeTestValues,
  getRouteParams,
  getRouteQuery,
  getVariableInitialValues,
} from './componentData'
import { createStaticContextFromComponent } from './context'

export type PreviewStateOverrides = TestScenario

export const applyPreviewState = (options: {
  overrides: TestScenario | null | undefined
  component: Component | null
  components?: Component[]
  dataSignal: Signal<ComponentData>
  ctx: ComponentContext | null
  env: ToddleEnv
  reportFormulaEvaluation?: FormulaEvaluationReporter
  syncOverlayRects?: () => void
}) => {
  const {
    overrides,
    component,
    components,
    dataSignal,
    ctx,
    env,
    reportFormulaEvaluation,
    syncOverlayRects,
  } = options
  if (!component) {
    return
  }

  const allComponents = components ?? ctx?.components ?? []
  let Contexts = dataSignal.get().Contexts
  if (component.contexts && allComponents.length > 0) {
    Contexts = createStaticContextFromComponent(component, allComponents, {
      root: ctx?.root,
      package: ctx?.package,
      env,
      contextOverrides: overrides?.contexts,
    })
  }

  const currentApis = dataSignal.get().Apis ?? {}
  const apis = overrides?.apis
    ? {
        ...currentApis,
        ...overrides.apis,
      }
    : overrides === null
      ? {}
      : currentApis

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
      Contexts,
      Apis: apis,
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
      Contexts,
      Apis: apis,
    }))
  }

  syncOverlayRects?.()
}
