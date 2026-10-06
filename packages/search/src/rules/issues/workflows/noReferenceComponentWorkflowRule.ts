import { ToddleComponent } from '@nordcraft/core/dist/component/ToddleComponent'
import type { ComponentWorkflowNode, IssueRule } from '../../../types'
import { getActionsInComponent } from '../../../util/componentTraversal'

export const noReferenceComponentWorkflowRule: IssueRule<
  {
    name: string
    contextSubscribers: string[]
  },
  ComponentWorkflowNode
> = {
  code: 'no-reference component workflow',
  level: 'warning',
  category: 'No References',
  nodeTypes: 'component-workflow',
  visit: (report, args) => {
    const { path, files, value, component, memo } = args

    const [, componentName, , workflowKey] = path
    const targetComponent = files.components[componentName]
    if (!targetComponent) {
      return
    }

    // Shared memoized traversal: previously this walked the whole component
    // once per workflow instead of once per component.
    const workflowTriggers = memo(
      `componentWorkflowTriggers/${component.name}`,
      () =>
        getActionsInComponent(memo, component).filter(
          ({ action }) => action.type === 'TriggerWorkflow',
        ),
    )
    for (const { actionPath, action } of workflowTriggers) {
      if (
        action.type === 'TriggerWorkflow' &&
        action.workflow === workflowKey &&
        // Disregard own workflow reference.
        !(actionPath[0] === 'workflows' && actionPath[1] === workflowKey)
      ) {
        return
      }
    }

    // Short circuit if the component is exported and the workflow is exposed in context, as it is always indirectly used
    if (value.exposeInContext && component.exported) {
      return
    }

    // It is possible that a formula is never used, but still has subscribers
    const contextSubscribers = []
    if (value.exposeInContext) {
      for (const _component of Object.values(files.components)) {
        // Enforce that the component is not undefined since we're iterating
        const component = _component!
        for (const [contextKey, context] of Object.entries(
          component.contexts ?? {},
        )) {
          if (
            contextKey === componentName &&
            context.workflows.includes(workflowKey.toString())
          ) {
            contextSubscribers.push(component.name)
            const contextComponent = new ToddleComponent({
              component,
              getComponent: (name) => files.components[name],
              packageName: undefined,
              globalFormulas: {
                formulas: files.formulas,
                packages: files.packages,
              },
            })
            for (const [
              ,
              action,
            ] of contextComponent.actionModelsInComponent()) {
              if (
                action.type === 'TriggerWorkflow' &&
                action.contextProvider === componentName &&
                action.workflow === workflowKey
              ) {
                return
              }
            }
          }
        }
      }
    }
    const name = value.name ?? String(workflowKey)
    report({
      path,
      info: {
        title: 'Unused component workflow',
        description: `**${name}** is never used by any workflow. Consider removing it.`,
      },
      details: { contextSubscribers, name },
    })
  },
}
