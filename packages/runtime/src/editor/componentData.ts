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
): Record<string, unknown> =>
  mapObject(
    filterObject<Nullable<ComponentAttribute>, ComponentAttribute>(
      attributes ?? {},
      ([_, attr]) => isDefined(attr),
    ),
    ([name, { testValue }]) => [name, testValue],
  )

export const getRouteParams = (
  route: NonNullable<Component['route']>,
): Record<string, string> =>
  Object.fromEntries(
    route.path
      .filter((p) => p.type === 'param')
      .map((p) => [p.name, p.testValue]),
  )

export const getRouteQuery = (
  route: NonNullable<Component['route']>,
): Record<string, string> =>
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
  canvasTool: string,
): 'div' | 'text' => (canvasTool === 'insert-div' ? 'div' : 'text')

export const getVariableInitialValues = (
  variables: Nullable<Record<string, Nullable<ComponentVariable>>>,
  context: FormulaContext,
): Record<string, unknown> =>
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
