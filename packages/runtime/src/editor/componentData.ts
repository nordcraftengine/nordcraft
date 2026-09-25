import type {
  Component,
  ComponentAttribute,
  ComponentData,
  ComponentVariable,
} from '@nordcraft/core/dist/component/component.types'
import {
  applyFormula,
  type FormulaContext,
} from '@nordcraft/core/dist/formula/formula'
import type { Nullable } from '@nordcraft/core/dist/types'
import { filterObject, mapObject } from '@nordcraft/core/dist/utils/collections'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { CanvasElementType, CanvasTool } from './types'

export const EMPTY_COMPONENT_DATA: ComponentData = {
  Location: {
    query: {},
    params: {},
    page: '/',
    path: '/',
    hash: '',
  },
  Attributes: {},
  Variables: {},
  Apis: {},
}

export const getAttributeTestValues = (
  attributes?: Nullable<Record<string, Nullable<ComponentAttribute>>>,
) =>
  mapObject(
    filterObject<Nullable<ComponentAttribute>, ComponentAttribute>(
      attributes ?? {},
      ([_, attr]) => isDefined(attr),
    ),
    ([name, { testValue }]) => [name, testValue],
  )

export const getRouteParams = (
  route: NonNullable<Component['route']>,
): Record<string, string> => {
  const params: Record<string, string> = {}
  for (const p of route.path) {
    if (p.type === 'param') {
      params[p.name] = p.testValue
    }
  }
  return params
}

export const getRouteQuery = (route: NonNullable<Component['route']>) =>
  mapObject(
    route.query,
    ([name, { testValue }]: [string, { testValue: string }]) => [
      name,
      testValue,
    ],
  )

export const getRouteTestValues = (route: NonNullable<Component['route']>) => ({
  ...getRouteParams(route),
  ...getRouteQuery(route),
})

export const getElementTypeFromCanvasTool = (
  canvasTool: CanvasTool,
): CanvasElementType => (canvasTool === 'insert-div' ? 'div' : 'text')

export const getVariableInitialValues = (
  variables: Nullable<Record<string, Nullable<ComponentVariable>>>,
  context: FormulaContext,
) =>
  mapObject(
    filterObject<Nullable<ComponentVariable>, ComponentVariable>(
      variables ?? {},
      ([_, variable]) => isDefined(variable),
    ),
    ([name, { initialValue }]) => [
      name,
      applyFormula(initialValue, context, ['variables', name]),
    ],
  )
