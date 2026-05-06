import { set } from '@nordcraft/core/dist/utils/collections'
import type { ComponentContext, FixFunction } from '../../../types'

export const removeContextWorkflowSubscription: FixFunction<
  ComponentContext,
  {
    providerName: string
    workflowName: string
  }
> = ({ data, details }) => {
  if (!details) {
    return
  }
  const { files, path } = data
  const componentName = path[1] as string
  const { providerName, workflowName } = details

  const component = files.components[componentName]
  if (!component) {
    return
  }

  const contexts = component.contexts
  if (!contexts?.[providerName]) {
    return
  }

  const updatedWorkflows = contexts[providerName].workflows.filter(
    (w) => w !== workflowName,
  )

  if (
    updatedWorkflows.length === 0 &&
    contexts[providerName].formulas.length === 0
  ) {
    // If no formulas or workflows remain, we can remove the entire context subscription
    const { [providerName]: _, ...updatedContexts } = contexts
    return set(
      files,
      ['components', componentName, 'contexts'],
      updatedContexts,
    )
  }

  return set(
    files,
    ['components', componentName, 'contexts', providerName, 'workflows'],
    updatedWorkflows,
  )
}
