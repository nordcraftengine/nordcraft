import type { ComponentNode, IssueRule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export const duplicateDefaultTestScenarioRule: IssueRule<
  { scenarioKey: string },
  ComponentNode
> = {
  code: 'duplicate default test scenario',
  level: 'warning',
  category: 'Quality',
  nodeTypes: 'component',
  visit: (report, { path, value }) => {
    if (!value.testScenarios) {
      return
    }

    let foundDefault = false
    for (const key in value.testScenarios) {
      const scenario = value.testScenarios[key]
      if (scenario?.isDefault) {
        if (foundDefault) {
          report({
            path: [...path, 'testScenarios', key, 'isDefault'],
            info: {
              title: 'Duplicate default test scenario',
              description: `Multiple test scenarios are marked as default on "${value.name}". Only one scenario should be marked as default.`,
            },
            details: { scenarioKey: key },
            fixes: ['delete-test-scenario-reference'],
          })
        } else {
          foundDefault = true
        }
      }
    }
  },
  fixes: {
    'delete-test-scenario-reference': removeFromPathFix,
  },
}
