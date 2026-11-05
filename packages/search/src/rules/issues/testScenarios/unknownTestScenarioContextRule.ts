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
  visit: (report, { path, files, value }) => {
    if (!value.contexts) {
      return
    }

    for (const providerKey in value.contexts) {
      const scenarioName = value.contexts[providerKey]
      const providerComponent =
        files.components[providerKey] ??
        (providerKey.includes('/')
          ? files.packages?.[providerKey.split('/')[0]]?.components[
              providerKey.split('/')[1]
            ]
          : undefined)

      if (!providerComponent) {
        report({
          path: [...path, 'contexts', providerKey],
          info: {
            title: 'Unknown context component in test scenario',
            description: `Component **${providerKey}** does not exist.`,
          },
          details: { providerName: providerKey, scenarioName },
          fixes: ['delete-test-scenario-reference'],
        })
        continue
      }

      if (!scenarioName || !providerComponent.testScenarios?.[scenarioName]) {
        report({
          path: [...path, 'contexts', providerKey],
          info: {
            title: 'Unknown test scenario in context provider',
            description: `Scenario **${scenarioName ?? ''}** does not exist in "${providerKey}".`,
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
