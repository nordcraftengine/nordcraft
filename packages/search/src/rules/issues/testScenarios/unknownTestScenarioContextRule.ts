import type { ComponentTestScenarioNode, IssueRule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export type UnknownTestScenarioContextDetails = {
  providerName: string
  scenarioName?: string | null
}

export const unknownTestScenarioContextRule: IssueRule<
  UnknownTestScenarioContextDetails,
  ComponentTestScenarioNode
> = {
  code: 'unknown test scenario context',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'component-test-scenario',
  visit: (report, { path, files, value, component }) => {
    if (!value.contexts) {
      return
    }

    for (const providerKey in value.contexts) {
      const scenarioName = value.contexts[providerKey]
      const contextSubscription = component.contexts?.[providerKey]
      if (!contextSubscription) {
        report({
          path: [...path, 'contexts', providerKey],
          info: {
            title: 'Unknown context provider in test scenario',
            description: `Context provider **${providerKey}** is not subscribed by "${component.name}".`,
          },
          details: { providerName: providerKey, scenarioName },
          fixes: ['delete-test-scenario-reference'],
        })
        continue
      }

      const slashIndex = providerKey.indexOf('/')
      const pkgFromKey =
        slashIndex !== -1 ? providerKey.slice(0, slashIndex) : undefined
      const compFromKey =
        slashIndex !== -1 ? providerKey.slice(slashIndex + 1) : providerKey
      const providerPackage = contextSubscription.package ?? pkgFromKey
      const providerComponentName =
        contextSubscription.componentName ?? compFromKey
      const providerComponent = providerPackage
        ? files.packages?.[providerPackage]?.components[providerComponentName]
        : files.components[providerComponentName]

      if (!providerComponent) {
        report({
          path: [...path, 'contexts', providerKey],
          info: {
            title: 'Unknown context component in test scenario',
            description: `Component **${providerComponentName}** does not exist.`,
          },
          details: { providerName: providerKey, scenarioName },
          fixes: ['delete-test-scenario-reference'],
        })
        continue
      }

      if (
        scenarioName != null &&
        !providerComponent.meta?.testScenarios?.[scenarioName]
      ) {
        report({
          path: [...path, 'contexts', providerKey],
          info: {
            title: 'Unknown test scenario in context provider',
            description: `Scenario **${scenarioName}** does not exist in "${providerKey}".`,
          },
          details: { providerName: providerKey, scenarioName },
          fixes: ['delete-test-scenario-reference'],
        })
      }
    }
  },
  fixes: {
    'delete-test-scenario-reference': removeFromPathFix,
  },
}
