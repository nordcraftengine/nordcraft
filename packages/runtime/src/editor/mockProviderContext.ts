import type {
  Component,
  ComponentAttribute,
  ComponentContext as ComponentContextConfig,
  ComponentData,
  ComponentVariable,
  FormulaContext,
  Nullable,
} from '@nordcraft/core'
import {
  applyFormula,
  filterObject,
  isDefined,
  mapObject,
} from '@nordcraft/core'
import type { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'

/**
 * In the editor preview, and in absence of a real provider, we mock providers
 * with their testData values. This is useful for testing components in
 * isolation.
 */
export function providerContextMock({
  componentDataSignal,
  component,
  ctx,
  providerName,
  context,
}: {
  componentDataSignal: Signal<ComponentData>
  component: Component
  ctx: ComponentContext
  providerName: string
  context: ComponentContextConfig
}) {
  const testProvider = ctx.components?.find(
    (comp) =>
      comp.name === [ctx.package, providerName].filter(isDefined).join('/'),
  )

  if (!testProvider) {
    // eslint-disable-next-line no-console
    console.error(
      `Component error(${component.name}): Could not find provider "${providerName}". No such component exist.`,
    )
    return
  }

  // Derive the package name from the provider name as we do not have a real component to work with
  const [, testProviderPackage] = providerName.split('/').reverse()
  const testData: ComponentData = {
    Attributes: mapObject(
      filterObject<Nullable<ComponentAttribute>, ComponentAttribute>(
        testProvider.attributes ?? {},
        ([_, attr]) => isDefined(attr),
      ),
      ([name, attr]) => [name, attr.testValue],
    ),
  }
  const formulaContext: FormulaContext = {
    component: testProvider,
    root: ctx?.root,
    formulaCache: {},
    package: testProviderPackage ?? ctx?.package,
    toddle: ctx.toddle,
    env: ctx.env,
    jsonPath: ctx.jsonPath,
    // We should not report formula evaluations for test data on context providers
    reportFormulaEvaluation: undefined,
  }

  if (testProvider.route) {
    testData['URL parameters'] = {
      ...Object.fromEntries(
        testProvider.route.path
          .filter((p) => p.type === 'param')
          .map((p) => [p.name, p.testValue]),
      ),
      ...mapObject(testProvider.route.query, ([name, { testValue }]) => [
        name,
        testValue,
      ]),
    }
  }
  testData.Variables = mapObject(
    filterObject<Nullable<ComponentVariable>, ComponentVariable>(
      testProvider.variables ?? {},
      ([_, variable]) => isDefined(variable),
    ),
    ([name, variable]) => [
      name,
      applyFormula(variable.initialValue, formulaContext, testData),
    ],
  )

  componentDataSignal.update((data) => ({
    ...data,
    Contexts: {
      ...data.Contexts,
      [providerName]: Object.fromEntries(
        context.formulas.map((formulaName) => {
          const formula = testProvider.formulas?.[formulaName]
          if (!formula) {
            // eslint-disable-next-line no-console
            console.warn(
              `Component error(${component.name}): Could not find formula "${formulaName}" in provider "${providerName}"`,
            )
            return [formulaName, null]
          }

          return [
            formulaName,
            applyFormula(formula.formula, formulaContext, testData),
          ]
        }),
      ),
    },
  }))
}
