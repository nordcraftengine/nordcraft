import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { ComponentContext, IssueRule, NodeType } from '../../../types'
import { removeContextWorkflowSubscription } from './noReferenceContextWorkflowRule.fix'

/**
 * Rule for checking if a component's context workflow is used anywhere in the component.
 */
export const noReferenceContextWorkflowRule: IssueRule<
  {
    providerName: string
    workflowName: string
  },
  ComponentContext
> = {
  code: 'no-reference context workflow',
  level: 'warning',
  category: 'No References',
  visit: (report, { path, files, value, nodeType, memo }) => {
    if ((nodeType as NodeType['nodeType']) !== 'component-context') {
      return
    }

    if (Object.keys(value.workflows).length === 0) {
      return
    }

    const componentName = path[1] as string
    const componentFile = files.components[componentName]
    if (!componentFile) {
      return
    }

    const usedContextWorkflows = memo(
      `${componentName}-used-context-workflows`,
      () => {
        const component = new ToddleComponent<string>({
          component: componentFile,
          packageName: undefined,
          getComponent: (name) => files.components[name],
          globalFormulas: {
            formulas: files.formulas,
            packages: files.packages,
          },
        })
        const used = new Set<string>()
        for (const [, action] of component.actionModelsInComponent()) {
          if (
            action.type === 'TriggerWorkflow' &&
            typeof action.contextProvider === 'string' &&
            typeof action.workflow === 'string'
          ) {
            // Store as "providerName/workflowName"
            used.add(`${action.contextProvider}/${action.workflow}`)
          }
        }
        return used
      },
    )

    value.workflows.forEach((workflowName) => {
      if (!usedContextWorkflows.has(`${value.componentName}/${workflowName}`)) {
        report({
          path,
          info: {
            title: 'Unused context workflow',
            description: `Context workflow **${workflowName}** from **${value.componentName}** is not used in this component.`,
          },
          details: {
            providerName: value.componentName ?? '',
            workflowName,
          },
          fixes: ['remove-context-workflow-subscription'],
        })
      }
    })
  },
  fixes: {
    'remove-context-workflow-subscription': removeContextWorkflowSubscription,
  },
}

export type NoReferenceContextWorkflowRuleFix =
  'remove-context-workflow-subscription'
