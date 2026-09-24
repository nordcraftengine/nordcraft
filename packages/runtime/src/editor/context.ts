/* eslint-disable no-console */
import type {
  Component,
  ComponentVariable,
} from '@nordcraft/core/dist/component/component.types'
import {
  applyFormula,
  type FormulaContext,
  type ToddleEnv,
} from '@nordcraft/core/dist/formula/formula'
import type { Nullable } from '@nordcraft/core/dist/types'
import { filterObject, mapObject } from '@nordcraft/core/dist/utils/collections'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import { getAttributeTestValues, getRouteTestValues } from './componentData'

export function createStaticContextFromComponent(
  component: Component,
  allComponents: Component[],
  options: {
    root?: Document | ShadowRoot
    package?: string
    env: ToddleEnv
    contextProvidersCreated?: Set<string>
  },
): Record<string, Record<string, unknown>> {
  const contextProvidersCreated =
    options.contextProvidersCreated ?? new Set<string>()
  contextProvidersCreated.add(component.name)
  return mapObject(component.contexts ?? {}, ([providerName, context]) => {
    if (contextProvidersCreated.has(providerName)) {
      // Circular dependency detected in context-providers (ie. A -> B -> A -> ... or even just A -> A -> A ...), stop recursion
      return [providerName, {}]
    }

    const providerComponent = allComponents.find((c) => c.name === providerName)
    if (!providerComponent) {
      console.warn(
        `Could not find a provider-component named "${providerName}" in files`,
      )
      return [providerName, {}]
    }

    // TODO: Should we also run APIs for the provider?
    const formulaContext: FormulaContext = {
      data: {
        Attributes: getAttributeTestValues(providerComponent.attributes),
        // Recursively resolve contexts providers before their children to build up the fake context tree in preview mode
        Contexts: createStaticContextFromComponent(
          providerComponent,
          allComponents,
          {
            ...options,
            contextProvidersCreated,
          },
        ),
      },
      component: providerComponent,
      root: options.root,
      formulaCache: {},
      package: options.package,
      toddle: window.toddle,
      env: options.env,
      jsonPath: [],
      // We don't evaluate formulas in context providers in preview mode currently
      reportFormulaEvaluation: undefined,
    }

    // Pages can also be context-providers!
    // Exposed formulas can derive their preview output from URL data,
    // so we must populate Url parameters with their test data
    if (providerComponent.route) {
      formulaContext.data['URL parameters'] = getRouteTestValues(
        providerComponent.route,
      )
    }
    formulaContext.data.Variables = mapObject(
      filterObject<Nullable<ComponentVariable>, ComponentVariable>(
        providerComponent.variables ?? {},
        ([_, variable]) => isDefined(variable),
      ),
      ([name, variable]) => [
        name,
        applyFormula(variable.initialValue, formulaContext, [
          'variables',
          name,
        ]),
      ],
    )

    return [
      providerName,
      Object.fromEntries(
        context.formulas.map((formulaName) => {
          const formula = providerComponent.formulas?.[formulaName]
          if (!formula) {
            console.warn(
              `Could not find formula "${formulaName}" in component "${providerName}"`,
            )
            return [formulaName, null]
          }

          return [
            formulaName,
            applyFormula(formula.formula, formulaContext, [
              'formulas',
              formulaName,
            ]),
          ]
        }),
      ),
    ]
  })
}
