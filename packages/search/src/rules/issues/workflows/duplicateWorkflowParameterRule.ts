import type { Rule } from '../../../types'

export const duplicateWorkflowParameterRule: Rule<{ parameter: string }> = {
  code: 'duplicate workflow parameter',
  level: 'warning',
  category: 'Quality',
  visit: (report, { nodeType, path, value }) => {
    if (
      nodeType !== 'component-workflow' ||
      !value.parameters ||
      (value.parameters ?? []).length === 0
    ) {
      return
    }
    const parameterNames = new Set<string>()
    value.parameters.forEach((p, i) => {
      if (parameterNames.has(p.name)) {
        report([...path, 'parameters', i], { parameter: p.name })
      }
      parameterNames.add(p.name)
    })
  },
}
