import type { ActionModelNode, FixFunction } from '../../../types'

export const addContextSubscription: FixFunction<
  ActionModelNode,
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

  const contexts = { ...component.contexts }
  const context = contexts[providerName] ?? {
    formulas: [],
    workflows: [],
    componentName: providerName,
  }

  if (context.workflows.includes(workflowName)) {
    return
  }

  const updatedContexts = {
    ...contexts,
    [providerName]: {
      ...context,
      workflows: [...context.workflows, workflowName],
    },
  }

  return {
    ...files,
    components: {
      ...files.components,
      [componentName]: {
        ...component,
        contexts: updatedContexts,
      },
    },
  }
}
