import type { ComponentTestScenarioNode, IssueRule } from '../../../types'
import { removeFromPathFix } from '../../../util/removeUnused.fix'

export type DeleteTestScenarioReferenceFix = 'delete-test-scenario-reference'

export type UnknownTestScenarioDataDetails = {
  name: string
  type: 'attribute' | 'variable' | 'api' | 'path-parameter' | 'query-parameter'
}

export const unknownTestScenarioDataRule: IssueRule<
  UnknownTestScenarioDataDetails,
  ComponentTestScenarioNode
> = {
  code: 'unknown test scenario data',
  level: 'error',
  category: 'Unknown Reference',
  nodeTypes: 'component-test-scenario',
  visit: (report, { path, value, component }) => {
    if (value.attributes) {
      for (const key in value.attributes) {
        if (!component.attributes?.[key]) {
          report({
            path: [...path, 'attributes', key],
            info: {
              title: 'Unknown attribute in test scenario',
              description: `**${key}** is not a valid attribute of "${component.name}".`,
            },
            details: { name: key, type: 'attribute' },
            fixes: ['delete-test-scenario-reference'],
          })
        }
      }
    }

    if (value.variables) {
      for (const key in value.variables) {
        if (!component.variables?.[key]) {
          report({
            path: [...path, 'variables', key],
            info: {
              title: 'Unknown variable in test scenario',
              description: `**${key}** is not a valid variable of "${component.name}".`,
            },
            details: { name: key, type: 'variable' },
            fixes: ['delete-test-scenario-reference'],
          })
        }
      }
    }

    if (value.apis) {
      for (const key in value.apis) {
        if (!component.apis?.[key]) {
          report({
            path: [...path, 'apis', key],
            info: {
              title: 'Unknown API in test scenario',
              description: `**${key}** is not a valid API of "${component.name}".`,
            },
            details: { name: key, type: 'api' },
            fixes: ['delete-test-scenario-reference'],
          })
        }
      }
    }

    if (value.path) {
      for (const key in value.path) {
        let isValid = false
        if (component.route?.path) {
          for (const segment of component.route.path) {
            if (segment.type === 'param' && segment.name === key) {
              isValid = true
              break
            }
          }
        }
        if (!isValid) {
          report({
            path: [...path, 'path', key],
            info: {
              title: 'Unknown path parameter in test scenario',
              description: `**${key}** is not a valid path parameter for "${component.name}".`,
            },
            details: { name: key, type: 'path-parameter' },
            fixes: ['delete-test-scenario-reference'],
          })
        }
      }
    }

    if (value.query) {
      for (const key in value.query) {
        let isValid = false
        if (component.route?.query) {
          if (component.route.query[key]) {
            isValid = true
          } else {
            for (const qKey in component.route.query) {
              if (component.route.query[qKey]?.name === key) {
                isValid = true
                break
              }
            }
          }
        }
        if (!isValid) {
          report({
            path: [...path, 'query', key],
            info: {
              title: 'Unknown query parameter in test scenario',
              description: `**${key}** is not a valid query parameter for "${component.name}".`,
            },
            details: { name: key, type: 'query-parameter' },
            fixes: ['delete-test-scenario-reference'],
          })
        }
      }
    }
  },
  fixes: {
    'delete-test-scenario-reference': removeFromPathFix,
  },
}
