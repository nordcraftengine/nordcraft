import type { ComponentWorkflow } from '@nordcraft/core/dist/component/component.types'
import type { Rule } from '../../../types'

export const unknownTriggerWorkflowParameterRule: Rule<{ parameter: string }> =
  {
    code: 'unknown trigger workflow parameter',
    level: 'error',
    category: 'Unknown Reference',
    visit: (report, args) => {
      const { path, files, value, nodeType } = args
      if (
        nodeType !== 'action-model' ||
        value.type !== 'TriggerWorkflow' ||
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        Object.entries(value?.parameters ?? {}).length === 0
      ) {
        return
      }

      let workflow: ComponentWorkflow | undefined
      if (typeof value.contextProvider === 'string') {
        const subscription = args.component.contexts?.[value.contextProvider]
        const isSubscribed = subscription?.workflows?.includes(value.workflow)
        if (!isSubscribed || typeof subscription?.componentName !== 'string') {
          return
        }
        workflow = subscription?.package
          ? files.packages?.[subscription.package]?.components[
              subscription.componentName
            ]?.workflows?.[value.workflow]
          : files.components[subscription.componentName]?.workflows?.[
              value.workflow
            ]
        if (!workflow) {
          return
        }
      } else {
        workflow = args.component.workflows?.[value.workflow]
      }
      if (!workflow) {
        return
      }
      const workflowParameters = new Set(
        Object.values(workflow.parameters).map((p) => p.name),
      )
      Object.keys(value.parameters ?? {}).forEach((parameterKey) => {
        if (!workflowParameters.has(parameterKey)) {
          report([...path, 'parameters', parameterKey], {
            parameter: parameterKey,
          })
        }
      })
    },
  }
