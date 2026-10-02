import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type {
  ComponentWorkflowNode,
  FileUpdate,
  FixFunction,
} from '../../../types'

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

  const component = files.components[componentName]

  if (!component?.workflows) {
    return
  }

  // 1. Update the workflow key and remove the name property
  const workflow = component.workflows[oldKey]
  if (!workflow) {
    return
  }

  // 1. If oldKey === newKey, we only need to delete the `name` property.
  // No references need to be updated since the workflow key is unchanged.
  if (String(oldKey) === newKey) {
    return [
      {
        path: ['components', componentName, 'workflows', oldKey, 'name'],
        delete: true,
      },
    ]
  }

  const { name: _, ...cleanWorkflow } = workflow
  const updates: FileUpdate[] = [
    {
      path: ['components', componentName, 'workflows', newKey],
      value: cleanWorkflow,
    },
    {
      path: ['components', componentName, 'workflows', oldKey],
      delete: true,
    },
  ]

  const getComponent = (name: string) => files.components[name]
  const globalFormulas = {
    formulas: files.formulas,
    packages: files.packages,
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
      const targetPath =
        String(oldKey) !== newKey &&
        actionPath[0] === 'workflows' &&
        String(actionPath[1]) === String(oldKey)
          ? [
              'components',
              componentName,
              'workflows',
              newKey,
              ...actionPath.slice(2),
              'workflow',
            ]
          : ['components', componentName, ...actionPath, 'workflow']

      updates.push({
        path: targetPath,
        value: newKey,
      })
    }
  }

  // 3. Update context consumer references
  for (const [otherComponentName, otherComponent] of Object.entries(
    files.components,
  )) {
    const context = otherComponent?.contexts?.[componentName]
    const workflowIndex = context?.workflows.indexOf(String(oldKey))
    if (!context || workflowIndex === undefined || workflowIndex === -1) {
      continue
    }

    // Update context subscriptions
    updates.push({
      path: [
        'components',
        otherComponentName,
        'contexts',
        componentName,
        'workflows',
        workflowIndex,
      ],
      value: newKey,
    })

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
        updates.push({
          path: ['components', otherComponentName, ...actionPath, 'workflow'],
          value: newKey,
        })
      }
    }
  }

  return updates
}
