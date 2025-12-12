import type { Rule } from '../../../types'

export const unknownWorkflowParameterRule: Rule<{
  parameter: string | number
}> = {
  code: 'unknown workflow parameter',
  level: 'error',
  category: 'Unknown Reference',
  visit: (report, args) => {
    const { path, value, nodeType } = args
    if (
      nodeType !== 'formula' ||
      value.type !== 'path' ||
      // We want a path that looks like ['components', 'componentName', 'workflows', 'workflowName', ...]
      path.length < 4 ||
      path[2] !== 'workflows' ||
      // The path formula would usually look like ['Parameters', 'parameterName']
      value.path[0] !== 'Parameters' ||
      value.path.length < 2
    ) {
      return
    }
    const component = args.component
    if (!component) {
      return
    }
    const [_components, _componentName, _workflows, workflowName] = path
    const [_Parameters, parameterName] = value.path
    const workflowParameters = new Set<string | number>(
      Object.values(component.workflows?.[workflowName]?.parameters ?? {}).map(
        (p) => p.name,
      ),
    )
    if (!workflowParameters.has(parameterName)) {
      report(path, {
        parameter: parameterName,
      })
    }
  },
}
