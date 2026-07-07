import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import { get } from '@nordcraft/core/dist/utils/collections'
import type { ProjectFiles } from '@nordcraft/ssr/dist/ssr.types'
import type { ComponentWorkflowNode, FixFunction } from '../../../types'

export const renameNamedComponentWorkflowFix: FixFunction<
  ComponentWorkflowNode,
  { name: string; workflowKey: string | number }
> = ({ data, details }) => {
  if (!details) {
    return
  }

  const { path, files } = data
  const { name: newKey, workflowKey: oldKey } = details
  const componentName = String(path[1])

  const updatedFiles = structuredClone(files) as ProjectFiles
  const component = updatedFiles.components[componentName]

  if (!component?.workflows) {
    return
  }

  // 1. Update the workflow key and remove the name property
  const workflow = component.workflows[oldKey]
  if (workflow) {
    component.workflows[newKey] = { ...workflow }
    delete component.workflows[newKey].name
    delete component.workflows[oldKey]
  }

  const getComponent = (name: string) => updatedFiles.components[name]
  const globalFormulas = {
    formulas: updatedFiles.formulas,
    packages: updatedFiles.packages,
  }

  // 2. Update all references within the same component
  const toddleComponent = new ToddleComponent({
    component,
    getComponent,
    packageName: undefined,
    globalFormulas,
  })

  for (const [
    actionPath,
    action,
  ] of toddleComponent.actionModelsInComponent()) {
    if (
      action.type === 'TriggerWorkflow' &&
      action.workflow === String(oldKey)
    ) {
      const fullPath = ['components', componentName, ...actionPath]
      const currentAction = get(updatedFiles, fullPath)
      if (
        currentAction?.type === 'TriggerWorkflow' &&
        currentAction.workflow === String(oldKey)
      ) {
        currentAction.workflow = newKey
      }
    }
  }

  // 3. Update context consumer references
  for (const [otherComponentName, otherComponent] of Object.entries(
    updatedFiles.components,
  )) {
    const context = otherComponent?.contexts?.[componentName]
    const workflowIndex = context?.workflows.indexOf(String(oldKey))
    if (!context || workflowIndex === undefined || workflowIndex === -1) {
      continue
    }

    // Update context subscriptions
    context.workflows[workflowIndex] = newKey

    // Update TriggerWorkflow actions referencing this context provider
    const otherToddleComponent = new ToddleComponent({
      component: otherComponent,
      getComponent,
      packageName: undefined,
      globalFormulas,
    })

    for (const [
      actionPath,
      action,
    ] of otherToddleComponent.actionModelsInComponent()) {
      if (
        action.type === 'TriggerWorkflow' &&
        action.contextProvider === componentName &&
        action.workflow === String(oldKey)
      ) {
        const fullPath = ['components', otherComponentName, ...actionPath]
        const currentAction = get(updatedFiles, fullPath)
        if (
          currentAction?.type === 'TriggerWorkflow' &&
          currentAction.contextProvider === componentName &&
          currentAction.workflow === String(oldKey)
        ) {
          currentAction.workflow = newKey
        }
      }
    }
  }

  return updatedFiles
}
