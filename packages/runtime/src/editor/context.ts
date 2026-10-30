/* eslint-disable no-console */
import type {
  Component,
  ComponentData,
  ComponentVariable,
  Nullable,
} from '@nordcraft/core'
import {
  applyFormula,
  filterObject,
  isDefined,
  mapObject,
  type FormulaContext,
  type ToddleEnv,
} from '@nordcraft/core'
import { getAttributeTestValues, getRouteTestValues } from './componentData'

let cachedComponents: Component[] | null = null
let componentMapCache = new Map<string, Component>()

export function getComponentMap(
  allComponents: Component[],
): Map<string, Component> {
  if (
    allComponents !== cachedComponents &&
    (allComponents.length !== cachedComponents?.length ||
      allComponents.some((c, i) => c !== cachedComponents?.[i]))
  ) {
    cachedComponents = allComponents
    componentMapCache = new Map(allComponents.map((c) => [c.name, c]))
  }
  return componentMapCache
}

export function resetComponentMapCache(): void {
  cachedComponents = null
  componentMapCache = new Map()
}

export function createStaticContextFromComponent(
  component: Component,
  allComponents: Component[],
  options: {
    root?: Document | ShadowRoot
    package?: string
    env: ToddleEnv
    contextProvidersCreated?: Set<string>
    componentMap?: Map<string, Component>
    contextOverrides?: Record<string, Nullable<string>> | null
  },
): Record<string, Record<string, unknown>> {
  const contextProvidersCreated =
    options.contextProvidersCreated ?? new Set<string>()
  contextProvidersCreated.add(component.name)
  const componentMap = options.componentMap ?? getComponentMap(allComponents)

  return mapObject(component.contexts ?? {}, ([providerName, context]) => {
    if (contextProvidersCreated.has(providerName)) {
      // Circular dependency detected in context-providers (ie. A -> B -> A -> ... or even just A -> A -> A ...), stop recursion
      return [providerName, {}]
    }

    const providerComponent = componentMap.get(providerName)
    if (!providerComponent) {
      console.warn(
        `Could not find a provider-component named "${providerName}" in files`,
      )
      return [providerName, {}]
    }

    const override = options.contextOverrides?.[providerName]
    let scenarioKey = override
    if (override === undefined && providerComponent.testScenarios) {
      for (const k in providerComponent.testScenarios) {
        if (providerComponent.testScenarios[k]?.isDefault) {
          scenarioKey = k
          break
        }
      }
    }
    const scenario =
      typeof scenarioKey === 'string'
        ? providerComponent.testScenarios?.[scenarioKey]
        : null

    let providerAttributes = getAttributeTestValues(
      providerComponent.attributes,
    )
    if (scenario?.attributes) {
      providerAttributes = {
        ...providerAttributes,
        ...scenario.attributes,
      }
    }

    const data: ComponentData = {
      Attributes: providerAttributes,
      // Recursively resolve contexts providers before their children to build up the fake context tree in preview mode
      Contexts: createStaticContextFromComponent(
        providerComponent,
        allComponents,
        {
          ...options,
          contextProvidersCreated,
          componentMap,
        },
      ),
    }
    const formulaContext: FormulaContext = {
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
      let urlParams = getRouteTestValues(providerComponent.route)
      if (scenario?.path || scenario?.query) {
        urlParams = {
          ...urlParams,
          ...((scenario?.path as Record<string, string>) ?? {}),
          ...((scenario?.query as Record<string, string>) ?? {}),
        }
      }
      data['URL parameters'] = urlParams
    }
    let providerVariables = mapObject(
      filterObject<Nullable<ComponentVariable>, ComponentVariable>(
        providerComponent.variables ?? {},
        ([_, variable]) => isDefined(variable),
      ),
      ([name, variable]) => [
        name,
        applyFormula(variable.initialValue, formulaContext, data, [
          'variables',
          name,
        ]),
      ],
    )
    if (scenario?.variables) {
      providerVariables = {
        ...providerVariables,
        ...scenario.variables,
      }
    }
    data.Variables = providerVariables

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
            applyFormula(formula.formula, formulaContext, data, [
              'formulas',
              formulaName,
            ]),
          ]
        }),
      ),
    ]
  })
}
