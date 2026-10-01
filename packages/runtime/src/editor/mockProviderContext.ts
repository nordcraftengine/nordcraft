import type {
  Component,
  ComponentAttribute,
  ComponentContext as ComponentContextConfig,
  ComponentData,
  ComponentVariable,
} from '@nordcraft/core/dist/component/component.types'
import type { FormulaContext } from '@nordcraft/core/dist/formula/formula'
import { applyFormula } from '@nordcraft/core/dist/formula/formula'
import type { Nullable } from '@nordcraft/core/dist/types'
import { filterObject, mapObject } from '@nordcraft/core/dist/utils/collections'
import { isDefined } from '@nordcraft/core/dist/utils/util'
import type { Signal } from '../signal/signal'
import type { ComponentContext } from '../types'

/**
 * In the editor preview, and in absence of a real provider, we mock providers
 * with their testData values. This is useful for testing components in
 * isolation.
 *
 * This module is preview-only: it is imported solely by the preview entry
 * (`editor-preview.main.ts`) and exposed to shared runtime code via
 * `toddle._preview.providerContextMock`, so production bundles (`page`,
 * `custom-element`) don't include it.
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
  const formulaContext: FormulaContext = {
    data: {
      Attributes: mapObject(
        filterObject<Nullable<ComponentAttribute>, ComponentAttribute>(
          testProvider.attributes ?? {},
          ([_, attr]) => isDefined(attr),
        ),
        ([name, attr]) => [name, attr.testValue],
      ),
    },
    component: testProvider,
    root: ctx?.root,
    formulaCache: {},
    package: testProviderPackage ?? ctx?.package,
    toddle: ctx.toddle,
    env: ctx.env,
    jsonPath: ctx.jsonPath,
    reportFormulaEvaluation: ctx.reportFormulaEvaluation,
  }

  if (testProvider.route) {
    formulaContext.data['URL parameters'] = {
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
  formulaContext.data.Variables = mapObject(
    filterObject<Nullable<ComponentVariable>, ComponentVariable>(
      testProvider.variables ?? {},
      ([_, variable]) => isDefined(variable),
    ),
    ([name, variable]) => [
      name,
      applyFormula(variable.initialValue, {
        ...formulaContext,
        // We should not report formula evaluations for test data on context providers
        reportFormulaEvaluation: undefined,
      }),
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
            applyFormula(formula.formula, {
              ...formulaContext,
              // We should not report formula evaluations for test data on context providers
              reportFormulaEvaluation: undefined,
            }),
          ]
        }),
      ),
    },
  }))
}
