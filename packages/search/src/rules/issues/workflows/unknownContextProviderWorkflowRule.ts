import type { Rule } from '../../../types'

export const unknownContextProviderWorkflowRule: Rule<{
  providerName: string
  workflowName: string
}> = {
  code: 'unknown context provider workflow',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, { path, files, value, nodeType }) => {
    if (
      nodeType !== 'component-context' ||
      !value.componentName ||
      (value.workflows ?? []).length === 0
    ) {
      return
    }

    // Lookup the target component and verify it holds the workflow
    const component = value.package
      ? files.packages?.[value.package]?.components[value.componentName]
      : files.components[value.componentName]
    if (!component) {
      return
    }
    for (const workflowName of value.workflows) {
      if (component.workflows?.[workflowName]?.exposeInContext !== true) {
        report({
          path,
          info: {
            title: 'Unknown context provider workflow',
            description: `**${workflowName}** does not exist on the context provider **${value.componentName}**. Calling an unknown workflow will have no effect. Make sure to define it before using it.`,
          },
          details: {
            providerName: value.componentName,
            workflowName,
          },
        })
      }
    }
  },
}
